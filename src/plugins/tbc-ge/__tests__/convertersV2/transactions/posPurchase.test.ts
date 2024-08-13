import { convertTransactionsV2 } from '../../../converters'
import { creditCardEurV2 } from '../../../common-tests/accountsV2'
import { FetchHistoryV2Data } from '../../../models'

describe('convertTransaction', () => {
  it.each([
    [
      {
        transactions: [
          {
            transactionId: 12225712195,
            accountId: 818006075,
            entryType: 'StandardMovement' as const,
            movementId: 'd_12225712195',
            transactionDate: null,
            localTime: null,
            repeatTransaction: null,
            setAutomaticTransfer: null,
            payback: null,
            saveAsTemplate: null,
            shareReceipt: null,
            dispute: null,
            title: 'POS - CUPS COFFEE SHOP, 3.70 EUR, Apr  6 2024 12:00AM, კონვერტაცია, რესტორანი, კაფე, ბარი, MCC: 5812, VISA, 431571******0973',
            subTitle: 'Restaurant, café, bar',
            amount: -3.7,
            currency: 'EUR',
            categoryCode: 'RESTAURANT',
            subCategoryCode: 'RESTAURANT',
            isSplit: false,
            transactionSubtype: 5,
            blockedMovementDate: null,
            blockedMovementCardId: null,
            blockedMovementIban: null,
            transactionStatus: 'Green',
            isDebit: true
          }
        ],
        date: 1649016000000
      },
      {
        comment: null,
        date: new Date('2024-04-05T20:00:00.000Z'),
        hold: false,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: 5812,
          title: 'CUPS COFFEE SHOP'
        },
        movements: [
          {
            account: {
              id: creditCardEurV2.id
            },
            fee: 0,
            id: 'd_12225712195',
            invoice: null,
            sum: -3.7
          }
        ],
        groupKeys: []
      }
    ]
  ])('convert pos transactions', (apiTransaction, transaction) => {
    const date = new Date(apiTransaction.date - 1000 * 60 * 60 * 24)
    const accountData: FetchHistoryV2Data = {
      account: creditCardEurV2,
      currency: creditCardEurV2.instrument,
      iban: creditCardEurV2.syncIds[0],
      id: creditCardEurV2.id
    }
    expect(convertTransactionsV2([apiTransaction], date, accountData)).toEqual([transaction])
  })
})
