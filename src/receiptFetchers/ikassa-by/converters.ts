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

const itemColumns = /^Цена\s+Кол-во\s+Итого$/
const merchantRegistration = /^УНП (\d{9})\s+РН С(?:КК|KK)О \d+$/

function readHtmlReceipt (html: string): { header: string[], body: string[], footer: string[], flat: boolean } {
  const $ = load(html)
  const receipt = $('#receipt')
  assert(receipt.length === 1, 'Missing or duplicate receipt section', { section: '#receipt' })

  const selectors = ['#header', '#receiptBody', '#footer']
  const sections = selectors.map(selector => receipt.find(selector))
  if (sections.some(section => section.length > 0)) {
    const [header, body, footer] = sections.map((section, index) => {
      assert(section.length === 1, 'Missing or duplicate receipt section', { section: selectors[index] })
      return section.children('pre').toArray().map(node => $(node).text().trim())
    })
    assert(sections[1].children().length === body.length, 'Unexpected receipt body structure')
    return { header, body, footer, flat: false }
  }

  // The first QR follows the fiscal footer. A card slip or coupon can follow it.
  const children = receipt.children().toArray()
  const qrIndex = children.findIndex(node => $(node).is('div.qr.text-center') && $(node).children('svg').length === 1)
  assert(qrIndex > 0, 'Missing fiscal receipt QR')
  const fiscalRows = children.slice(0, qrIndex)
  assert(fiscalRows.every(node => $(node).is('pre')), 'Unexpected flat receipt structure')
  const lines = fiscalRows.map(node => $(node).text().trim())
  const bodyIndex = lines.findIndex(line => itemColumns.test(line))
  const footerIndex = lines.length - 2
  assert(bodyIndex > 0 && bodyIndex < footerIndex, 'Missing receipt item column headings')
  return {
    header: lines.slice(0, bodyIndex),
    body: lines.slice(bodyIndex, footerIndex),
    footer: lines.slice(footerIndex),
    flat: true
  }
}

function stripPrintedBarcode (line: string): string {
  const match = line.match(/^(\[M\]\s+)?(\d{8}|\d{13})\s+(\S.*)$/)
  if (match === null) return line
  const [, marking, barcode, itemName] = match
  const checksum = [...barcode].reverse().reduce((sum, digit, index) => sum + Number(digit) * (index % 2 === 0 ? 1 : 3), 0)
  return checksum % 10 === 0 ? (marking ?? '') + itemName : line
}

function convertHtmlReceipt (html: string): Receipt {
  const { header, body: bodyLines, footer, flat } = readHtmlReceipt(html)
  const taxIndex = header.findIndex(line => merchantRegistration.test(line))
  assert(taxIndex > 0 && header[taxIndex + 1] === 'Платежный документ', 'Unsupported receipt document header')
  const unp = header[taxIndex].match(merchantRegistration)?.[1]
  assert(unp !== undefined, 'Missing source merchant UNP')
  const merchantLines = header.slice(0, taxIndex)
  const address = /^г\.\s/.test(merchantLines[merchantLines.length - 1]) ? merchantLines.pop() : undefined
  const idLines = footer.map(line => line.match(/^УИ ([A-Za-z0-9]{24})$/)).filter(match => match !== null)
  assert(idLines.length === 1 && idLines[0] !== null, 'Missing or ambiguous source receipt identifier')
  const dates = footer.map(line => line.match(/^Кассир:.*?(\d{2})\.(\d{2})\.(\d{4}) (\d{2}:\d{2}:\d{2})$/)).filter(match => match !== null)
  assert(dates.length === 1 && dates[0] !== null, 'Missing or ambiguous source receipt timestamp')
  const timestamp = dates[0]

  assert(itemColumns.test(bodyLines[0]), 'Missing receipt item column headings')
  const items: ReceiptItem[] = []
  const payments: ReceiptPayment[] = []
  let name: string[] = []
  let originalTotalAmount: string | undefined
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
    assert(originalTotalAmount === undefined, 'Unexpected line between receipt subtotal and total', { line: index })
    const subtotal = line.match(/^ИТОГО\s+(-?\d+\.\d+)$/)
    if (subtotal !== null) {
      assert(items.length > 0 && name.length === 0, 'Unexpected receipt subtotal or incomplete item', { line: index })
      originalTotalAmount = decimal(subtotal[1])
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
      const previous = name[name.length - 1]
      if (flat && name.length === 0) name.push(stripPrintedBarcode(line))
      else if (flat && /\p{L}[-/]$/u.test(previous) && /^\p{Ll}/u.test(line)) name[name.length - 1] = previous + line
      else name.push(line)
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
    ...optional('originalTotalAmount', originalTotalAmount),
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
