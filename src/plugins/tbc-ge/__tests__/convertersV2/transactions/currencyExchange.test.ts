import { convertTransactionsV2 } from '../../../converters'
import { FetchHistoryV2Data, TransactionsByDateV2 } from '../../../models'
import { Account, ExtendedTransaction } from '../../../../../types/zenmoney'
import { creditCardEurV2 } from '../../../common-tests/accountsV2'
import { TransactionRecordV2Class } from '../../../common-tests/classes'

describe('currency convertion transactions', () => {
  const eurTransfer: [TransactionsByDateV2, ExtendedTransaction, Account] = [
    {
      date: new Date('2024-10-11T20:00:00.000Z').getTime(),
      transactions:
        [
          TransactionRecordV2Class.standard(
            'კონვერტაცია',
            'internal transfer',
            -0.95,
            'EUR',
            13822643871,
            818399447,
            'd_13822643871',
            'PAYMENTS',
            'PAYMENTS',
            5
          )
        ]
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
    creditCardEurV2
  ]
  const suite: Array<[TransactionsByDateV2, ExtendedTransaction, Account]> = [
    eurTransfer
  ]

  it.each(suite)('should have correct groupKeys', (transactions, transaction, account) => {
    const historyData: FetchHistoryV2Data = {
      account,
      currency: account.instrument,
      iban: account.syncIds[0],
      id: account.id
    }

    const date = new Date(transactions.date - 1000 * 60 * 60 * 24)
    expect(convertTransactionsV2([transactions], date, historyData)).toEqual([transaction])
  })
})
