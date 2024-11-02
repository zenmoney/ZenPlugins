import { ExtendedTransaction } from '../../../../../types/zenmoney'
import { creditCardEurV2, creditCardUsdV2 } from '../../../common-tests/accountsV2'
import { adjustTransactions } from '../../../../../common/transactionGroupHandler'

describe('transactions with currency conversion', () => {
  const eurTransfer: [ExtendedTransaction[], ExtendedTransaction[]] = [
    [{
      comment: 'კონვერტაცია',
      date: new Date('2024-10-11T20:00:00.000Z'),
      hold: false,
      merchant: null,
      movements: [
        {
          account: {
            id: creditCardUsdV2.id
          },
          fee: 0,
          id: 'c_13822643871',
          invoice: null,
          sum: 1.01
        }
      ],
      groupKeys: ['13822643871', 'კონვერტაცია']
    },
    {
      comment: 'კონვერტაცია',
      date: new Date('2024-10-11T20:00:00.000Z'),
      hold: false,
      merchant: null,
      movements: [
        {
          account: {
            id: creditCardEurV2.id
          },
          fee: 0,
          id: 'd_13822643871',
          invoice: null,
          sum: -0.95
        }
      ],
      groupKeys: ['13822643871', 'კონვერტაცია']
    },
    {
      comment: null,
      date: new Date('2024-10-11T20:00:00.000Z'),
      hold: false,
      merchant: {
        title: '216 - C MARKET 485',
        mcc: 5331,
        country: null,
        city: null,
        location: null
      },
      movements: [
        {
          account: {
            id: creditCardUsdV2.id
          },
          fee: 0,
          id: 'd_13822636279',
          invoice: {
            sum: -103.98,
            instrument: 'RSD'
          },
          sum: -1.01
        }
      ]
    }],
    [{
      comment: 'კონვერტაცია',
      date: new Date('2024-10-11T20:00:00.000Z'),
      hold: false,
      merchant: null,
      movements: [
        {
          account: {
            id: creditCardEurV2.id
          },
          fee: 0,
          id: 'd_13822643871',
          invoice: null,
          sum: -0.95
        },
        {
          account: {
            id: creditCardUsdV2.id
          },
          fee: 0,
          id: 'c_13822643871',
          invoice: null,
          sum: 1.01
        }
      ]
    },
    {
      comment: null,
      date: new Date('2024-10-11T20:00:00.000Z'),
      hold: false,
      merchant: {
        title: '216 - C MARKET 485',
        mcc: 5331,
        country: null,
        city: null,
        location: null
      },
      movements: [
        {
          account: {
            id: creditCardUsdV2.id
          },
          fee: 0,
          id: 'd_13822636279',
          invoice: {
            sum: -103.98,
            instrument: 'RSD'
          },
          sum: -1.01
        }
      ]
    }]
  ]
  const suite: Array<[ExtendedTransaction[], ExtendedTransaction[]]> = [
    eurTransfer // autoconvert EUR->USD and buy in RSD
  ]

  it.each(suite)('should merge convertion into one operation', (transactionsToAdjust, adjustedTransactionsExpected) => {
    const adjustedTransactions = adjustTransactions({ transactions: transactionsToAdjust })

    expect(adjustedTransactions).toEqual(adjustedTransactionsExpected)
  })
})
