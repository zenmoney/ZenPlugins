import type { Receipt, ReceiptItem, ReceiptPayment } from '../../types/receiptFetcher'
import get from '../../types/get'
import { decimal, divideExact, subtract } from '../../common/decimal'
import { assertReceipt, optional, text } from '../../common/receiptFetcher/receipt'

export function convertReceipt (source: unknown): Receipt {
  // The captured domestic receipt uses currency=false. Other currency encodings need source evidence.
  assert(get(source, 'currency') === false, 'Unsupported receipt currency')
  assert(get(source, 'canceled') === false, 'Canceled receipt')
  const timestamp = get(source, 'created_at')
  assert(typeof timestamp === 'string', 'Missing receipt timestamp')
  const date = timestamp.match(/^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}:\d{2})$/)
  assert(date !== null, 'Invalid receipt timestamp')
  const rows = get(source, 'transaction_items')
  assert(Array.isArray(rows), 'Missing receipt items')
  const items: ReceiptItem[] = rows.map((row: unknown) => {
    assert(get(row, 'storno') === false && get(row, 'custom_cancelled') === false, 'Unsupported canceled receipt item')
    const quantity = decimal(get(row, 'quantity'))
    const totalAmount = decimal(get(row, 'total'))
    // The page quotes price/total_fully before line adjustments and total as the final contribution.
    return {
      name: text(get(row, 'name')) ?? '',
      quantity,
      totalAmount,
      originalUnitPrice: decimal(get(row, 'price')),
      originalTotalAmount: decimal(get(row, 'total_fully')),
      ...optional('unitPrice', divideExact(totalAmount, quantity)),
      ...optional('unit', text(get(row, 'quantity_name')))
    }
  })
  const payments = get(source, 'transaction_payments')
  assert(Array.isArray(payments), 'Missing receipt payments')
  const id = decimal(get(source, 'id'))
  assert(/^\d+$/.test(id), 'Invalid receipt id')
  const bin = text(get(source, 'duplicated.company.bin_iin'))
  const receipt: Receipt = {
    completeness: 'full',
    id,
    operation: get(source, 'type') === 2 ? 'sale' : 'unknown',
    currency: 'KZT',
    issuedAt: { date: `${date[3]}-${date[2]}-${date[1]}`, time: date[4] },
    totalAmount: decimal(get(source, 'total_amount')),
    merchant: {
      ...optional('name', text(get(source, 'duplicated.company.name'))),
      ...optional('address', text(get(source, 'duplicated.kassa.address'))),
      ...(bin !== undefined ? { identifiers: [{ value: bin, countryCode: 'KZ' }] } : {})
    },
    items,
    payments: payments.map((payment: unknown): ReceiptPayment => {
      const type = get(payment, 'payment_type')
      return {
        method: type === 0 ? 'cash' : type === 1 ? 'card' : type === 2 ? 'cashless' : 'other',
        amount: subtract(get(payment, 'total'), get(payment, 'change')),
        ...optional('name', text(get(payment, 'method_name')))
      }
    })
  }
  assertReceipt(receipt)
  return receipt
}
