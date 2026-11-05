import { load } from 'cheerio'
import type { Receipt } from '../../types/receiptFetcher'
import { decimal, divideExact, subtract } from '../../common/decimal'
import { assertReceipt, optional } from '../../common/receiptFetcher/receipt'

export function convertReceipt (source: unknown): Receipt {
  assert(typeof source === 'string', 'Expected VS receipt HTML')
  const $ = load(source)
  const rows = $('tr').toArray().map(row => $(row).children('td,th').toArray().map(cell => $(cell).text().replace(/\s+/g, ' ').trim()))
  const field = (label: string): string => { const row = rows.find(row => row.length === 2 && row[0] === label); assert(row !== undefined, 'Missing VS field', { field: label }); return row[1] }
  assert(field('Νόμισμα') === 'EUR', 'Unsupported VS receipt currency')
  const document = rows.find(row => row.length === 3 && /^\d{2}\/\d{2}\/\d{4}/.test(row[2]))
  assert(document !== undefined, 'Missing VS document header')
  const date = document[2].match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2})$/)
  assert(date !== null, 'Invalid VS timestamp')
  const body = $('body').text().replace(/\s+/g, ' ')
  const tin = body.match(/ΑΦΜ (\d+)/)?.[1]
  const id = body.match(/UNIQUE ID ([A-F0-9]+)/)?.[1]
  const receipt: Receipt = {
    completeness: 'full',
    currency: 'EUR',
    operation: document[0] === 'ΑΛΠ' ? 'sale' : 'unknown',
    ...optional('id', id),
    issuedAt: { date: `${date[3]}-${date[2]}-${date[1]}`, time: date[4] },
    totalAmount: decimal(field('ΠΛΗΡΩΤΕΟ ΠΟΣΟ ΠΕΛΑΤΗ')),
    merchant: { name: $('h4').first().text().trim(), ...(tin === undefined ? {} : { identifiers: [{ value: tin, countryCode: 'GR', scheme: 'VAT' }] }) },
    items: $('tr.avoid-page-break').first().closest('table').find('tbody tr').toArray().filter(row => $(row).children('td').length > 0).map(row => {
      const cells = $(row).children('td').toArray().map(cell => $(cell).text().trim())
      assert(cells.length === 12, 'Unsupported VS item columns')
      const total = decimal(cells[10]); const quantity = decimal(cells[2])
      return {
        name: cells[1],
        quantity,
        unit: cells[3],
        totalAmount: total,
        originalUnitPrice: decimal(cells[4]),
        originalTotalAmount: decimal(cells[5]),
        ...optional('unitPrice', divideExact(total, quantity)),
        adjustments: [
          { kind: 'surcharge' as const, amount: decimal(cells[6]) },
          { kind: 'discount' as const, amount: subtract('0', cells[7]) },
          { kind: 'tax' as const, name: 'ΦΠΑ', amount: decimal(cells[9]), baseAmount: decimal(cells[8]), percent: decimal(cells[11]) }
        ]
      }
    }),
    payments: rows.filter(row => row.length === 7 && row[0] === 'Μετρητά').map(row => ({ method: 'cash', amount: decimal(row[1]) }))
  }
  assertReceipt(receipt)
  return receipt
}
