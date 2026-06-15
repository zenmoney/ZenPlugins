import { convertTransaction, selectCardTransactionsForImport } from '../../converters'
import { AccountOrCard, AccountType } from '../../../../types/zenmoney'
import { CardTransaction } from '../../models'

const bybitCardAccount: AccountOrCard = {
  id: 'bybit_card',
  type: AccountType.ccard,
  title: 'Bybit Card',
  instrument: 'USD',
  balance: 100,
  creditLimit: 0,
  syncIds: ['bybit_card']
}

function baseEntry (overrides: Partial<CardTransaction> = {}): CardTransaction {
  return {
    txnId: 'TXN1',
    orderNo: null,
    side: '3',
    tradeStatus: '1',
    txnCreate: '1672211918471',
    basicAmount: 101.5,
    basicCurrency: 'USD',
    baseAmount: 101.5,
    paidAmount: 101.5,
    paidCurrency: 'USDT',
    transactionAmount: 100,
    transactionCurrency: 'USD',
    transactionCurrencyAmount: 100,
    merchName: null,
    merchCity: null,
    merchCountry: null,
    mccCode: null,
    merchCategoryDesc: null,
    pan4: null,
    declinedReason: null,
    ...overrides
  }
}

describe('convertTransaction', () => {
  it('converts the cleared-purchase example from the Bybit docs as a USD card charge with fees included', () => {
    // Sample fields mirror
    //   https://bybit-exchange.github.io/docs/v5/bybit-card/asset-records
    const entry = baseEntry({
      txnId: 'TXN20230101001',
      orderNo: 'ORD20230101001',
      side: '3',
      tradeStatus: '1',
      txnCreate: '1672211918471',
      basicAmount: 101.5,
      basicCurrency: 'USD',
      paidAmount: 101.5,
      paidCurrency: 'USDT',
      transactionAmount: 100,
      transactionCurrency: 'USD',
      merchName: 'Amazon',
      merchCity: 'New York',
      merchCountry: 'US',
      mccCode: 5411,
      merchCategoryDesc: 'Grocery Stores',
      pan4: '1234'
    })
    expect(convertTransaction(entry, bybitCardAccount)).toEqual({
      hold: false,
      date: new Date(1672211918471),
      movements: [{
        id: 'TXN20230101001',
        account: { id: 'bybit_card' },
        invoice: null,
        sum: -101.5,
        fee: 0
      }],
      merchant: {
        title: 'Amazon',
        country: 'US',
        city: 'New York',
        mcc: 5411,
        location: null
      },
      comment: null
    })
  })

  it('keeps a merchant-currency invoice when it differs from the USD card account currency', () => {
    const entry = baseEntry({
      basicAmount: 108,
      basicCurrency: 'USD',
      transactionAmount: 100,
      transactionCurrency: 'EUR'
    })
    const tx = convertTransaction(entry, bybitCardAccount)
    expect(tx?.movements[0]).toEqual({
      id: 'TXN1',
      account: { id: 'bybit_card' },
      invoice: { sum: -100, instrument: 'EUR' },
      sum: -108,
      fee: 0
    })
  })

  it('marks an in-progress authorization (side=1, tradeStatus=0) as a hold', () => {
    const entry = baseEntry({
      side: '1',
      tradeStatus: '0',
      merchName: 'STARBUCKS',
      mccCode: 5814
    })
    const tx = convertTransaction(entry, bybitCardAccount)
    expect(tx?.hold).toBe(true)
    expect(tx?.movements[0].sum).toBe(-101.5)
  })

  it('converts a refund (side=5) into a positive USD movement', () => {
    const entry = baseEntry({
      txnId: 'REFUND-1',
      side: '5',
      tradeStatus: '1',
      basicAmount: 12.34,
      transactionAmount: 12.34,
      merchName: 'AMAZON.DE',
      mccCode: 5942
    })
    const tx = convertTransaction(entry, bybitCardAccount)
    expect(tx?.movements[0].sum).toBe(12.34)
    expect(tx?.hold).toBe(false)
  })

  it('returns null for declined transactions (tradeStatus=2)', () => {
    expect(convertTransaction(baseEntry({ tradeStatus: '2' }), bybitCardAccount)).toBeNull()
  })

  it('returns null for reversal entries (tradeStatus=3)', () => {
    expect(convertTransaction(baseEntry({ tradeStatus: '3' }), bybitCardAccount)).toBeNull()
  })

  it('returns null for ambiguous sides (auth reversal, refund-request, etc.)', () => {
    for (const side of ['2', '4', '8', '9', '10', '11']) {
      expect(convertTransaction(baseEntry({ side }), bybitCardAccount)).toBeNull()
    }
  })

  it('omits the invoice when transaction currency equals account currency', () => {
    const entry = baseEntry({
      transactionCurrency: 'USD',
      transactionAmount: 50,
      basicAmount: 51.25
    })
    const tx = convertTransaction(entry, bybitCardAccount)
    expect(tx?.movements[0].invoice).toBeNull()
    expect(tx?.movements[0].sum).toBe(-51.25)
  })

  it('builds a generic merchant title when only an MCC is present', () => {
    const entry = baseEntry({ merchName: null, merchCategoryDesc: null, mccCode: 5411 })
    const tx = convertTransaction(entry, bybitCardAccount)
    expect(tx?.merchant).toEqual({
      title: 'Bybit Card',
      country: null,
      city: null,
      mcc: 5411,
      location: null
    })
  })

  it('uses the category description when there is no merchant name', () => {
    const entry = baseEntry({ merchName: null, merchCategoryDesc: 'Grocery Stores' })
    const tx = convertTransaction(entry, bybitCardAccount)
    expect((tx?.merchant as { title: string }).title).toBe('Grocery Stores')
  })

  it('emits null merchant when there is no merchant info at all', () => {
    const entry = baseEntry({
      side: '13',
      merchName: null,
      merchCategoryDesc: null,
      merchCity: null,
      merchCountry: null,
      mccCode: null
    })
    const tx = convertTransaction(entry, bybitCardAccount)
    expect(tx?.merchant).toBeNull()
  })
})

describe('selectCardTransactionsForImport', () => {
  it('keeps all financial entries and only in-progress authorization entries', () => {
    const financial = [
      baseEntry({ txnId: 'FIN-1', tradeStatus: '1' }),
      baseEntry({ txnId: 'FIN-2', tradeStatus: '3' })
    ]
    const auth = [
      baseEntry({ txnId: 'AUTH-PENDING', tradeStatus: '0' }),
      baseEntry({ txnId: 'AUTH-COMPLETED', tradeStatus: '1' }),
      baseEntry({ txnId: 'AUTH-DECLINED', tradeStatus: '2' })
    ]

    expect(selectCardTransactionsForImport(financial, auth).map(entry => entry.txnId)).toEqual([
      'FIN-1',
      'FIN-2',
      'AUTH-PENDING'
    ])
  })
})
