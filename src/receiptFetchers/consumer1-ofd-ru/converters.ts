import get from '../../types/get'
import type { Receipt } from '../../types/receiptFetcher'
import { decimal, minorUnits } from '../../common/decimal'
import { assertReceipt, fiscalDate, optional, text } from '../../common/receiptFetcher/receipt'

export function convertReceipt (data: unknown, code: string): Receipt {
  const sourceItems: unknown = get(data, 'ticket.items')
  assert(Array.isArray(sourceItems), 'Missing receipt items')
  const payments = [
    ...(get(data, 'ticket.cashTotalSum') == null ? [] : [{ method: 'cash', amount: decimal(get(data, 'ticket.cashTotalSum')) }]),
    ...(get(data, 'ticket.ecashTotalSum') == null ? [] : [{ method: 'cashless', amount: decimal(get(data, 'ticket.ecashTotalSum')) }])
  ]
  const receipt = {
    completeness: 'full',
    currency: 'RUB',
    operation: Number(get(data, 'ticket.operationType')) === 1 ? 'sale' : Number(get(data, 'ticket.operationType')) === 2 ? 'refund' : 'unknown',
    issuedAt: fiscalDate(code),
    totalAmount: decimal(get(data, 'ticket.totalSum')),
    merchant: {
      ...optional('name', text(get(data, 'orgTitle'))),
      ...optional('address', text(get(data, 'retailPlaceAddress'))),
      ...((text(get(data, 'orgId')) != null) ? { identifiers: [{ value: text(get(data, 'orgId')), countryCode: 'RU', scheme: 'INN' }] } : {})
    },
    ...(payments.length > 0 ? { payments } : {}),
    items: sourceItems.map((item: unknown) => ({
      name: text(get(item, 'name')),
      unitPrice: minorUnits(get(item, 'price')),
      totalAmount: minorUnits(get(item, 'sum')),
      quantity: decimal(get(item, 'quantity'))
    }))
  }
  assertReceipt(receipt)
  return receipt
}
