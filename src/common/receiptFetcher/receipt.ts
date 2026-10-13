import get from '../../types/get'
import type { Receipt, ReceiptCode, ReceiptDateTime } from '../../types/receiptFetcher'
import { decimal } from '../decimal'
import qs from 'querystring'

export function text (value: unknown): string | undefined {
  assert(value == null || typeof value === 'string', 'Invalid receipt text')
  if (value == null) return undefined
  const trimmed = value.trim()
  return trimmed.length === 0 ? undefined : trimmed
}

export function optional<K extends string, T> (name: K, value: T | null | undefined): Partial<Record<K, T>> {
  const result: Partial<Record<K, T>> = {}
  if (value != null) result[name] = value
  return result
}

function assertObject (value: unknown, message: string): asserts value is Record<string, unknown> {
  assert(value !== null && typeof value === 'object' && !Array.isArray(value), message)
}

function assertDecimal (value: unknown): void {
  assert(typeof value === 'string', 'Expected receipt decimal string')
  decimal(value)
}

function assertLoyalty (loyalty: unknown): void {
  if (loyalty === undefined) return
  assertObject(loyalty, 'Invalid receipt loyalty')
  if (loyalty.programName !== undefined) assert(typeof loyalty.programName === 'string', 'Invalid loyalty program name')
  if (loyalty.points !== undefined) assertDecimal(loyalty.points)
}

function assertAdjustments (adjustments: unknown): void {
  if (adjustments === undefined) return
  assert(Array.isArray(adjustments), 'Invalid receipt adjustments')
  for (const adjustment of adjustments as unknown[]) {
    assertObject(adjustment, 'Invalid receipt adjustment')
    assert(typeof adjustment.kind === 'string' && ['discount', 'surcharge', 'tax', 'rounding', 'other'].includes(adjustment.kind), 'Invalid receipt adjustment kind')
    assertDecimal(adjustment.amount)
    if (adjustment.name !== undefined) assert(typeof adjustment.name === 'string', 'Invalid adjustment name')
    for (const key of ['percent', 'baseAmount']) if (adjustment[key] !== undefined) assertDecimal(adjustment[key])
    if (adjustment.reason !== undefined) assert(typeof adjustment.reason === 'string' && ['promotion', 'loyalty', 'coupon', 'manual', 'other'].includes(adjustment.reason), 'Invalid adjustment reason')
    assertLoyalty(adjustment.loyalty)
  }
}

