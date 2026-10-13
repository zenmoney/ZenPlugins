import get from '../../types/get'
import type { Receipt } from '../../types/receiptFetcher'
import { decimal } from '../../common/decimal'
import { assertReceipt, localDateTime, optional, text } from '../../common/receiptFetcher/receipt'

export function convertReceipt (data: unknown): Receipt {
  const sourceItems: unknown = get(data, 'ticket.items')
  assert(Array.isArray(sourceItems), 'Missing receipt items')
  const receipt = {
    completeness: 'full',
    currency: 'KZT',
    operation: 'unknown',
    issuedAt: localDateTime(get(data, 'ticket.transactionDate')),
    totalAmount: decimal(get(data, 'ticket.totalSum')),
    merchant: {
      ...optional('name', text(get(data, 'orgTitle'))?.replace(/\s+/g, ' ')),
      ...optional('address', text(get(data, 'retailPlaceAddress'))),
      ...((text(get(data, 'orgId')) != null) ? { identifiers: [{ value: text(get(data, 'orgId')), countryCode: 'KZ' }] } : {})
    },
    items: sourceItems.filter((item: unknown) => get(item, 'commodity')).map((item: unknown) => ({
      totalAmount: decimal(get(item, 'commodity.sum')),
      name: text(get(item, 'commodity.name')),
      ...(get(item, 'commodity.price') == null ? {} : { unitPrice: decimal(get(item, 'commodity.price')) }),
      quantity: decimal(get(item, 'commodity.quantity'))
    }))
  }
  assertReceipt(receipt)
  return receipt
}
