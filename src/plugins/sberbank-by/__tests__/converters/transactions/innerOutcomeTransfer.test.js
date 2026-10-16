import { convertTransactions } from '../../../converters'

describe('convertTransaction', () => {
  const accountsByNumber = {
    1000036: {
      id: 'account',
      instrument: 'BYN'
    },
    1000032: {
      id: 'account1',
      instrument: 'BYN'
    },
    1000005: {
      id: 'account2',
      instrument: 'BYN'
    },
    1000037: {
      id: 'account3',
      instrument: 'USD'
    },
    1000001: {
      id: 'account4',
      instrument: 'BYN'
    }
  }
  it.each([
    [
      [
        {
          sourceSystem: 3,
          eventId: '100000055',
          contractId: '1000036',
          contractCurrency: null,
          cardPAN: '411111******2828',
          cardExpiryDate: null,
          cardId: '100000056',
          eventDate: 1586735201000,
          processingDate: null,
          transactionType: -1,
          transactionCode: '313',
          transactionName: 'Перевод BYN на свои карты 555555******2929',
          operationCode: null,
          merchantId: null,
          merchantName: null,
          merchantPlace: null,
          transactionSum: 5,
          transactionCurrency: '933',
          accountSum: null,
          commissionSum: null,
          commissionCurrency: null,
          rnnCode: '100000000016',
          authorizationCode: '100015',
          eventStatus: 0,
          mccCode: null,
          errorDescription: null,
          souServiceCode: 313,
          souServiceType: null,
          souServiceName: null,
          souRnnCode: null,
          souAuthorizationCode: null,
          souTransactionSum: null,
          souTransactionCurrency: null,
          souEventId: '100000055',
          qrPaymentId: null,
          fileId: null,
          printDocs: null,
          payAvailable: false
        }
      ],
      [
        {
          hold: true,
          date: new Date(1586735201000),
          movements: [
            {
              id: '100000055',
              account: { id: 'account' },
              invoice: null,
              sum: -5,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Перевод BYN на свои карты 555555******2929',
          groupKeys: ['100000055']
        }
      ]
    ],
    [
      [
        {
          sourceSystem: 3,
          eventId: '100000057',
          contractId: '1000032',
          contractCurrency: null,
          cardPAN: '555555******2929',
          cardExpiryDate: null,
          cardId: '100000058',
          eventDate: 1586735621000,
          processingDate: null,
          transactionType: -1,
          transactionCode: '313',
          transactionName: 'Перевод BYN на свои карты 411111******2828',
          operationCode: null,
          merchantId: null,
          merchantName: null,
          merchantPlace: null,
          transactionSum: 5.18,
          transactionCurrency: '933',
          accountSum: null,
          commissionSum: null,
          commissionCurrency: null,
          rnnCode: '100000000017',
          authorizationCode: '100016',
          eventStatus: 0,
          mccCode: null,
          errorDescription: null,
          souServiceCode: 313,
          souServiceType: null,
          souServiceName: null,
          souRnnCode: null,
          souAuthorizationCode: null,
          souTransactionSum: null,
          souTransactionCurrency: null,
          souEventId: '100000057',
          qrPaymentId: null,
          fileId: null,
          printDocs: null,
          payAvailable: false
        }
      ],
      [
        {
          hold: true,
          date: new Date(1586735621000),
          movements: [
            {
              id: '100000057',
              account: { id: 'account1' },
              invoice: null,
              sum: -5.18,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Перевод BYN на свои карты 411111******2828',
          groupKeys: ['100000057']
        }
      ]
    ],
    [
      [
        {
          sourceSystem: 4,
          eventId: '100000000000000000000001',
          contractId: '1000005',
          contractCurrency: null,
          cardPAN: '555555******4444',
          cardExpiryDate: null,
          cardId: '100000007',
          eventDate: 1593278402000,
          processingDate: null,
          transactionType: null,
          transactionCode: '01000R',
          transactionName: 'BLR;Belarus Терминал: W2P90012 RRN:100000000018 AuthCode:100017',
          operationCode: null,
          merchantId: '0822061',
          merchantName: null,
          merchantPlace: 'BLR;Belarus',
          transactionSum: -2140.38,
          transactionCurrency: '933',
          accountSum: null,
          commissionSum: null,
          commissionCurrency: null,
          rnnCode: '100000000018',
          authorizationCode: '100017',
          eventStatus: 0,
          mccCode: null,
          errorDescription: null,
          souServiceCode: null,
          souServiceType: null,
          souServiceName: null,
          souRnnCode: null,
          souAuthorizationCode: null,
          souTransactionSum: null,
          souTransactionCurrency: null,
          souEventId: null,
          qrPaymentId: null,
          fileId: null,
          printDocs: null,
          payAvailable: false
        },
        {
          sourceSystem: 3,
          eventId: '100000059',
          contractId: '1000005',
          contractCurrency: null,
          cardPAN: '555555******4444',
          cardExpiryDate: null,
          cardId: '100000007',
          eventDate: 1593278402000,
          processingDate: null,
          transactionType: -1,
          transactionCode: '313',
          transactionName: 'Перевод BYN на свои карты 444444******3030',
          operationCode: null,
          merchantId: null,
          merchantName: null,
          merchantPlace: null,
          transactionSum: 2140.38,
          transactionCurrency: '933',
          accountSum: null,
          commissionSum: null,
          commissionCurrency: null,
          rnnCode: '100000000018',
          authorizationCode: '100017',
          eventStatus: 0,
          mccCode: null,
          errorDescription: null,
          souServiceCode: 313,
          souServiceType: null,
          souServiceName: null,
          souRnnCode: null,
          souAuthorizationCode: null,
          souTransactionSum: null,
          souTransactionCurrency: null,
          souEventId: '100000059',
          qrPaymentId: null,
          fileId: null,
          printDocs: null,
          payAvailable: false
        }
      ],
      [
        {
          hold: true,
          date: new Date(1593278402000),
          movements: [
            {
              id: '100000059',
              account: { id: 'account2' },
              invoice: null,
              sum: -2140.38,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Перевод BYN на свои карты 444444******3030',
          groupKeys: ['100000059']
        }
      ]
    ],
    [
      [
        {
          sourceSystem: 3,
          eventId: '100000060',
          contractId: '1000037',
          contractCurrency: '840',
          cardPAN: '455555******3131',
          cardExpiryDate: null,
          cardId: '100000061',
          eventDate: 1599770934000,
          processingDate: 1599771600000,
          transactionType: 1,
          transactionCode: '206',
          transactionName: 'Перевод BYN на свои карты 455555******3131',
          operationCode: null,
          merchantId: '0822061',
          merchantName: 'P2P SOU BPS-Sberbank',
          merchantPlace: 'Minsk',
          transactionSum: 4,
          transactionCurrency: '933',
          accountSum: 1.51,
          commissionSum: null,
          commissionCurrency: '840',
          rnnCode: '100000000019',
          authorizationCode: '100018',
          eventStatus: 1,
          mccCode: '6012',
          errorDescription: null,
          souServiceCode: 313,
          souServiceType: null,
          souServiceName: null,
          souRnnCode: null,
          souAuthorizationCode: null,
          souTransactionSum: null,
          souTransactionCurrency: null,
          souEventId: '100000062',
          qrPaymentId: null,
          fileId: null,
          printDocs: null,
          payAvailable: false
        }
      ],
      [
        {
          hold: false,
          date: new Date(1599770934000),
          movements: [
            {
              id: '100000060',
              account: { id: 'account3' },
              invoice: {
                instrument: 'BYN',
                sum: 4
              },
              sum: 1.51,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Перевод BYN на свои карты 455555******3131',
          groupKeys: ['100000062']
        }
      ]
    ],
    [
      [
        {
          sourceSystem: 3,
          eventId: '100000063',
          contractId: '1000001',
          contractCurrency: null,
          cardPAN: '466666******3232',
          cardExpiryDate: null,
          cardId: '1000000010',
          eventDate: 1649830505000,
          processingDate: null,
          transactionType: -1,
          transactionCode: '1455',
          transactionName: 'Пополнение вклада в BYN (on-line) 1000002A002XX2',
          operationCode: null,
          merchantId: null,
          merchantName: null,
          merchantPlace: null,
          transactionSum: 19.13,
          transactionCurrency: '933',
          accountSum: null,
          commissionSum: null,
          commissionCurrency: null,
          rnnCode: '100000000020',
          authorizationCode: '100019',
          eventStatus: 0,
          mccCode: null,
          errorDescription: null,
          souServiceCode: 1455,
          souServiceType: null,
          souServiceName: null,
          souRnnCode: null,
          souAuthorizationCode: null,
          souTransactionSum: null,
          souTransactionCurrency: null,
          souEventId: '100000063',
          qrPaymentId: null,
          fileId: null,
          printDocs: null,
          payAvailable: false
        }
      ],
      [
        {
          hold: true,
          date: new Date('2022-04-13T09:15:05+03:00'),
          movements:
            [
              {
                id: '100000063',
                account: { id: 'account4' },
                invoice: null,
                sum: -19.13,
                fee: 0
              },
              {
                id: null,
                account:
                  {
                    type: 'checking',
                    instrument: 'BYN',
                    company: null,
                    syncIds: [
                      '1000002A002XX2'
                    ]
                  },
                invoice: null,
                sum: 19.13,
                fee: 0
              }
            ],
          merchant: null,
          comment: 'Пополнение вклада в BYN (on-line) 1000002A002XX2',
          groupKeys: ['2022-04-13_BYN_19.13']
        }
      ]
    ]
  ])('converts income transfer', (apiTransactions, transactions) => {
    expect(convertTransactions(apiTransactions, accountsByNumber)).toEqual(transactions)
  })
})
