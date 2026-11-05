import { load } from 'cheerio'
import type { Receipt, ReceiptAdjustment } from '../../types/receiptFetcher'
import { decimal, subtract } from '../../common/decimal'
import { assertReceipt } from '../../common/receiptFetcher/receipt'

const number = (value: string): string => decimal(value.replace(/\s|RUP/g, '').replace(',', '.'))

export function convertReceipt (source: unknown): Receipt {
  assert(typeof source === 'string', 'Expected APB receipt HTML')
  const $ = load(source)
  const root = $('.print-service-receipt').first()
  const total = root.find('.value.receipt-value-1020').text().trim()
  assert(total.endsWith('RUP'), 'Unsupported APB receipt currency')
  const names = root.find('.receipt-body .value.receipt-value-1030').toArray()
  const quantities = root.find('.receipt-value-1023').toArray()
  assert(names.length === quantities.length, 'Incomplete APB receipt items')
  const date = root.find('.receipt-value-1012').text().trim().match(/^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}:\d{2}:\d{2})$/)
  assert(date !== null, 'Missing APB receipt timestamp')
  const adjustments: ReceiptAdjustment[] = []
  root.find('.receipt-body .receipt-row-2').each((_, node) => {
    const label = $(node).find('.name').text().trim()
    if (label === 'доп. скидка' || label === 'Наценка') {
      const amount = number($(node).find('.value').text())
      adjustments.push({ kind: label === 'доп. скидка' ? 'discount' : 'surcharge', name: label, amount: label === 'доп. скидка' ? subtract('0', amount) : amount })
    }
  })
  const header = root.find('.receipt-header1').first()
  const footerRows = root.find('.receipt-footer .receipt-row-2').toArray()
  const receipt: Receipt = {
    completeness: 'full',
    // Product decision (2026-11-05): APB's RUP denotes the supported PRB instrument, without conversion.
    currency: 'PRB',
    operation: root.find('.receipt-value-1054').text().trim() === 'Приход' ? 'sale' : 'unknown',
    issuedAt: { date: `${date[3]}-${date[2]}-${date[1]}`, time: date[4] },
    totalAmount: number(total),
    merchant: { name: header.find('.receipt-subtitle').text().trim().replace(/\s+/g, ' '), address: header.find('.receipt-company-name').text().trim() },
    items: quantities.map((node, i) => {
      const row = $(node).closest('tr')
      return { name: $(names[i]).text().trim().replace(/^\d+ /, ''), quantity: number($(node).text()), unitPrice: number(row.find('.receipt-value-1079').text()), totalAmount: number(row.find('.receipt-value-1043').text()) }
    }),
    adjustments,
    payments: footerRows.filter(node => $(node).find('.name').text().trim() === 'ОПЛАТА КАРТОЙ').map(node => ({ method: 'card', amount: number($(node).find('.value').text()) }))
  }
  assertReceipt(receipt)
  return receipt
}
