import get from '../../types/get'
import type { Receipt } from '../../types/receiptFetcher'
import { decimal, add } from '../../common/decimal'
import { assertReceipt, localDateTime, optional, text } from '../../common/receiptFetcher/receipt'

export function convertReceipt (data: unknown): Receipt {
  const sourceItems: unknown = get(data, 'items')
  assert(Array.isArray(sourceItems), 'Missing receipt items')
  const paymentMethod = get(data, 'paymentMethod')
  let cashSum: string | null = null
  let cardSum: string | null = null
  if (Array.isArray(paymentMethod) && paymentMethod.length > 0) {
    for (const item of paymentMethod as unknown[]) {
      if (get(item, 'typeCode') === 'CARD' || /card/i.test(text(get(item, 'type')) ?? '')) {
        cardSum = add(cardSum ?? 0, get(item, 'amount'))
      }
      if (get(item, 'typeCode') === 'CASH' || /^cash$/i.test(text(get(item, 'type')) ?? '')) {
        cashSum = add(cashSum ?? 0, get(item, 'amount'))
      }
    }
  }
  const payments = [
    ...(cashSum == null ? [] : [{ method: 'cash', amount: cashSum }]),
    ...(cardSum == null ? [] : [{ method: 'card', amount: cardSum }])
  ]
  const address = text(get(data, 'seller.address'))
  const country = text(get(data, 'seller.country'))
  const town = text(get(data, 'seller.town'))
  const merchant = {
    ...optional('name', text(get(data, 'seller.name'))),
    ...((address != null) ? { address: `${(country != null) ? country + ', ' : ''}${(town != null) ? town + ', ' : ''}${address}`.trim() } : {}),
    ...(get(data, 'seller.idType') === 'TIN' && (text(get(data, 'seller.idNum')) != null) ? { identifiers: [{ value: text(get(data, 'seller.idNum')), countryCode: 'ME' }] } : {})
  }
  const receipt = {
    completeness: 'full',
    currency: 'EUR',
    operation: 'unknown',
    issuedAt: localDateTime(get(data, 'dateTimeCreated')),
    totalAmount: decimal(get(data, 'totalPrice')),
    ...(Object.keys(merchant).length > 0 ? { merchant } : {}),
    ...(payments.length > 0 ? { payments } : {}),
    items: sourceItems.map((item: unknown) => ({
      totalAmount: decimal(get(item, 'priceAfterVat')),
      name: text(get(item, 'name')),
      ...(get(item, 'unitPriceAfterVat') == null ? {} : { unitPrice: decimal(get(item, 'unitPriceAfterVat')) }),
      quantity: decimal(get(item, 'quantity'))
    }))
  }
  assertReceipt(receipt)
  return receipt
}
