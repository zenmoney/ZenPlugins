import { adjustTransactions } from '../../../../../common/transactionGroupHandler.js'
import { convertTransactions } from '../../../converters.js'

describe('convertTransactions', () => {
  it.each([
    [
      [
        {
          sourceSystem: 4,
          eventId: '4081457051693094162',
          contractId: '7958737',
          contractCurrency: null,
          cardPAN: '543553******9027',
          cardExpiryDate: null,
          cardId: '887751646',
          eventDate: 1589634398000,
          processingDate: null,
          transactionType: null,
          transactionCode: '01000R',
          transactionName: 'RUS;Russia Терминал: 21607537 RRN:051693094162 AuthCode:408145',
          operationCode: null,
          merchantId: '21607537',
          merchantName: null,
          merchantPlace: 'RUS;Russia',
          transactionSum: -0.07,
          transactionCurrency: '933',
          accountSum: null,
          commissionSum: null,
          commissionCurrency: null,
          rnnCode: '051693094162',
          authorizationCode: '408145',
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
          sourceSystem: 4,
          eventId: '4081447051693078955',
          contractId: '7958737',
          contractCurrency: null,
          cardPAN: '543553******9027',
          cardExpiryDate: null,
          cardId: '887751646',
          eventDate: 1589632473000,
          processingDate: null,
          transactionType: null,
          transactionCode: '01000R',
          transactionName: 'RUS;Russia Терминал: 21607537 RRN:051693078955 AuthCode:408144',
          operationCode: null,
          merchantId: '21607537',
          merchantName: null,
          merchantPlace: 'RUS;Russia',
          transactionSum: -0.07,
          transactionCurrency: '933',
          accountSum: null,
          commissionSum: null,
          commissionCurrency: null,
          rnnCode: '051693078955',
          authorizationCode: '408144',
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
          sourceSystem: 4,
          eventId: '4081437051693059102',
          contractId: '7958737',
          contractCurrency: null,
          cardPAN: '543553******9027',
          cardExpiryDate: null,
          cardId: '887751646',
          eventDate: 1589629974000,
          processingDate: null,
          transactionType: null,
          transactionCode: '01000R',
          transactionName: 'RUS;Russia Терминал: 21607537 RRN:051693059102 AuthCode:408143',
          operationCode: null,
          merchantId: '21607537',
          merchantName: null,
          merchantPlace: 'RUS;Russia',
          transactionSum: -0.07,
          transactionCurrency: '933',
          accountSum: null,
          commissionSum: null,
          commissionCurrency: null,
          rnnCode: '051693059102',
          authorizationCode: '408143',
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
          sourceSystem: 4,
          eventId: '4081427051693048003',
          contractId: '7958737',
          contractCurrency: null,
          cardPAN: '543553******9027',
          cardExpiryDate: null,
          cardId: '887751646',
          eventDate: 1589628666000,
          processingDate: null,
          transactionType: null,
          transactionCode: '01000R',
          transactionName: 'RUS;Russia Терминал: 21607537 RRN:051693048003 AuthCode:408142',
          operationCode: null,
          merchantId: '21607537',
          merchantName: null,
          merchantPlace: 'RUS;Russia',
          transactionSum: -0.07,
          transactionCurrency: '933',
          accountSum: null,
          commissionSum: null,
          commissionCurrency: null,
          rnnCode: '051693048003',
          authorizationCode: '408142',
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
        }
      ],
      {
        7958737: {
          id: '887751644',
          instrument: 'BYN'
        }
      },
      [
        {
          comment: null,
          date: new Date(1589634398000),
          hold: true,
          merchant: {
            city: null,
            country: 'Russia',
            location: null,
            mcc: null,
            title: 'Терминал: 21607537'
          },
          movements: [
            {
              account: {
                id: '887751644'
              },
              fee: 0,
              id: '4081457051693094162',
              invoice: null,
              sum: -0.07
            }
          ]
        },
        {
          comment: null,
          date: new Date(1589632473000),
          hold: true,
          merchant: {
            city: null,
            country: 'Russia',
            location: null,
            mcc: null,
            title: 'Терминал: 21607537'
          },
          movements: [
            {
              account: {
                id: '887751644'
              },
              fee: 0,
              id: '4081447051693078955',
              invoice: null,
              sum: -0.07
            }
          ]
        },
        {
          comment: null,
          date: new Date(1589629974000),
          hold: true,
          merchant: {
            city: null,
            country: 'Russia',
            location: null,
            mcc: null,
            title: 'Терминал: 21607537'
          },
          movements: [
            {
              account: {
                id: '887751644'
              },
              fee: 0,
              id: '4081437051693059102',
              invoice: null,
              sum: -0.07
            }
          ]
        },
        {
          comment: null,
          date: new Date(1589628666000),
          hold: true,
          merchant: {
            city: null,
            country: 'Russia',
            location: null,
            mcc: null,
            title: 'Терминал: 21607537'
          },
          movements: [
            {
              account: {
                id: '887751644'
              },
              fee: 0,
              id: '4081427051693048003',
              invoice: null,
              sum: -0.07
            }
          ]
        }
      ]
    ],
    [
      [
        {
          sourceSystem: 6,
          eventId: '305936205',
          contractId: '7958737',
          contractCurrency: '933',
          cardPAN: '',
          eventDate: 1694504274000,
          transactionSum: 150,
          transactionCurrency: '978',
          eventStatus: -1,
          mccCode: '6012',
          errorDescription: 'Ошибка при списании: Недостаточно средств',
          payAvailable: false
        },
        {
          sourceSystem: 4,
          eventId: '5677229282325583107449',
          contractId: '7958737',
          cardPAN: '460257******6888',
          cardId: '1180457325',
          eventDate: 1694504233000,
          transactionCode: '01000F',
          transactionName: 'P2P SOU Sber Bank > Minsk BLR Терминал: W2P90008 RRN:325583107449 AuthCode:567722',
          merchantId: '0822061',
          merchantPlace: 'P2P SOU Sber Bank > Minsk BLR',
          transactionSum: -92.82,
          transactionCurrency: '933',
          commissionSum: 0,
          commissionCurrency: '933',
          rnnCode: '325583107449',
          authorizationCode: '567722',
          eventStatus: 0,
          payAvailable: false
        },
        {
          sourceSystem: 4,
          eventId: '3693039282325583107450',
          contractId: '8006989',
          cardPAN: '543553******1025',
          cardId: '1428663651',
          eventDate: 1694504233000,
          transactionCode: '01000P',
          transactionName: 'P2P SOU Sber Bank > Minsk BLR Терминал: W2P90008 RRN:325583107450 AuthCode:369303',
          merchantId: '0822061',
          merchantPlace: 'P2P SOU Sber Bank > Minsk BLR',
          transactionSum: 92.82,
          transactionCurrency: '933',
          commissionSum: 0,
          commissionCurrency: '933',
          rnnCode: '325583107450',
          authorizationCode: '369303',
          eventStatus: 0,
          payAvailable: false
        },
        {
          sourceSystem: 3,
          eventId: '565285031',
          contractId: '7958737',
          cardPAN: '460257******6888',
          cardId: '1180457325',
          eventDate: 1694504232000,
          transactionType: -1,
          transactionCode: '313',
          transactionName: 'Перевод BYN на свои карты 543553******1025',
          transactionSum: 92.82,
          transactionCurrency: '933',
          rnnCode: '325583107448',
          authorizationCode: '567722',
          eventStatus: 0,
          souServiceCode: 313,
          souEventId: '565285031',
          payAvailable: false
        }
      ],
      {
        7958737: {
          id: '887751644',
          instrument: 'BYN'
        },
        8006989: {
          id: 'account1',
          instrument: 'BYN'
        }
      },
      [
        {
          date: new Date('2023-09-12T07:37:12.000Z'),
          groupKeys: ['565285031'],
          hold: true,
          merchant: null,
          movements: [
            {
              account: { id: '887751644' },
              fee: 0,
              id: '565285031',
              invoice: null,
              sum: -92.82
            }
          ],
          comment: 'Перевод BYN на свои карты 543553******1025'
        },
        {
          date: new Date('2023-09-12T07:37:13.000Z'),
          hold: true,
          merchant: {
            city: 'Minsk',
            country: 'BLR',
            location: null,
            mcc: null,
            title: 'P2P SOU Sber Bank'
          },
          movements: [
            {
              account: { id: '887751644' },
              fee: 0,
              id: '5677229282325583107449',
              invoice: null,
              sum: -92.82
            }
          ],
          comment: null
        },
        {
          date: new Date('2023-09-12T07:37:13.000Z'),
          hold: true,
          merchant: {
            city: 'Minsk',
            country: 'BLR',
            location: null,
            mcc: null,
            title: 'P2P SOU Sber Bank'
          },
          movements: [
            {
              account: { id: 'account1' },
              fee: 0,
              id: '3693039282325583107450',
              invoice: null,
              sum: 92.82
            }
          ],
          comment: null
        }
      ]
    ]
  ])('converts transactions', (apiTransactions, accountsByNumber, transactions) => {
    expect(convertTransactions(apiTransactions, accountsByNumber)).toEqual(transactions)
  })

  it('does not merge received P2P SOU Sber Bank money with a matching debit', () => {
    const apiTransactions = [
      {
        sourceSystem: 4,
        eventId: 'debit-event',
        contractId: 'credit-contract',
        cardPAN: '111111******1111',
        cardId: 'credit-card',
        eventDate: 1770000000000,
        transactionCode: '01000F',
        transactionName: 'P2P SOU Sber Bank > Minsk BLR Терминал: W2P90008 RRN:600000000001 AuthCode:111111',
        merchantId: '0822061',
        merchantPlace: 'P2P SOU Sber Bank > Minsk BLR',
        transactionSum: -30,
        transactionCurrency: '933',
        commissionSum: 0,
        commissionCurrency: '933',
        rnnCode: '600000000001',
        authorizationCode: '111111',
        eventStatus: 0,
        payAvailable: false
      },
      {
        sourceSystem: 4,
        eventId: 'income-event',
        contractId: 'income-contract',
        cardPAN: '222222******4370',
        cardId: 'income-card',
        eventDate: 1770000000000,
        transactionCode: '01000P',
        transactionName: 'P2P SOU Sber Bank > Minsk BLR Терминал: W2P90008 RRN:600000000002 AuthCode:222222',
        merchantId: '0822061',
        merchantPlace: 'P2P SOU Sber Bank > Minsk BLR',
        transactionSum: 30,
        transactionCurrency: '933',
        commissionSum: 0,
        commissionCurrency: '933',
        rnnCode: '600000000002',
        authorizationCode: '222222',
        eventStatus: 0,
        payAvailable: false
      }
    ]
    const accountsByNumber = {
      'credit-contract': {
        id: 'credit-account',
        instrument: 'BYN'
      },
      'income-contract': {
        id: 'card-4370',
        instrument: 'BYN'
      }
    }

    const transactions = adjustTransactions({
      transactions: convertTransactions(apiTransactions, accountsByNumber)
    })

    expect(transactions).toEqual([
      {
        date: new Date(1770000000000),
        hold: true,
        merchant: {
          city: 'Minsk',
          country: 'BLR',
          location: null,
          mcc: null,
          title: 'P2P SOU Sber Bank'
        },
        movements: [
          {
            account: { id: 'credit-account' },
            fee: 0,
            id: 'debit-event',
            invoice: null,
            sum: -30
          }
        ],
        comment: null
      },
      {
        date: new Date(1770000000000),
        hold: true,
        merchant: {
          city: 'Minsk',
          country: 'BLR',
          location: null,
          mcc: null,
          title: 'P2P SOU Sber Bank'
        },
        movements: [
          {
            account: { id: 'card-4370' },
            fee: 0,
            id: 'income-event',
            invoice: null,
            sum: 30
          }
        ],
        comment: null
      }
    ])
  })
})
