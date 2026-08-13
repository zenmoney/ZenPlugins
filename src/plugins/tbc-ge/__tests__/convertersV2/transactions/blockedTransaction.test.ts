import { convertTransactionsV2 } from '../../../converters'
import { FetchHistoryV2Data } from '../../../models'
import { creditCardEurV2 } from '../../../common-tests/accountsV2'

describe('convertTransactionsV2', () => {
  const account = creditCardEurV2
  const historyData: FetchHistoryV2Data = {
    account,
    currency: account.instrument,
    iban: account.syncIds[0],
    id: account.id
  }

  it.each([
    [
      [
        {
          date: 1775000000000,
          transactions: [
            {
              transactionId: 0,
              accountId: null,
              entryType: 'BlockedTransaction',
              movementId: null,
              transactionDate: null,
              localTime: null,
              repeatTransaction: null,
              setAutomaticTransfer: null,
              payback: null,
              saveAsTemplate: null,
              shareReceipt: true,
              dispute: true,
              title: 'www.eurolines.lt> LT',
              subTitle: 'Blocked amount',
              amount: -48.6,
              currency: 'EUR',
              categoryCode: null,
              subCategoryCode: 'bam',
              isSplit: null,
              transactionSubtype: null,
              blockedMovementDate: 1775000001000,
              blockedMovementCardId: 1008771195,
              blockedMovementIban: 'GE00TB0000000001111001',
              transactionStatus: 'Green',
              isDebit: false,
              receiverImageUrl: null
            },
            {
              transactionId: 0,
              accountId: null,
              entryType: 'BlockedTransaction',
              movementId: null,
              transactionDate: null,
              localTime: null,
              repeatTransaction: null,
              setAutomaticTransfer: null,
              payback: null,
              saveAsTemplate: null,
              shareReceipt: true,
              dispute: true,
              title: 'www.eurolines.lt> LT',
              subTitle: 'Blocked amount',
              amount: -48.6,
              currency: 'EUR',
              categoryCode: null,
              subCategoryCode: 'bam',
              isSplit: null,
              transactionSubtype: null,
              blockedMovementDate: 1775000002000,
              blockedMovementCardId: 1008771195,
              blockedMovementIban: 'GE00TB0000000001111001',
              transactionStatus: 'Green',
              isDebit: false,
              receiverImageUrl: null
            },
            {
              transactionId: 10000000001,
              accountId: 815324580,
              entryType: 'StandardMovement',
              movementId: 'c_10000000001',
              transactionDate: null,
              localTime: null,
              repeatTransaction: null,
              setAutomaticTransfer: null,
              payback: null,
              saveAsTemplate: null,
              shareReceipt: null,
              dispute: null,
              title: 'Transfer between your accounts',
              subTitle: 'internal transfer',
              amount: 50,
              currency: 'EUR',
              categoryCode: 'PAYMENTS',
              subCategoryCode: 'PAYMENTS',
              isSplit: null,
              transactionSubtype: 1,
              blockedMovementDate: null,
              blockedMovementCardId: null,
              blockedMovementIban: null,
              transactionStatus: 'Green',
              isDebit: false,
              receiverImageUrl: null
            }
          ]
        }
      ],
      creditCardEurV2,
      [
        {
          date: new Date('2026-03-31T23:33:21.000Z'),
          hold: true,
          merchant: {
            city: null,
            country: 'LT',
            location: null,
            mcc: null,
            title: 'www.eurolines.lt'
          },
          movements: [
            {
              account: { id: '10FAKE-EUR36' },
              fee: 0,
              id: 'MTc3NTAwMDAwMTAwMHd3dy5ldXJvbGluZXMubHQ+IExULTQ4LjYxMDA4NzcxMTk1R0UwMFRCMDAwMDAwMDAwMTExMTAwMQ==',
              invoice: null,
              sum: -48.6
            }
          ],
          comment: null,
          groupKeys: []
        },
        {
          date: new Date('2026-03-31T23:33:22.000Z'),
          hold: true,
          merchant: {
            city: null,
            country: 'LT',
            location: null,
            mcc: null,
            title: 'www.eurolines.lt'
          },
          movements: [
            {
              account: { id: '10FAKE-EUR36' },
              fee: 0,
              id: 'MTc3NTAwMDAwMjAwMHd3dy5ldXJvbGluZXMubHQ+IExULTQ4LjYxMDA4NzcxMTk1R0UwMFRCMDAwMDAwMDAwMTExMTAwMQ==',
              invoice: null,
              sum: -48.6
            }
          ],
          comment: null,
          groupKeys: []
        },
        {
          date: new Date('2026-03-31T23:33:20.000Z'),
          hold: false,
          merchant: null,
          movements: [
            {
              account: { id: '10FAKE-EUR36' },
              fee: 0,
              id: 'c_10000000001',
              invoice: null,
              sum: 50
            }
          ],
          comment: 'Transfer between your accounts',
          groupKeys: [
            '10000000001',
            'Transfer between your accounts'
          ]
        }
      ]
    ]
  ])('converts blocked transaction', (TransactionsByDateV2, account, transaction) => {
    // @ts-expect-error
    expect(convertTransactionsV2(TransactionsByDateV2, new Date(TransactionsByDateV2.date - 1000 * 60 * 60 * 24), historyData)).toEqual(transaction)
  })
})
