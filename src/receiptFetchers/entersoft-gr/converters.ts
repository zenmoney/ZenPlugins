import { load } from 'cheerio'
import type { Receipt } from '../../types/receiptFetcher'
import { decimal, divideExact, subtract } from '../../common/decimal'
import { assertReceipt, optional } from '../../common/receiptFetcher/receipt'

const number = (value: string): string => decimal(value.trim().replace(/\./g, '').replace(',', '.'))

export function convertReceipt (source: unknown): Receipt {
  assert(typeof source === 'string', 'Expected Entersoft invoice HTML')
  const $ = load(source)
  const body = $('body').text().replace(/\s+/g, ' ').trim()
  const value = (label: string): string => {
    const row = $('div.row').toArray().find(row => $(row).children('div').length === 2 && $(row).children().first().text().trim() === label)
    assert(row !== undefined, 'Missing Entersoft field', { field: label })
    return $(row).children().last().text().trim()
  }
  const money = (label: string): string => { const raw = value(label); assert(raw.endsWith('EUR'), 'Unsupported Entersoft currency'); return number(raw.slice(0, -3)) }
  const date = body.match(/Ημ\/νία έκδοσης: (\d{2})-(\d{2})-(\d{4})/)
  const seller = $('.BoldBlueHeader.fontSize12pt').first()
  const sellerDetails = seller.siblings('.fontSize8pt').toArray().map(node => $(node).text().trim()).filter(Boolean)
  const taxId = sellerDetails.find(value => /^Α\.Φ\.Μ:/.test(value))?.match(/^Α\.Φ\.Μ:\s*(\d+)$/)?.[1]
  const address = sellerDetails.filter(value => !value.startsWith('Α.Φ.Μ:')).join(' ')
  assert(date !== null && seller.text().trim() !== '' && taxId !== undefined, 'Missing Entersoft date or merchant')
  const receipt: Receipt = {
    completeness: 'full',
    currency: 'EUR',
    operation: body.includes('Απόδειξη Λιανικής Πώλησης') ? 'sale' : 'unknown',
    id: value('UID:'),
    issuedAt: { date: `${date[3]}-${date[2]}-${date[1]}` },
    totalAmount: money('ΤΕΛΙΚΗ ΑΞΙΑ'),
    originalTotalAmount: money('Αξία προ έκπτωσης'),
    merchant: { name: seller.text().trim(), ...optional('address', address === '' ? undefined : address), identifiers: [{ value: taxId, countryCode: 'GR', scheme: 'VAT' }] },
    items: $('table tbody tr').toArray().map(row => {
      const cells = $(row).children('td').toArray().map(cell => $(cell).text().trim())
      assert(cells.length === 9, 'Unsupported Entersoft item columns')
      const quantity = number(cells[3]); const total = number(cells[8])
      return {
        name: cells[1],
        unit: cells[2],
        quantity,
        totalAmount: total,
        originalUnitPrice: number(cells[4]),
        originalTotalAmount: number(cells[5]),
        ...optional('unitPrice', number(cells[6]) === '0' ? number(cells[4]) : divideExact(total, quantity)),
        adjustments: [{ kind: 'discount' as const, amount: subtract('0', number(cells[6])) }]
      }
    }),
    payments: [{ method: 'card', name: 'POS / e-POS', amount: money('POS / e-POS') }]
  }
  // VAT and discount summaries overlap the final item contributions; do not apply them twice.
  assertReceipt(receipt)
  return receipt
}
