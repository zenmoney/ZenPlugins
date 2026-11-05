import { load } from 'cheerio'
import type { Receipt } from '../../types/receiptFetcher'
import { decimal } from '../../common/decimal'
import { assertReceipt, localDateTime } from '../../common/receiptFetcher/receipt'

export function convertReceipt (source: unknown): Receipt {
  assert(typeof source === 'string', 'Expected MyTax receipt HTML')
  const $ = load(source)
  const fields = new Map($('.receipt-row').toArray().map(row => [$(row).find('.label').text().trim(), $(row).find('.value').text().trim()]))
  const field = (name: string): string => { const value = fields.get(name); assert(value !== undefined && value !== '', 'Missing MyTax field', { field: name }); return value }
  const amount = (name: string): string => {
    const match = field(name).match(/^([\d,]+(?:\.\d+)?)\s*֏$/)
    assert(match !== null, 'Unsupported MyTax currency or amount')
    return decimal(match[1].replace(/,/g, ''))
  }
  assert(field('Ծառայության կոդ') === '49.32' && field('Ծառայության անվանում') === 'Տաքսի', 'Unsupported MyTax service')
  const receipt: Receipt = {
    completeness: 'full',
    currency: 'AMD',
    operation: 'sale',
    id: field('Ֆիսկալ համար'),
    issuedAt: localDateTime(field('Ամսաթիվ, ժամ').replace(' ', 'T')),
    totalAmount: amount('Ընդամենը`'),
    merchant: { name: field('Անվանում'), identifiers: [{ value: field('Ծառայության մատուցողի ՀՎՀՀ'), countryCode: 'AM', scheme: 'TIN' }] },
    // Explicit product decision (2026-11-05): one taxi service when this document omits a numeric quantity.
    items: [{ name: field('Ծառայության անվանում'), quantity: '1', totalAmount: amount('Ծառայության գումար') }],
    payments: [{ method: field('Վճարման տեսակ') === 'Անկանխիկ' ? 'cashless' : 'other', name: field('Վճարման տեսակ'), amount: amount('Ընդամենը`') }]
  }
  assertReceipt(receipt)
  return receipt
}
