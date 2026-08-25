import { isCardTransactionInRange } from '../../api'
import { CardTransaction } from '../../models'

const transaction = (txnCreate: string): CardTransaction => ({
  txnId: txnCreate,
  orderNo: null,
  side: '3',
  tradeStatus: '1',
  txnCreate,
  basicAmount: 1,
  basicCurrency: 'USD',
  baseAmount: 1,
  paidAmount: 1,
  paidCurrency: 'USDT',
  transactionAmount: 1,
  transactionCurrency: 'USD',
  transactionCurrencyAmount: 1,
  merchName: null,
  merchCity: null,
  merchCountry: null,
  mccCode: null,
  merchCategoryDesc: null,
  pan4: null,
  declinedReason: null,
  totalFees: 0
})

describe('Bybit Card local date boundary', () => {
  const from = new Date('2026-06-01T00:00:00.000Z')
  const to = new Date('2026-06-08T00:00:00.000Z')

  it('keeps only [from, to) even if the API returns rows outside its requested range', () => {
    expect(isCardTransactionInRange(transaction(String(from.getTime())), from, to)).toBe(true)
    expect(isCardTransactionInRange(transaction(String(to.getTime() - 1)), from, to)).toBe(true)
    expect(isCardTransactionInRange(transaction(String(to.getTime())), from, to)).toBe(false)
    expect(isCardTransactionInRange(transaction(String(from.getTime() - 1)), from, to)).toBe(false)
  })
})
