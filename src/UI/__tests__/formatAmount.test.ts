import { formatAmount } from '../formatAmount'

// Synthetic numeric values exercise presentation independently of provider records.
describe('[model] amount formatting', () => {
  it('uses fiat minor units and removes binary arithmetic tails', () => {
    expect(formatAmount(0.1 + 0.2, 'USD')).toBe('0.3')
    expect(formatAmount(12.3456, 'EUR')).toBe('12.35')
    expect(formatAmount(1.005, 'USD')).toBe('1.01')
    expect(formatAmount(12.3456, 'KWD')).toBe('12.346')
    expect(formatAmount(12.5, 'JPY')).toBe('13')
    expect(formatAmount(-0.0001, 'USD')).toBe('0')
  })

  it('preserves fractional token balances and small amounts without scientific notation', () => {
    expect(formatAmount(123.456789, 'USDT')).toBe('123.456789')
    expect(formatAmount(0.000000001, 'SOL')).toBe('0.000000001')
    expect(formatAmount(0.000000000001, 'ETH')).toBe('0.000000000001')
    expect(formatAmount(0.1 + 0.2, 'USDT')).toBe('0.3')
  })
})
