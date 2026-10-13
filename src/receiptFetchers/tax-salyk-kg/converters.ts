import get from '../../types/get'
import type { Receipt } from '../../types/receiptFetcher'
import { decimal } from '../../common/decimal'
import { assertReceipt, localDateTime, optional, text } from '../../common/receiptFetcher/receipt'

export function convertReceipt (data: unknown): Receipt {
  const sourceItems: unknown = get(data, 'items')
  assert(Array.isArray(sourceItems), 'Missing receipt items')
  const payments = [
    ...(get(data, 'ticketTotalCashSum') == null ? [] : [{ method: 'cash', amount: decimal(get(data, 'ticketTotalCashSum')) }]),
    ...(get(data, 'ticketTotalCashlessSum') == null ? [] : [{ method: 'cashless', amount: decimal(get(data, 'ticketTotalCashlessSum')) }])
  ]
  const receipt = {
    completeness: 'full',
    ...optional('id', text(get(data, 'id'))),
    currency: 'KGS',
    operation: 'unknown',
    issuedAt: localDateTime(get(data, 'dateTime')),
    totalAmount: decimal(get(data, 'ticketTotalSum')),
    merchant: {
      ...optional('name', text(get(data, 'crData.locationName'))),
      ...optional('address', text(get(data, 'crData.locationAddress'))),
      ...((text(get(data, 'tin')) != null) ? { identifiers: [{ value: text(get(data, 'tin')), countryCode: 'KG' }] } : {})
    },
    ...(payments.length > 0 ? { payments } : {}),
    items: sourceItems.map((item: unknown) => ({
      totalAmount: decimal(get(item, 'goodCost')),
      name: text(get(item, 'goodName')),
      ...(get(item, 'goodPrice') == null ? {} : { unitPrice: decimal(get(item, 'goodPrice')) }),
      quantity: decimal(get(item, 'goodQuantity'))
    }))
  }
  assertReceipt(receipt)
  return receipt
}
