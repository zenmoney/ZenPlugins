import { adjustTransactions } from '../../../../common/transactionGroupHandler'
import { convertAccounts, convertTransaction } from '../../converters'

function money (sum, currency) {
  return { sum, currency }
}

function createPlans (secondCurrency = 'UAH') {
  return convertAccounts({
    accounts: [
      { id: 'account-a', type: 'CURRENT_ACCOUNT', name: 'A', iban: 'UA0001', balance: money(1000, 'UAH') },
      { id: 'account-b', type: 'CURRENT_ACCOUNT', name: 'B', iban: 'UA0002', balance: money(100, secondCurrency) }
    ],
    cards: [],
    deposits: [],
    loans: []
  })
}

function baseTransaction (overrides = {}) {
  return {
    id: 'transaction-1',
    type: 'EXPENSE',
    status: 'COMPLETED',
    operationType: 'CARD_PAYMENT',
    operationDate: 1785456000000,
    operationAmount: money(100, 'UAH'),
    postAmount: money(100, 'UAH'),
    sender: { account: { id: 'account-a' } },
    receiver: {},
    ...overrides
  }
}

describe('convertTransaction for UKRSIB online 2.0', () => {
  it('converts a multicurrency card payment and preserves structured merchant data', () => {
    const transaction = convertTransaction(baseTransaction({
      operationAmount: money(12, 'USD'),
      postAmount: money(500, 'UAH'),
      merchantName: 'SILPO',
      mcc: '5411',
      clientDescription: 'Продукти на вечерю'
    }), createPlans())

    expect(transaction).toEqual({
      date: new Date(1785456000000),
      hold: false,
      movements: [{
        id: 'transaction-1',
        account: { id: 'account-a' },
        invoice: { sum: -12, instrument: 'USD' },
        sum: -500,
        fee: 0
      }],
      merchant: {
        country: null,
        city: null,
        title: 'SILPO',
        mcc: 5411,
        location: null
      },
      comment: 'Продукти на вечерю'
    })
  })

  it('builds both movements for an internal currency exchange', () => {
    const transaction = convertTransaction(baseTransaction({
      id: 'fx-1',
      operationType: 'FX',
      operationAmount: money(10, 'USD'),
      postAmount: money(410, 'UAH'),
      sender: { account: { id: 'account-a', amount: money(410, 'UAH') } },
      receiver: { account: { id: 'account-b', amount: money(10, 'USD') } },
      clientDescription: 'Technical transfer description'
    }), createPlans('USD'))

    expect(transaction.movements).toEqual([
      {
        id: 'fx-1',
        account: { id: 'account-a' },
        invoice: { sum: -10, instrument: 'USD' },
        sum: -410,
        fee: 0
      },
      {
        id: 'fx-1:account-b',
        account: { id: 'account-b' },
        invoice: null,
        sum: 10,
        fee: 0
      }
    ])
    expect(transaction.merchant).toBeNull()
    expect(transaction.comment).toBeNull()
  })

  it('converts an external card transfer with the counterparty and masked card identifier', () => {
    const transaction = convertTransaction(baseTransaction({
      id: 'transfer-1',
      operationType: 'CARD_TRANSFER',
      receiver: {
        foreignCard: { number: '5168 ****** 1234', name: 'Іван Петренко' },
        bankName: 'Інший банк'
      }
    }), createPlans())

    expect(transaction.movements).toHaveLength(2)
    expect(transaction.movements[1]).toEqual({
      id: null,
      account: {
        type: 'ccard',
        instrument: 'UAH',
        company: null,
        syncIds: ['5168******1234']
      },
      invoice: null,
      sum: 100,
      fee: 0
    })
    expect(transaction.merchant).toMatchObject({ title: 'Іван Петренко' })
  })

  it('groups separate sides of an internal transfer by the bank reference', () => {
    const plans = createPlans()
    const outcome = convertTransaction(baseTransaction({
      id: 'outcome-1',
      operationType: 'INTERNAL_ACCOUNT_TRANSFER',
      documentNumber: 'document-42',
      sender: { account: { id: 'account-a' } },
      receiver: { account: { number: 'UA0002' } }
    }), plans)
    const income = convertTransaction(baseTransaction({
      id: 'income-1',
      type: 'INCOME',
      operationType: 'INTERNAL_ACCOUNT_TRANSFER',
      documentNumber: 'document-42',
      sender: { account: { number: 'UA0001' } },
      receiver: { account: { id: 'account-b' } }
    }), plans)

    expect(outcome.groupKeys).toEqual(income.groupKeys)
    expect(adjustTransactions({ transactions: [outcome, income], accounts: plans.map(plan => plan.account) })).toEqual([{
      movements: [outcome.movements[0], income.movements[0]],
      date: new Date(1785456000000),
      hold: false,
      merchant: null,
      comment: null
    }])
  })

  it('uses the bank processing state as hold', () => {
    const transaction = convertTransaction(baseTransaction({
      status: 'PROCESSING',
      blockAmount: money(105, 'UAH'),
      postAmount: null
    }), createPlans())

    expect(transaction.hold).toBe(true)
    expect(transaction.movements[0].sum).toBe(-105)
  })

  it('omits rejected operations and keeps unknown states reportable', () => {
    expect(convertTransaction(baseTransaction({ status: 'REJECTED' }), createPlans())).toBeNull()
    expect(() => convertTransaction(baseTransaction({ status: 'NEW_UNKNOWN_STATE' }), createPlans()))
      .toThrow(/transaction status is unsupported/)
  })
})
