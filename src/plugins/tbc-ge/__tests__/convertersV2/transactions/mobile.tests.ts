import { convertTransactionsV2 } from '../../../converters'
import { FetchHistoryV2Data, TransactionsByDateV2 } from '../../../models'
import { Account, ExtendedTransaction } from '../../../../../types/zenmoney'
import { creditCardGelV2 } from '../../../common-tests/accountsV2'
import { TransactionRecordV2Class } from '../../../common-tests/classes'

describe('mobile', () => {
  const cellfie: [TransactionsByDateV2, ExtendedTransaction, Account] = [
    {
      date: new Date('2024-02-22T00:00:00.000+04:00').getTime(),
      transactions:
          [
            TransactionRecordV2Class.mobile('Cellfie;599000111;თანხა:10.00',
              -10, 'GEL', 815825134, 'd_10404918548', 10404918548)
          ]
    },
    {
      comment: null,
      date: new Date('2024-02-22T00:00:00.000+04:00'),
      hold: false,
      merchant: {
        city: null,
        country: 'Georgia',
        location: null,
        mcc: null,
        title: 'Cellfie'
      },
      movements: [
        {
          account: {
            id: creditCardGelV2.id
          },
          fee: 0,
          id: 'd_10404918548',
          invoice: null,
          sum: -10
        }
      ],
      groupKeys: []
    }, creditCardGelV2
  ]
  const suite: Array<[TransactionsByDateV2, ExtendedTransaction, Account]> = [
    cellfie
  ]

  it.each(suite)('converts mobile transactions', (transactions, expected, account) => {
    const historyData: FetchHistoryV2Data = {
      account,
      currency: account.instrument,
      iban: account.syncIds[0],
      id: account.id
    }

    const date = new Date(transactions.date - 1000 * 60 * 60 * 24)
    const actual = convertTransactionsV2([transactions], date, historyData)
    expect(actual).toEqual([expected])
  })
})
