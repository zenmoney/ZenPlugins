import get from '../../types/get'
import { isEqual } from 'lodash'
import type { Receipt, ReceiptAdjustment, ReceiptItem, ReceiptPayment } from '../../types/receiptFetcher'
import { decimal, subtract } from '../../common/decimal'
import { assertReceipt, localDateTime, optional, text } from '../../common/receiptFetcher/receipt'

export function convertReceipt (data: unknown): Receipt {
  const sourceItems: unknown = get(data, 'ticket.items')
  assert(Array.isArray(sourceItems), 'Missing receipt items')
  const items: ReceiptItem[] = []
  const adjustments: ReceiptAdjustment[] = []
  for (const row of sourceItems) {
    const modifiers = get(row, 'modifiers')
    assert(modifiers == null || Array.isArray(modifiers), 'Invalid OOFD item modifiers')
    if (get(row, 'itemType') === 1) {
      // Item-level modifiers need complete source cases before interpreting their scope.
      assert(modifiers == null || modifiers.length === 0, 'Unsupported OOFD commodity modifiers')
      items.push({
        totalAmount: decimal(get(row, 'commodity.sum')),
        name: text(get(row, 'commodity.name')) ?? '',
        ...(get(row, 'commodity.price') == null ? {} : { unitPrice: decimal(get(row, 'commodity.price')) }),
        quantity: decimal(get(row, 'commodity.quantity'))
      })
    } else if (get(row, 'itemType') === 5) {
      const discount = get(row, 'discount')
      assert(get(discount, 'discount') === true, 'Invalid OOFD discount')
      // The standalone row affects the document, not the preceding commodity.
      // Its modifiers repeat the same effect; do not count them or totalDiscount again.
      assert(modifiers == null || modifiers.every(modifier => isEqual(modifier, discount)), 'Unsupported OOFD discount modifiers')
      adjustments.push({ kind: 'discount', ...optional('name', text(get(discount, 'name'))), amount: subtract('0', get(discount, 'sum')) })
    } else throw new Error('Unsupported OOFD receipt item type')
  }
  const sourcePayments = get(data, 'ticket.payments')
  assert(sourcePayments == null || Array.isArray(sourcePayments), 'Invalid OOFD receipt payments')
  const tin = text(get(data, 'orgId'))
  const receipt: Receipt = {
    completeness: 'full',
    currency: 'KZT',
    operation: 'unknown',
    issuedAt: localDateTime(get(data, 'ticket.transactionDate')),
    totalAmount: decimal(get(data, 'ticket.totalSum')),
    merchant: {
      ...optional('name', text(get(data, 'orgTitle'))?.replace(/\s+/g, ' ')),
      ...optional('address', text(get(data, 'retailPlaceAddress'))),
      ...(tin === undefined ? {} : { identifiers: [{ value: tin, countryCode: 'KZ', scheme: 'IIN/BIN' }] })
    },
    items,
    ...(adjustments.length === 0 ? {} : { adjustments }),
    ...(sourcePayments == null
      ? {}
      : {
          payments: sourcePayments.map((payment: unknown): ReceiptPayment => {
            const type = text(get(payment, 'paymentType'))
            const method = type === 'CARD' ? 'card' : type === 'CASH' ? 'cash' : 'other'
            return { method, amount: decimal(get(payment, 'sum')), ...(method === 'other' ? optional('name', type) : {}) }
          })
        })
  }
  assertReceipt(receipt)
  return receipt
}
