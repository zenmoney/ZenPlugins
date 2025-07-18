import { convertTransactions } from '../../../converters'

describe('convertTransaction', () => {
  const accountsByNumber = {
    7658726: {
      id: 'account',
      instrument: 'BYN'
    },
    8006989: {
      id: 'account1',
      instrument: 'BYN'
    },
    5315398: {
      id: 'account2',
      instrument: 'BYN'
    },
    8116892: {
      id: 'account3',
      instrument: 'USD'
    },
    5521718: {
      id: 'account4',
      instrument: 'BYN'
    }
  }
  it.each([
    [
      [
        {
          sourceSystem: 3,
          eventId: '340525746',
          contractId: '7658726',
          contractCurrency: null,
          cardPAN: '449655******0198',
          cardExpiryDate: null,
          cardId: '789249178',
          eventDate: 1586735201000,
          processingDate: null,
          transactionType: -1,
          transactionCode: '313',
          transactionName: 'Перевод BYN на свои карты 543553******6409',
          operationCode: null,
          merchantId: null,
          merchantName: null,
          merchantPlace: null,
          transactionSum: 5,
          transactionCurrency: '933',
          accountSum: null,
          commissionSum: null,
          commissionCurrency: null,
          rnnCode: '122497917430',
          authorizationCode: '134154',
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
          souEventId: '340525746',
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
              id: '340525746',
              account: { id: 'account' },
              invoice: null,
              sum: -5,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Перевод BYN на свои карты 543553******6409',
          groupKeys: ['340525746']
        }
      ]
    ],
    [
      [
        {
          sourceSystem: 3,
          eventId: '340525766',
          contractId: '8006989',
          contractCurrency: null,
          cardPAN: '543553******6409',
          cardExpiryDate: null,
          cardId: '909696579',
          eventDate: 1586735621000,
          processingDate: null,
          transactionType: -1,
          transactionCode: '313',
          transactionName: 'Перевод BYN на свои карты 449655******0198',
          operationCode: null,
          merchantId: null,
          merchantName: null,
          merchantPlace: null,
          transactionSum: 5.18,
          transactionCurrency: '933',
          accountSum: null,
          commissionSum: null,
          commissionCurrency: null,
          rnnCode: '122497917995',
          authorizationCode: '133589',
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
          souEventId: '340525766',
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
              id: '340525766',
              account: { id: 'account1' },
              invoice: null,
              sum: -5.18,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Перевод BYN на свои карты 449655******0198',
          groupKeys: ['340525766']
        }
      ]
    ],
    [
      [
        {
          sourceSystem: 4,
          eventId: '304809214038017983004394',
          contractId: '5315398',
          contractCurrency: null,
          cardPAN: '543553******7451',
          cardExpiryDate: null,
          cardId: '978101059',
          eventDate: 1593278402000,
          processingDate: null,
          transactionType: null,
          transactionCode: '01000R',
          transactionName: 'BLR;Belarus Терминал: W2P90012 RRN:017983004394 AuthCode:304809',
          operationCode: null,
          merchantId: '0822061',
          merchantName: null,
          merchantPlace: 'BLR;Belarus',
          transactionSum: -2140.38,
          transactionCurrency: '933',
          accountSum: null,
          commissionSum: null,
          commissionCurrency: null,
          rnnCode: '017983004394',
          authorizationCode: '304809',
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
          eventId: '352868724',
          contractId: '5315398',
          contractCurrency: null,
          cardPAN: '543553******7451',
          cardExpiryDate: null,
          cardId: '978101059',
          eventDate: 1593278402000,
          processingDate: null,
          transactionType: -1,
          transactionCode: '313',
          transactionName: 'Перевод BYN на свои карты 431838******4901',
          operationCode: null,
          merchantId: null,
          merchantName: null,
          merchantPlace: null,
          transactionSum: 2140.38,
          transactionCurrency: '933',
          accountSum: null,
          commissionSum: null,
          commissionCurrency: null,
          rnnCode: '017983004394',
          authorizationCode: '304809',
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
          souEventId: '352868724',
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
              id: '352868724',
              account: { id: 'account2' },
              invoice: null,
              sum: -2140.38,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Перевод BYN на свои карты 431838******4901',
          groupKeys: ['352868724']
        }
      ]
    ],
    [
      [
        {
          sourceSystem: 3,
          eventId: '145384074',
          contractId: '8116892',
          contractCurrency: '840',
          cardPAN: '463908******4323',
          cardExpiryDate: null,
          cardId: '957414291',
          eventDate: 1599770934000,
          processingDate: 1599771600000,
          transactionType: 1,
          transactionCode: '206',
          transactionName: 'Перевод BYN на свои карты 463908******4323',
          operationCode: null,
          merchantId: '0822061',
          merchantName: 'P2P SOU BPS-Sberbank',
          merchantPlace: 'Minsk',
          transactionSum: 4,
          transactionCurrency: '933',
          accountSum: 1.51,
          commissionSum: null,
          commissionCurrency: '840',
          rnnCode: '025483770230',
          authorizationCode: '127738',
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
          souEventId: '363375441',
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
              id: '145384074',
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
          comment: 'Перевод BYN на свои карты 463908******4323',
          groupKeys: ['363375441']
        }
      ]
    ],
    [
      [
        {
          sourceSystem: 3,
          eventId: '464835805',
          contractId: '5521718',
          contractCurrency: null,
          cardPAN: '463903******3980',
          cardExpiryDate: null,
          cardId: '1326232695',
          eventDate: 1649830505000,
          processingDate: null,
          transactionType: -1,
          transactionCode: '1455',
          transactionName: 'Пополнение вклада в BYN (on-line) 3210589H033PB7',
          operationCode: null,
          merchantId: null,
          merchantName: null,
          merchantPlace: null,
          transactionSum: 19.13,
          transactionCurrency: '933',
          accountSum: null,
          commissionSum: null,
          commissionCurrency: null,
          rnnCode: '210322973213',
          authorizationCode: '528735',
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
          souEventId: '464835805',
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
                id: '464835805',
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
                      '3210589H033PB7'
                    ]
                  },
                invoice: null,
                sum: 19.13,
                fee: 0
              }
            ],
          merchant: null,
          comment: 'Пополнение вклада в BYN (on-line) 3210589H033PB7',
          groupKeys: ['2022-04-13_BYN_19.13']
        }
      ]
    ]
  ])('converts income transfer', (apiTransactions, transactions) => {
    expect(convertTransactions(apiTransactions, accountsByNumber)).toEqual(transactions)
  })
})
