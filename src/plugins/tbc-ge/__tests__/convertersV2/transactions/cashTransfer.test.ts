import { convertTransactionsV2 } from '../../../converters'
import { FetchHistoryV2Data, TransactionsByDateV2 } from '../../../models'
import { Account, AccountType, ExtendedTransaction } from '../../../../../types/zenmoney'
import { creditCardGelV2, creditCardUsdV2 } from '../../../common-tests/accountsV2'
import { TransactionRecordV2Class } from '../../../common-tests/classes'

describe('convert cash transfer transactions', () => {
  const gelWithdrawal: [TransactionsByDateV2, ExtendedTransaction, Account] = [
    {
      date: new Date('2024-02-22T16:05:00.000+04:00').getTime(),
      transactions:
        [
          TransactionRecordV2Class.cashOut(
            'ATM CASH - ATM TBC-778 (Abuseridze st.,   ტრანზაქციის თანხა 95.00 GEL, Feb 22 2024  4:05PM, , ბარათი VISA, 444422******2222',
            -95, 'GEL', 815825134, 'd_11759312209', 10405918242)
        ]
    },
    {
      comment: null,
      date: new Date('2024-02-22T16:05:00.000+04:00'),
      hold: false,
      merchant: null,
      movements: [
        {
          account: {
            id: creditCardGelV2.id
          },
          fee: 0,
          id: 'd_11759312209',
          invoice: null,
          sum: -95
        },
        {
          account: {
            company: null,
            instrument: 'GEL',
            syncIds: null,
            type: AccountType.cash
          },
          fee: 0,
          id: null,
          invoice: null,
          sum: 95
        }
      ],
      groupKeys: []
    }, creditCardGelV2
  ]
  const usdWithdrawal: [TransactionsByDateV2, ExtendedTransaction, Account] = [
    {
      date: new Date('2024-02-01T12:05:00.000+04:00').getTime(),
      transactions: [
        TransactionRecordV2Class.cashOut(
          'ATM CASH - ATM TBC-913(Abuseridze 5),   ტრანზაქციის თანხა 300.00 USD, Feb  1 2024 12:05PM, , ბარათი VISA, 444422******2222',
          -300, 'USD', 815825135, 'd_11593886243', 10404918550
        )
      ]
    },
    {
      comment: null,
      date: new Date('2024-02-01T12:05:00.000+04:00'),
      hold: false,
      merchant: null,
      movements: [
        {
          account: {
            id: creditCardUsdV2.id
          },
          fee: 0,
          id: 'd_11593886243',
          invoice: null,
          sum: -300
        },
        {
          account: {
            company: null,
            instrument: 'USD',
            syncIds: null,
            type: AccountType.cash
          },
          fee: 0,
          id: null,
          invoice: null,
          sum: 300
        }
      ],
      groupKeys: []
    },
    creditCardUsdV2
  ]
  const suite: Array<[TransactionsByDateV2, ExtendedTransaction, Account]> = [
    gelWithdrawal,
    usdWithdrawal
  ]

  it.each(suite)('converts cash transfer transactions', (transactions, transaction, account) => {
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
