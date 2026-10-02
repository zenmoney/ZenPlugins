import { selectCardTransactionsForImport, sumPendingCardHolds, withPendingCardHoldsDeducted, BYBIT_FUNDING_ACCOUNT_ID } from '../../converters'
import { AccountOrCard, AccountType } from '../../../../types/zenmoney'
import { CardTransaction } from '../../models'

// Records below are real /v5/card/transaction/query-asset-records rows, trimmed
// to the fields the plugin parses. `baseAmount` is zero because the live
// endpoint does not return that field at all.
function cardEntry (overrides: Partial<CardTransaction>): CardTransaction {
  return {
    txnId: 'TXN',
    orderNo: null,
    side: '1',
    tradeStatus: '0',
    txnCreate: '1789817746000',
    basicAmount: 0,
    basicCurrency: 'USD',
    baseAmount: 0,
    paidAmount: 0,
    paidCurrency: 'CNY',
    transactionAmount: 0,
    transactionCurrency: 'USD',
    transactionCurrencyAmount: 0,
    merchName: null,
    merchCity: null,
    merchCountry: null,
    mccCode: null,
    merchCategoryDesc: null,
    pan4: '1234',
    declinedReason: '0',
    totalFees: 0,
    ...overrides
  }
}

// Four authorizations that were open at the same moment the Funding wallet
// reported a parked USD balance of exactly 43.11.
const openHolds = [
  cardEntry({ txnId: '2000000000000101', basicAmount: 1.98, transactionAmount: 1.94, totalFees: 0.04, paidAmount: 13, merchName: 'Alipay*Merchant1' }),
  cardEntry({ txnId: '2000000000000102', basicAmount: 14.32, transactionAmount: 14.04, totalFees: 0.28, paidAmount: 94, merchName: 'Alipay*Merchant2' }),
  cardEntry({ txnId: '2000000000000103', basicAmount: 19.04, transactionAmount: 18.67, totalFees: 0.37, paidAmount: 125, merchName: 'Alipay*Merchant2' }),
  cardEntry({ txnId: '2000000000000104', basicAmount: 7.77, transactionAmount: 7.62, totalFees: 0.15, paidAmount: 51.1, merchName: 'Alipay*Taxi' })
]

const fundingAccount: AccountOrCard = {
  id: BYBIT_FUNDING_ACCOUNT_ID,
  type: AccountType.checking,
  title: 'Bybit Funding',
  instrument: 'USD',
  balance: 1043.11,
  syncIds: [BYBIT_FUNDING_ACCOUNT_ID]
}

describe('sumPendingCardHolds', () => {
  it('totals the authorizations whose money Bybit has parked but not yet spent', () => {
    expect(sumPendingCardHolds(openHolds)).toBeCloseTo(43.11, 10)
  })

  it('ignores authorizations that already cleared, so nothing is deducted twice', () => {
    const cleared = cardEntry({ txnId: '2000000000000105', tradeStatus: '1', basicAmount: 2.27, totalFees: 0.04 })
    expect(sumPendingCardHolds([...openHolds, cleared])).toBeCloseTo(43.11, 10)
  })

  it('ignores declined authorizations', () => {
    const declined = cardEntry({ txnId: 'DECLINED', tradeStatus: '2', basicAmount: 99 })
    expect(sumPendingCardHolds([...openHolds, declined])).toBeCloseTo(43.11, 10)
  })

  it('ignores a pending credit: the money has not arrived, so the balance must not move', () => {
    const pendingRefund = cardEntry({ txnId: 'REFUND-PENDING', side: '5', tradeStatus: '0', basicAmount: 12 })
    expect(sumPendingCardHolds([...openHolds, pendingRefund])).toBeCloseTo(43.11, 10)
    // The same predicate keeps it out of the import, so the two stay in step.
    expect(selectCardTransactionsForImport([], [...openHolds, pendingRefund]).map(entry => entry.txnId))
      .not.toContain('REFUND-PENDING')
  })

  it('is zero when nothing is pending', () => {
    expect(sumPendingCardHolds([])).toBe(0)
  })
})

describe('withPendingCardHoldsDeducted', () => {
  it('removes parked fiat that the imported holds already account for', () => {
    // 1000 of coin plus the 43.11 parked for these holds, minus the 43.11.
    const corrected = withPendingCardHoldsDeducted(fundingAccount, sumPendingCardHolds(openHolds))
    expect(corrected.balance).toBeCloseTo(1000, 6)
  })

  it('returns the account untouched when no authorization is open', () => {
    expect(withPendingCardHoldsDeducted(fundingAccount, 0)).toBe(fundingAccount)
  })
})
