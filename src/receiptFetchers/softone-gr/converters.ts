import { load } from 'cheerio'
import type { Receipt } from '../../types/receiptFetcher'
import { decimal, divideExact } from '../../common/decimal'
import { assertReceipt, optional } from '../../common/receiptFetcher/receipt'

const number = (value: string): string => decimal(value.trim().replace(/\./g, '').replace(',', '.'))

export function convertReceipt (source: unknown): Receipt {
  assert(typeof source === 'string', 'Expected SoftOne receipt HTML')
  const $ = load(source)
  const field = (label: string): string => {
    const values = $('tr').toArray().filter(row => $(row).children('th,td').length === 2 && $(row).children().first().text().trim() === label).map(row => $(row).children().last().text().trim())
    assert(values.length === 1, 'Missing or ambiguous SoftOne field', { field: label })
    return values[0]
  }
  const currency = field('Νόμισμα')
  const date = field('Ημερομηνία Έκδοσης').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  const clock = $('body').text().replace(/\s+/g, ' ').match(/Ημερομηνία Έκδοσης \d{2}\/\d{2}\/\d{4} (\d{1,2}):(\d{2}) (π\.μ\.|μ\.μ\.)/)
  assert(date !== null && currency === 'EUR', 'Invalid receipt date or currency')
  const table = $('table').filter((_, node) => $(node).find('td.field-EliseCore-Details-Description1').length > 0)
  assert(table.length === 1, 'Missing or duplicate SoftOne item table')
  const receipt: Receipt = {
    completeness: 'full',
    currency,
    id: field('Αναγνωριστικό Παραστατικού'),
    operation: field('Είδος Παραστατικού') === '11.1' ? 'sale' : 'unknown',
    issuedAt: {
      date: `${date[3]}-${date[2].padStart(2, '0')}-${date[1].padStart(2, '0')}`,
      ...(clock === null ? {} : { time: `${String(Number(clock[1]) % 12 + (clock[3] === 'μ.μ.' ? 12 : 0)).padStart(2, '0')}:${clock[2]}` })
    },
    totalAmount: number(field('Συνολική Αξία')),
    merchant: {
      name: $('.field-EliseCore-Issuer-RegisteredName .value').text().trim(),
      address: $('.field-EliseCore-Issuer-BranchAddress-Street .value').text().trim(),
      identifiers: [{ value: $('.field-EliseCore-Issuer-Vat .value').text().trim(), countryCode: 'GR', scheme: 'VAT' }]
    },
    items: table.find('tbody > tr').toArray().map(row => {
      const value = (name: string): string => $(row).children(`td.field-${name}`).text().trim()
      const total = number(value('Total'))
      const quantity = number(value('EliseCore-Details-Quantity'))
      return {
        name: value('EliseCore-Details-Description1'),
        quantity,
        unit: value('MeasurementUnit'),
        totalAmount: total,
        ...optional('unitPrice', divideExact(total, quantity)),
        originalUnitPrice: number(value('EliseCore-Details-CatalogUnitPrice')),
        originalTotalAmount: number(value('EliseCore-Details-CatalogTotal')),
        adjustments: [{ kind: 'tax' as const, name: 'ΦΠΑ', amount: number(value('VATTotal')), baseAmount: number(value('NetTotal')), percent: number(value('EliseCore-Details-VatCategory').replace('ΦΠΑ', '').replace('%', '')) }]
      }
    }),
    payments: [{ method: field('Τύπος Πληρωμής') === '7' ? 'card' : 'other', amount: number(field('Αναλογούν Ποσό')) }]
  }
  // Net tax base is not a reported pre-adjustment document subtotal.
  assertReceipt(receipt)
  return receipt
}
