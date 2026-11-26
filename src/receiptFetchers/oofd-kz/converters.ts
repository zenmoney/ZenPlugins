import get from '../../types/get'
import { isEqual } from 'lodash'
import type { Receipt, ReceiptAdjustment, ReceiptItem, ReceiptPayment } from '../../types/receiptFetcher'
import { decimal, divideExact, subtract } from '../../common/decimal'
import { assertReceipt, localDateTime, optional, text } from '../../common/receiptFetcher/receipt'

function includedTaxes (commodity: unknown): ReceiptAdjustment[] {
  const taxes = get(commodity, 'taxes')
  if (taxes == null) return []
  assert(Array.isArray(taxes), 'Invalid OOFD commodity taxes')
  return taxes.filter(tax => get(tax, 'inTotalSum') === true).map(tax => {
    const rate = get(tax, 'layout.rate')
    return {
      kind: 'tax',
      amount: decimal(get(tax, 'sum')),
      ...optional('name', text(get(tax, 'layout.taxName'))),
      ...optional('percent', rate == null ? undefined : divideExact(rate, '0.01'))
    }
  })
}

export function convertReceipt (data: unknown): Receipt {
  const sourceItems: unknown = get(data, 'ticket.items')
  assert(Array.isArray(sourceItems), 'Missing receipt items')
  const items: ReceiptItem[] = []
  const adjustments: ReceiptAdjustment[] = []
  for (const row of sourceItems) {
    const modifiers = get(row, 'modifiers')
    assert(modifiers == null || Array.isArray(modifiers), 'Invalid OOFD item modifiers')
    const type = get(row, 'itemType')
    if (type === 1) {
      // Item-level modifiers need complete source cases before interpreting their scope.
      assert(modifiers == null || modifiers.length === 0, 'Unsupported OOFD commodity modifiers')
      const commodity = get(row, 'commodity')
      const taxes = includedTaxes(commodity)
      const unitCode = get(commodity, 'measureUnitCode')
      items.push({
        totalAmount: decimal(get(commodity, 'sum')),
        name: text(get(commodity, 'name')) ?? '',
        ...(get(commodity, 'price') == null ? {} : { unitPrice: decimal(get(commodity, 'price')) }),
        quantity: decimal(get(commodity, 'quantity')),
        ...optional('unit', typeof unitCode === 'string' && /^\d+$/.test(unitCode) ? text(get(data, `measureUnits.${unitCode}`)) : undefined),
        ...(taxes.length > 0 ? { adjustments: taxes } : {})
      })
    } else if (type === 3 || type === 5) {
      const isDiscount = type === 5
      const effect = get(row, isDiscount ? 'discount' : 'markup')
      assert(get(effect, 'discount') === isDiscount, 'Invalid OOFD adjustment direction')
      // Standalone rows are document adjustments. Their modifiers repeat the same effect.
      assert(modifiers == null || modifiers.every(modifier => isEqual(modifier, effect)), 'Unsupported OOFD adjustment modifiers')
      const name = text(get(effect, 'name'))
      const amount = decimal(get(effect, 'sum'))
      adjustments.push({
        kind: name === 'Коррекция округления' || name === 'ROUND' ? 'rounding' : (isDiscount ? 'discount' : 'surcharge'),
        ...optional('name', name),
        amount: isDiscount ? subtract('0', amount) : amount
      })
    } else throw new Error('Unsupported OOFD receipt item type')
  }
  const sourcePayments = get(data, 'ticket.payments')
  assert(sourcePayments == null || Array.isArray(sourcePayments), 'Invalid OOFD receipt payments')
  const tin = text(get(data, 'orgId'))
  const receipt: Receipt = {
    completeness: 'full',
    currency: 'KZT',
    operation: text(get(data, 'ticketDescription'))?.split(',').some(label => label.trim() === 'transaction.ticket.sell') === true ? 'sale' : 'unknown',
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
