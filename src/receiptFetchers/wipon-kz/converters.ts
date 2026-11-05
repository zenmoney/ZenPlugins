import { load } from 'cheerio'
import type { Receipt, ReceiptItem, ReceiptPayment } from '../../types/receiptFetcher'
import { decimal, divideExact } from '../../common/decimal'
import { assertReceipt, optional, text } from '../../common/receiptFetcher/receipt'

const number = (value: string): string => decimal(value.replace(/[\s₸]/g, '').replace('−', '-').replace(',', '.'))

export function convertReceipt (source: unknown): Receipt {
  assert(typeof source === 'string', 'Expected Wipon receipt HTML')
  const $ = load(source)
  const modern = $('.check-table').length === 1
  const table = modern ? $('.check-table') : $('.sale-check')
  assert(table.length === 1, 'Missing Wipon receipt table')
  const body = table.text().replace(/\s+/g, ' ')
  assert(body.includes('₸'), 'Missing receipt currency')
  const rows = table.children('thead,tbody').children('tr').toArray()
  const cells = rows.map(row => $(row).children('td').toArray().map(cell => $(cell).text().replace(/\s+/g, ' ').trim()))
  const items: ReceiptItem[] = []
  const payments: ReceiptPayment[] = []
  let item: ReceiptItem | undefined
  let totalAmount: string | undefined
  for (const row of cells) {
    if (row.length === 1 && /^\d+\. /.test(row[0])) {
      if (item !== undefined) { assert(item.quantity !== '' && item.totalAmount !== '', 'Incomplete receipt item'); items.push(item) }
      item = { name: row[0].replace(/^\d+\. /, ''), quantity: '', totalAmount: '' }
      continue
    }
    const quote = row[0]?.match(/^([\d.,]+)(?: (.+?))?\s*[×x]\s*([\d\s.,]+)\s*₸?$/)
    if (quote !== null && quote !== undefined) {
      assert(item !== undefined && row.length === 2, 'Unexpected receipt price row')
      item.quantity = number(quote[1])
      item.unitPrice = number(quote[3])
      item.totalAmount = number(row[1].replace(/^=\s*/, ''))
      if (quote[2] !== undefined) item.unit = quote[2]
      continue
    }
    if (/^(?:Жеңілдік \/ )?Скидка$/.test(row[0])) {
      assert(item !== undefined && item.adjustments === undefined && row.length === 2, 'Unexpected receipt discount')
      item.originalUnitPrice = item.unitPrice
      item.originalTotalAmount = item.totalAmount
      item.adjustments = [{ kind: 'discount', amount: number(row[1]) }]
      delete item.unitPrice
      // The following source "Стоимость" row supplies the final contribution.
      item.totalAmount = ''
      continue
    }
    if (/^(?:Құны \/ )?Стоимость$/.test(row[0])) {
      assert(item !== undefined && row.length === 2, 'Unexpected receipt final line')
      item.totalAmount = number(row[1])
      if (item.adjustments !== undefined) Object.assign(item, optional('unitPrice', divideExact(item.totalAmount, item.quantity)))
      continue
    }
    if (/^(?:БАРЛЫҒЫ \/ )?ИТОГО:$/.test(row[0])) {
      assert(row.length === 2 && totalAmount === undefined, 'Ambiguous receipt total')
      totalAmount = number(row[1])
      continue
    }
    if (totalAmount !== undefined && /^(?:Қолма-қол \/ )?Наличные:?$|^Карта:?$/.test(row[0])) {
      payments.push({ method: row[0].includes('Наличные') ? 'cash' : 'card', amount: number(row[1]) })
    }
    if (item !== undefined && totalAmount === undefined) {
      assert(row.every(cell => cell === '') || (row.length === 1 && /^(?:NTIN|XTIN): /.test(row[0])), 'Unsupported Wipon item row')
    }
  }
  if (item !== undefined) { assert(item.quantity !== '' && item.totalAmount !== '', 'Incomplete receipt item'); items.push(item) }
  const date = modern
    ? body.match(/Дата: (\d{2})\.(\d{2})\.(\d{4}) · Уақыты \/ Время: (\d{2}:\d{2})/)
    : body.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}:\d{2}:\d{2})/)
  assert(date !== null, 'Missing receipt timestamp')
  const tin = body.match(/(БСН \/ БИН:|БИН\/ИИН) (\d+)/)
  const org = modern ? $('.text-org').first().text() : table.find('h4').first().text()
  const address = modern
    ? $('.text-org').toArray().map(node => $(node).text().trim()).find(value => /^(?:г\.|р-н)/.test(value))
    : body.match(/Адрес: (.+)$/)?.[1]
  const receipt: Receipt = {
    completeness: 'full',
    currency: 'KZT',
    operation: /(?:ПРОДАЖА|Продажа)/.test(body) ? 'sale' : 'unknown',
    issuedAt: { date: modern ? `${date[3]}-${date[2]}-${date[1]}` : `${date[1]}-${date[2]}-${date[3]}`, time: date[4] },
    totalAmount: totalAmount ?? '',
    merchant: { ...optional('name', text(org)), ...optional('address', text(address)), ...(tin === null ? {} : { identifiers: [{ value: tin[2], countryCode: 'KZ', scheme: tin[1] === 'БСН / БИН:' ? 'BIN' : 'IIN/BIN' }] }) },
    items,
    ...(payments.length === 0 ? {} : { payments })
  }
  // The printed VAT summary overlaps item amounts; do not add it at document scope.
  assertReceipt(receipt)
  return receipt
}
