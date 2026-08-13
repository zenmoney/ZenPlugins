import { adjustTransactions } from '../../../../../common/transactionGroupHandler'
import { convertTransaction } from '../../../converters'

const accounts = [
  {
    id: '101',
    type: 'ccard',
    title: '*1111',
    instrument: 'UAH',
    syncIds: ['UA111'],
    balance: 900
  },
  {
    id: '202',
    type: 'ccard',
    title: '*2222',
    instrument: 'UAH',
    syncIds: ['UA222'],
    balance: 100
  }
]

function makeTransfer (overrides) {
  return {
    account_id: 101,
    source_system_id: 'source-out',
    transaction_type: 'Transactions',
    description: 'Переказ між своїми рахунками',
    transaction_amount: {
      value: -10000,
      currency_code: 'UAH'
    },
    transaction_details: {
      transaction_date: '11.08.2026T12:30:00',
      operation_id: 'transfer-42',
      account_amount: {
        value: -10000,
        currency_code: 'UAH'
      },
      commission_amount: {
        value: 0,
        currency_code: 'UAH'
      }
    },
    merchant_category_data: {
      code: null
    },
    ...overrides
  }
}

describe('convertTransaction: inner transfer', () => {
  it('emits stable same-length groupKeys and lets the common handler join both sides', () => {
    const outcome = convertTransaction(makeTransfer({}), accounts)
    const income = convertTransaction(makeTransfer({
      account_id: 202,
      source_system_id: 'source-in',
      transaction_amount: {
        value: 10000,
        currency_code: 'UAH'
      },
      transaction_details: {
        transaction_date: '11.08.2026T12:30:01',
        operation_id: 'transfer-42',
        account_amount: {
          value: 10000,
          currency_code: 'UAH'
        },
        commission_amount: {
          value: 0,
          currency_code: 'UAH'
        }
      }
    }), accounts)

    expect(outcome).toEqual({
      hold: false,
      date: new Date('2026-08-11T12:30:00+03:00'),
      movements: [{
        id: 'source-out',
        account: { id: '101' },
        invoice: null,
        sum: -100,
        fee: 0
      }],
      merchant: null,
      comment: null,
      groupKeys: [
        'transfer-42',
        '2026-08-11_UAH_100'
      ]
    })
    expect(income).toEqual({
      hold: false,
      date: new Date('2026-08-11T12:30:01+03:00'),
      movements: [{
        id: 'source-in',
        account: { id: '202' },
        invoice: null,
        sum: 100,
        fee: 0
      }],
      merchant: null,
      comment: null,
      groupKeys: [
        'transfer-42',
        '2026-08-11_UAH_100'
      ]
    })
    expect(adjustTransactions({ transactions: [outcome, income] })).toEqual([{
      movements: [outcome.movements[0], income.movements[0]],
      date: outcome.date,
      hold: false,
      merchant: null,
      comment: null
    }])
  })
})
