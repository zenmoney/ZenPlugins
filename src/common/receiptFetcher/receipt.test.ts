import { assertReceipt, localDateTime } from './receipt'

// Synthetic timestamps model preservation of the source calendar and explicit offset.
test('[model] source calendar day and explicit offset remain distinct from UTC conversion', () => {
  expect(localDateTime('2026-09-17T00:15:00+06:00')).toEqual({ date: '2026-09-17', time: '00:15:00', utcOffsetMinutes: 360 })
  expect(localDateTime('2026-09-17T00:15:00')).toEqual({ date: '2026-09-17', time: '00:15:00' })
  expect(localDateTime('2026-09-17T00:15:00Z').utcOffsetMinutes).toBe(0)
})

const receipt = {
  completeness: 'full',
  issuedAt: { date: '2026-09-21' },
  currency: 'EUR',
  operation: 'sale',
  totalAmount: '108',
  originalTotalAmount: '90',
  adjustments: [
    { kind: 'discount', amount: '-10', baseAmount: '100' },
    { kind: 'tax', amount: '18', baseAmount: '90', percent: '20' }
  ],
  items: [{ name: 'Item', quantity: '1', originalUnitPrice: '100', originalTotalAmount: '100', totalAmount: '100' }],
  payments: [{ method: 'loyaltyPoints', amount: '8', loyalty: { points: '80' } }]
}

test('validation accepts independent source totals and incomplete breakdowns without changing them', () => {
  const before = JSON.stringify(receipt)
  assertReceipt(receipt)
  expect(JSON.stringify(receipt)).toBe(before)
})

test('zero originals, tax and payments are valid known values', () => {
  const free = {
    ...receipt,
    totalAmount: '0',
    originalTotalAmount: '0',
    adjustments: [{ kind: 'tax', amount: '0', percent: '0', baseAmount: '0' }],
    payments: [{ method: 'cash', amount: '0' }],
    items: [{ name: 'Item', quantity: '1', originalUnitPrice: '0', originalTotalAmount: '0', totalAmount: '0' }]
  }
  expect(() => assertReceipt(free)).not.toThrow()
})

test.each([
  { issuedAt: { date: '2026-02-30' } },
  { issuedAt: { date: '2026-09-21', time: '24:01' } },
  { issuedAt: { date: '2026-09-21', utcOffsetMinutes: 0 } },
  { issuedAt: { date: '2026-09-21', time: '00:15', utcOffsetMinutes: 841 } },
  { items: [] },
  { items: [{ name: 'Item', quantity: '1', totalAmount: 108 }] },
  { totalAmount: 108 },
  { adjustments: [{ kind: 'tax', amount: '18', percent: '20%' }] },
  { payments: [{ method: 'card', amount: null }] }
])('invalid receipt data stays an error instead of being repaired', override => {
  expect(() => assertReceipt({ ...receipt, ...override })).toThrow()
})
