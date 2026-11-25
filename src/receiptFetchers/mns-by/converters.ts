import { decimal } from '../../common/decimal'
import { assertReceipt, optional, text } from '../../common/receiptFetcher/receipt'
import get from '../../types/get'
import type { Receipt, ReceiptItem, ReceiptPayment } from '../../types/receiptFetcher'

function convertItem (source: unknown): ReceiptItem {
  const name = text(get(source, 'product_name')) ?? text(get(source, 'gtin_code'))
  assert(name !== undefined, 'Missing MNS receipt item name')
  const quantity = decimal(get(source, 'product_count'))
  const totalAmount = decimal(get(source, 'amount'))
  // The buyer form exposes the amounts separately; their stages for nonzero
  // adjustments require a source example before they can be mapped.
  for (const field of ['discount_amount', 'surcharge_amount']) {
    const value = get(source, field)
    assert(value == null || decimal(value) === '0', 'Unverified MNS receipt item adjustment')
  }
  return { name, quantity, totalAmount }
}

export function convertReceipt (source: unknown): Receipt {
  const id = text(get(source, 'ui'))
  const currency = text(get(source, 'currency'))
  const time = text(get(source, 'issued_at'))
  const timestamp = time?.match(/^(\d{2})\/(\d{2})\/(\d{4}), (\d{2}:\d{2}:\d{2})$/)
  assert(id !== undefined && currency !== undefined && timestamp != null, 'Incomplete MNS receipt identity')

  const positions = get(source, 'positions')
  const decoded: unknown = typeof positions === 'string' ? JSON.parse(positions) : positions
  assert(decoded !== null && typeof decoded === 'object', 'Invalid MNS receipt positions')
  const items: unknown[] = Array.isArray(decoded) ? decoded : Object.values(decoded)
  const unp = text(get(source, 'unp'))
  const locality = [text(get(source, 'type_np')), text(get(source, 'name_np'))].filter(Boolean).join(' ')
  const street = [text(get(source, 'street_to')), text(get(source, 'house_to'))].filter(Boolean).join(' ')
  const address = [locality, street].filter(Boolean).join(', ')
  const payments: ReceiptPayment[] = []
  const cash = get(source, 'cash_amount')
  const clearing = get(source, 'clearing_amount')
  if (cash != null) payments.push({ method: 'cash', amount: decimal(cash) })
  if (clearing != null) payments.push({ method: 'cashless', amount: decimal(clearing) })

  const receipt: Receipt = {
    completeness: 'full',
    id,
    currency,
    operation: 'unknown',
    issuedAt: { date: `${timestamp[3]}-${timestamp[2]}-${timestamp[1]}`, time: timestamp[4] },
    totalAmount: decimal(get(source, 'payment_amount')),
    merchant: {
      ...optional('name', text(get(source, 'name_to')) ?? text(get(source, 'name_spd'))),
      ...optional('address', text(address)),
      ...optional('identifiers', unp === undefined ? undefined : [{ value: unp, countryCode: 'BY', scheme: 'UNP' }])
    },
    ...optional('payments', payments.length === 0 ? undefined : payments),
    items: items.map(convertItem)
  }
  assertReceipt(receipt)
  return receipt
}
