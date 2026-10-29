import type { Receipt, ReceiptAdjustment, ReceiptPayment } from '../../types/receiptFetcher'
import get from '../../types/get'
import cheerio from 'cheerio'
import { decimal } from '../../common/decimal'
import { assertReceipt, optional, text } from '../../common/receiptFetcher/receipt'
import { decodeReceipt, readReceiptEnvelope } from './protocol'

export function convertReceipt (html: unknown): Receipt {
  assert(typeof html === 'string', 'Expected receipt page')
  const payload = readReceiptEnvelope(html)
  const encoded = get(payload, 'ok')
  assert(typeof encoded === 'string', 'Missing encoded receipt')
  const $ = cheerio.load(html)
  const timestamp = $('body').text().match(/Дата и время:\s*(\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2})/)?.[1]
  return convertReceiptData(decodeReceipt(encoded), timestamp)
}

export function convertReceiptData (source: unknown, timestamp: unknown): Receipt {
  assert(get(source, 'currency') === 398, 'Unsupported receipt currency')
  const cancelled = get(source, 'cancelled')
  assert(cancelled === undefined || cancelled === false, 'Canceled or invalid receipt')
  assert(typeof timestamp === 'string', 'Missing receipt timestamp')
  const date = timestamp.match(/^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}:\d{2}:\d{2})$/)
  assert(date !== null, 'Invalid receipt timestamp')
  const rows = get(source, 'items')
  assert(Array.isArray(rows), 'Missing receipt items')
  const sourcePayments = get(source, 'payments')
  assert(sourcePayments === undefined || Array.isArray(sourcePayments), 'Invalid receipt payments')
  const tin = text(get(source, 'merchant.tin'))
  const operation = get(source, 'operation')
  const receipt: Receipt = {
    completeness: 'full',
    ...optional('id', text(get(source, 'id'))),
    currency: 'KZT',
    operation: operation === 1 ? 'sale' : operation === 2 ? 'refund' : 'unknown',
    issuedAt: { date: `${date[3]}-${date[2]}-${date[1]}`, time: date[4] },
    totalAmount: decimal(get(source, 'total')),
    ...optional('originalTotalAmount', get(source, 'subtotal') == null ? undefined : decimal(get(source, 'subtotal'))),
    merchant: {
      ...optional('name', text(get(source, 'merchant.name'))),
      ...optional('address', text(get(source, 'merchant.address'))),
      ...(tin !== undefined ? { identifiers: [{ value: tin, countryCode: 'KZ' }] } : {})
    },
    items: rows.map((row: unknown) => {
      assert(get(row, 'currency') === 398, 'Unsupported item currency')
      const taxes = get(row, 'taxes')
      assert(taxes === undefined || Array.isArray(taxes), 'Invalid receipt item taxes')
      return {
        name: text(get(row, 'name')) ?? '',
        quantity: decimal(get(row, 'quantity')),
        totalAmount: decimal(get(row, 'total')),
        unitPrice: decimal(get(row, 'price')),
        ...optional('unit', text(get(row, 'unit'))),
        ...optional('originalTotalAmount', get(row, 'subtotal') == null ? undefined : decimal(get(row, 'subtotal'))),
        ...(taxes === undefined
          ? {}
          : {
              adjustments: taxes.map((tax: unknown): ReceiptAdjustment => {
                assert(get(tax, 'inclusive') === true, 'Unsupported item tax scope')
                // Item tax amounts are already included in final lines. Root taxes repeat their rounded summary.
                // Item percent uses a different source scale (16000 versus 16 in the summary); do not guess it.
                return { kind: 'tax', amount: decimal(get(tax, 'amount')), ...(get(tax, 'type') === 1 ? { name: 'НДС' } : {}) }
              })
            })
      }
    }),
    ...(sourcePayments === undefined
      ? {}
      : {
          payments: sourcePayments.map((payment: unknown): ReceiptPayment => {
            const type = get(payment, 'type')
            return {
              method: type === 1 ? 'cash' : type === 2 ? 'card' : type === 3 ? 'deferred' : type === 5 ? 'cashless' : 'other',
              amount: decimal(get(payment, 'amount'))
            }
          })
        })
  }
  assertReceipt(receipt)
  return receipt
}
