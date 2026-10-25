import get from '../../types/get'
import { load } from 'cheerio'
import type { Receipt, ReceiptItem, ReceiptPayment } from '../../types/receiptFetcher'
import { decimal, divideExact } from '../../common/decimal'
import { assertReceipt, localDateTime, optional, text } from '../../common/receiptFetcher/receipt'

export function convertReceipt (data: unknown): Receipt {
  if (typeof data === 'string') return convertHtmlReceipt(data)
  return convertLegacyReceipt(data)
}

function convertLegacyReceipt (data: unknown): Receipt {
  const sourceItems: unknown = get(data, 'doc.items')
  assert(Array.isArray(sourceItems), 'Missing receipt items')
  assert(get(data, 'doc.header.currency') === 'BYN', 'Unexpected receipt currency')
  const payments = [
    ...(get(data, 'doc.cash') == null ? [] : [{ method: 'cash', amount: decimal(get(data, 'doc.cash')) }]),
    ...(get(data, 'doc.cashless') == null ? [] : [{ method: 'cashless', amount: decimal(get(data, 'doc.cashless')) }])
  ]
  const receipt = {
    completeness: 'full',
    ...optional('id', text(get(data, 'uid'))),
    currency: 'BYN',
    operation: get(data, 'doc.doc_type') === 'SALE' ? 'sale' : 'unknown',
    issuedAt: localDateTime(get(data, 'doc.header.date')),
    totalAmount: decimal(get(data, 'doc.total_to_pay')),
    merchant: {
      ...optional('name', text(get(data, 'trade_point.name'))),
      ...optional('address', text(get(data, 'trade_point.location'))),
      ...(get(data, 'company_unp') == null ? {} : { identifiers: [{ value: String(get(data, 'company_unp')), countryCode: 'BY' }] })
    },
    ...(payments.length > 0 ? { payments } : {}),
    items: sourceItems.map((item: unknown) => ({
      totalAmount: decimal(get(item, 'sum')),
      name: String(get(item, 'code.code')),
      ...optional('unitPrice', decimal(get(item, 'count')) === '0' ? undefined : divideExact(get(item, 'sum'), get(item, 'count'))),
      quantity: decimal(get(item, 'count'))
    }))
  }
  assertReceipt(receipt)
  return receipt
}

function convertHtmlReceipt (html: string): Receipt {
  const $ = load(html)
  for (const selector of ['#receipt', '#header', '#receiptBody', '#footer']) {
    assert($(selector).length === 1, 'Missing or duplicate receipt section', { section: selector })
  }
  const lines = (selector: string): string[] => $(selector).children('pre').toArray().map(node => $(node).text().trim())
  const header = lines('#header')
  const footer = lines('#footer')
  const taxIndex = header.findIndex(line => /^УНП \d{9}\s+РН СККО \d+$/.test(line))
  assert(taxIndex > 0 && header[taxIndex + 1] === 'Платежный документ', 'Unsupported receipt document header')
  const unp = header[taxIndex].match(/^УНП (\d{9})/)?.[1]
  assert(unp !== undefined, 'Missing source merchant UNP')
  const merchantLines = header.slice(0, taxIndex)
  const address = /^г\.\s/.test(merchantLines[merchantLines.length - 1]) ? merchantLines.pop() : undefined
  const idLines = footer.map(line => line.match(/^УИ ([A-Za-z0-9]{24})$/)).filter(match => match !== null)
  assert(idLines.length === 1 && idLines[0] !== null, 'Missing or ambiguous source receipt identifier')
  const dates = footer.map(line => line.match(/^Кассир:.*?(\d{2})\.(\d{2})\.(\d{4}) (\d{2}:\d{2}:\d{2})$/)).filter(match => match !== null)
  assert(dates.length === 1 && dates[0] !== null, 'Missing or ambiguous source receipt timestamp')
  const timestamp = dates[0]

  const body = $('#receiptBody')
  assert(body.children().toArray().every(node => get(node, 'name') === 'pre'), 'Unexpected receipt body structure')
  const bodyLines = lines('#receiptBody')
  assert(/^Цена\s+Кол-во\s+Итого$/.test(bodyLines[0]), 'Missing receipt item column headings')
  const items: ReceiptItem[] = []
  const payments: ReceiptPayment[] = []
  let name: string[] = []
  let totalAmount: string | undefined
  for (const [index, line] of bodyLines.slice(1).entries()) {
    if (line === '' || /^[-─]+$/.test(line)) continue
    const total = line.match(/^ИТОГО К ОПЛАТЕ\s+(-?\d+\.\d+)$/)
    if (total !== null) {
      assert(totalAmount === undefined && name.length === 0, 'Unexpected receipt total or incomplete item', { line: index })
      totalAmount = decimal(total[1])
      continue
    }
    if (totalAmount !== undefined) {
      const payment = line.match(/^(Банк\. пл\. картой|Наличными):\s+(-?\d+\.\d+)$/)
      assert(payment !== null, 'Unsupported receipt settlement line', { line: index })
      payments.push({ method: payment[1] === 'Банк. пл. картой' ? 'card' : 'cash', amount: decimal(payment[2]) })
      continue
    }
    const item = line.match(/^(-?\d+\.\d+)\s+\*(-?\d+\.\d+)\s+(-?\d+\.\d+)$/)
    if (item !== null) {
      assert(name.length > 0, 'Missing receipt item name', { line: index })
      items.push({ name: name.join(' '), unitPrice: decimal(item[1]), quantity: decimal(item[2]), totalAmount: decimal(item[3]) })
      name = []
    } else {
      // Do not merge unparsed price/adjustment rows into the next product's name.
      // Additional printed adjustment layouts need captured provider examples.
      assert(!/^(?:Скидка|Надбавка|Наценка|НДС|Налог|ИТОГО)(?:\s|:|$)/i.test(line) && !/^[-+\d.,]+\s*[*×]/.test(line), 'Unsupported receipt item line', { line: index })
      name.push(line)
    }
  }
  assert(name.length === 0 && totalAmount !== undefined, 'Incomplete receipt items or missing total')

  // iKassa prints sale/refund/annulment documents in BYN, including duty-free
  // multi-currency payments. This is a provider guarantee, not a country default:
  // https://tsrv-new.int.imlab.by/print.html#формирование-и-передача-документов-для-магазинов-беспошлинной-торговли
  // Cash-in/out documents have other currency rules and are not itemized payment documents.
  const receipt = {
    completeness: 'full',
    id: idLines[0][1],
    currency: 'BYN',
    operation: 'unknown',
    issuedAt: { date: `${timestamp[3]}-${timestamp[2]}-${timestamp[1]}`, time: timestamp[4] },
    totalAmount,
    merchant: {
      ...optional('name', text(merchantLines.join(' '))),
      ...optional('address', address),
      identifiers: [{ value: unp, countryCode: 'BY', scheme: 'UNP' }]
    },
    ...(payments.length > 0 ? { payments } : {}),
    items
  }
  assertReceipt(receipt)
  return receipt
}
