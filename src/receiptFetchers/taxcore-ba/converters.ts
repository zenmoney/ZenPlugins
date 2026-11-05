import get from '../../types/get'
import type { Receipt, ReceiptPayment, ReceiptPaymentMethod } from '../../types/receiptFetcher'
import { decimal } from '../../common/decimal'
import { assertReceipt, localDateTime, optional, text } from '../../common/receiptFetcher/receipt'

export function convertOperation (type: unknown): Receipt['operation'] {
  return type === 0 ? 'sale' : type === 1 ? 'refund' : 'unknown'
}

export function convertPaymentMethod (type: unknown): ReceiptPaymentMethod {
  // Local verification protocol: 0 is other cashless, 4 bank transfer, 6 instant payment.
  // Cheques and unspecified vouchers have no exact Receipt method; neither implies a gift card.
  if (type === 0 || type === 4 || type === 6) return 'cashless'
  return type === 1 ? 'cash' : type === 2 ? 'card' : 'other'
}

export function convertReceipt (source: unknown): Receipt {
  assert(get(source, 'isValid') === true, 'Invalid TaxCore receipt')
  const request = get(source, 'invoiceRequest')
  const result = get(source, 'invoiceResult')
  assert(get(request, 'invoiceType') === 0, 'Unsupported TaxCore document type')
  const rows = get(request, 'items')
  const payments = get(request, 'payments')
  assert(Array.isArray(rows) && Array.isArray(payments), 'Missing TaxCore items or payments')
  const taxId = text(get(request, 'taxId'))
  const transactionType = get(request, 'transactionType')
  // This authority issues its fiscal documents in BAM. It is independent of Serbia/RSD.
  const receipt: Receipt = {
    completeness: 'full',
    currency: 'BAM',
    ...optional('id', text(get(result, 'invoiceNumber'))),
    operation: convertOperation(transactionType),
    issuedAt: localDateTime(get(result, 'sdcTime')),
    totalAmount: decimal(get(result, 'totalAmount')),
    merchant: {
      ...optional('name', text(get(request, 'businessName'))),
      ...optional('address', text(get(request, 'address'))),
      ...(taxId === undefined ? {} : { identifiers: [{ value: taxId, countryCode: 'BA' }] })
    },
    items: rows.map((row: unknown) => ({
      name: text(get(row, 'name')) ?? '',
      quantity: decimal(get(row, 'quantity')),
      unitPrice: decimal(get(row, 'unitPrice')),
      totalAmount: decimal(get(row, 'totalPrice'))
    })),
    payments: payments.map((payment: unknown): ReceiptPayment => ({
      method: convertPaymentMethod(get(payment, 'paymentType')), amount: decimal(get(payment, 'amount'))
    }))
  }
  // The journal repeats aggregate VAT; it does not allocate taxes to item contributions.
  assertReceipt(receipt)
  return receipt
}
