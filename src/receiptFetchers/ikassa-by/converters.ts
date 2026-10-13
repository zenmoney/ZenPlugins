import get from '../../types/get'
import type { Receipt } from '../../types/receiptFetcher'
import { decimal, divideExact } from '../../common/decimal'
import { assertReceipt, localDateTime, optional, text } from '../../common/receiptFetcher/receipt'

export function convertReceipt (data: unknown): Receipt {
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