// Validate the public contract without converting, repairing, or balancing it.
export function assertReceipt (receipt: unknown): asserts receipt is Receipt {
  assertObject(receipt, 'Expected full receipt')
  assert(receipt.completeness === 'full', 'Expected full receipt')
  assert(typeof receipt.currency === 'string' && /^[A-Z]{3}$/.test(receipt.currency), 'Invalid receipt currency')
  assertObject(receipt.issuedAt, 'Missing receipt date')
  const { date, time, utcOffsetMinutes } = receipt.issuedAt
  assert(typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date), 'Invalid receipt date')
  const day = new Date(date + 'T00:00:00Z')
  assert(!isNaN(day.getTime()) && day.toISOString().slice(0, 10) === date, 'Invalid receipt calendar date')
  assert(time === undefined || (typeof time === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?$/.test(time)), 'Invalid receipt time')
  assert(utcOffsetMinutes === undefined || (time !== undefined && typeof utcOffsetMinutes === 'number' && Number.isInteger(utcOffsetMinutes) && Math.abs(utcOffsetMinutes) <= 840), 'Invalid receipt offset')
  assert(typeof receipt.operation === 'string' && ['sale', 'refund', 'unknown'].includes(receipt.operation), 'Invalid receipt operation')
  if (receipt.id !== undefined) assert(typeof receipt.id === 'string' && receipt.id.length > 0, 'Invalid receipt id')
  assertDecimal(receipt.totalAmount)
  if (receipt.originalTotalAmount !== undefined) assertDecimal(receipt.originalTotalAmount)
  assertAdjustments(receipt.adjustments)
  if (receipt.merchant !== undefined) {
    assertObject(receipt.merchant, 'Invalid receipt merchant')
    for (const key of ['name', 'address']) if (receipt.merchant[key] !== undefined) assert(typeof receipt.merchant[key] === 'string', 'Invalid merchant text')
    if (receipt.merchant.identifiers !== undefined) {
      assert(Array.isArray(receipt.merchant.identifiers), 'Invalid merchant identifiers')
      for (const identifier of receipt.merchant.identifiers as unknown[]) {
        assertObject(identifier, 'Invalid merchant identifier')
        assert(typeof identifier.value === 'string' && identifier.value.length > 0, 'Invalid merchant identifier')
        for (const key of ['countryCode', 'scheme']) if (identifier[key] !== undefined) assert(typeof identifier[key] === 'string', 'Invalid merchant identifier scheme')
      }
    }
  }
  if (receipt.payments !== undefined) {
    assert(Array.isArray(receipt.payments), 'Invalid receipt payments')
    for (const payment of receipt.payments as unknown[]) {
      assertObject(payment, 'Invalid receipt payment')
      assert(typeof payment.method === 'string' && ['prepayment', 'cash', 'card', 'cashless', 'loyaltyPoints', 'giftCard', 'deferred', 'other'].includes(payment.method), 'Invalid receipt payment method')
      assertDecimal(payment.amount)
      if (payment.name !== undefined) assert(typeof payment.name === 'string', 'Invalid payment name')
      assertLoyalty(payment.loyalty)
    }
  }
  assert(Array.isArray(receipt.items) && receipt.items.length > 0, 'Missing receipt items')
  for (const item of receipt.items as unknown[]) {
    assertObject(item, 'Missing receipt item')
    assert(typeof item.name === 'string' && item.name.trim().length > 0, 'Missing receipt item name')
    assertDecimal(item.quantity)
    assertDecimal(item.totalAmount)
    for (const key of ['unitPrice', 'originalUnitPrice', 'originalTotalAmount']) if (item[key] !== undefined) assertDecimal(item[key])
    if (item.unit !== undefined) assert(typeof item.unit === 'string', 'Invalid item unit')
    assert(item.settlementStage === undefined || (typeof item.settlementStage === 'string' && ['prepayment', 'delivery', 'postpayment'].includes(item.settlementStage)), 'Invalid item settlement stage')
    assertAdjustments(item.adjustments)
  }
}

export function isQrCode (code: unknown): code is ReceiptCode {
  const value = get(code, 'value')
  return get(code, 'format') === 'qr' && typeof value === 'string' && value.length > 0
}

export function hasHost (code: string, hosts: string[]): boolean {
  const match = code.match(/^https?:\/\/([^/?#:@]+)(?::\d+)?(?:[/?#]|$)/i)
  return Boolean((match != null) && hosts.includes(match[1].toLowerCase()))
}

export function queryParams (code: string): qs.ParsedUrlQuery {
  return qs.parse(code.slice(code.indexOf('?') + 1).split('#')[0])
}

export function fiscalDate (code: string): ReceiptDateTime {
  const match = String(queryParams(code).t ?? '').match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/)
  assert(match !== null, 'Invalid fiscal date')
  return { date: `${match[1]}-${match[2]}-${match[3]}`, time: `${match[4]}:${match[5]}` + (((match[6]?.length ?? 0) > 0) ? `:${match[6]}` : '') }
}

export function localDateTime (value: unknown): ReceiptDateTime {
  assert(typeof value === 'string', 'Missing source timestamp')
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)(Z|[+-]\d{2}:?\d{2})?$/)
  assert(match !== null, 'Invalid source timestamp')
  const offset: string | undefined = match[3]
  return {
    date: match[1],
    time: match[2],
    ...(offset !== undefined ? { utcOffsetMinutes: offset === 'Z' ? 0 : (offset[0] === '-' ? -1 : 1) * (Number(offset.slice(1, 3)) * 60 + Number(offset.slice(-2))) } : {})
  }
}
