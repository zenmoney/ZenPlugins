import { adjustTransactions } from '../../../../../common/transactionGroupHandler.js'
import { convertTransactions } from '../../../converters.js'

describe('convertTransactions', () => {
  it.each([
    [
      [
        {
          sourceSystem: 4,
          eventId: '1000000000000000001',
          contractId: '1000031',
          contractCurrency: null,
          cardPAN: '555555******1818',
          cardExpiryDate: null,
          cardId: '100000048',
          eventDate: 1589634398000,
          processingDate: null,
          transactionType: null,
          transactionCode: '01000R',
          transactionName: 'RUS;Russia Терминал: 21607537 RRN:100000000002 AuthCode:100003',
          operationCode: null,
          merchantId: '21607537',
          merchantName: null,
          merchantPlace: 'RUS;Russia',
          transactionSum: -0.07,
          transactionCurrency: '933',
          accountSum: null,
          commissionSum: null,
          commissionCurrency: null,
          rnnCode: '100000000002',
          authorizationCode: '100003',
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
          eventId: '1000000000000000002',
          contractId: '1000031',
          contractCurrency: null,
          cardPAN: '555555******1818',
          cardExpiryDate: null,
          cardId: '100000048',
          eventDate: 1589632473000,
          processingDate: null,
          transactionType: null,
          transactionCode: '01000R',
          transactionName: 'RUS;Russia Терминал: 21607537 RRN:100000000003 AuthCode:100004',
          operationCode: null,
          merchantId: '21607537',
          merchantName: null,
          merchantPlace: 'RUS;Russia',
          transactionSum: -0.07,
          transactionCurrency: '933',
          accountSum: null,
          commissionSum: null,
          commissionCurrency: null,
          rnnCode: '100000000003',
          authorizationCode: '100004',
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
          eventId: '1000000000000000003',
          contractId: '1000031',
          contractCurrency: null,
          cardPAN: '555555******1818',
          cardExpiryDate: null,
          cardId: '100000048',
          eventDate: 1589629974000,
          processingDate: null,
          transactionType: null,
          transactionCode: '01000R',
          transactionName: 'RUS;Russia Терминал: 21607537 RRN:100000000004 AuthCode:100005',
          operationCode: null,
          merchantId: '21607537',
          merchantName: null,
          merchantPlace: 'RUS;Russia',
          transactionSum: -0.07,
          transactionCurrency: '933',
          accountSum: null,
          commissionSum: null,
          commissionCurrency: null,
          rnnCode: '100000000004',
          authorizationCode: '100005',
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
          eventId: '1000000000000000004',
          contractId: '1000031',
          contractCurrency: null,
          cardPAN: '555555******1818',
          cardExpiryDate: null,
          cardId: '100000048',
          eventDate: 1589628666000,
          processingDate: null,
          transactionType: null,
          transactionCode: '01000R',
          transactionName: 'RUS;Russia Терминал: 21607537 RRN:100000000005 AuthCode:100006',
          operationCode: null,
          merchantId: '21607537',
          merchantName: null,
          merchantPlace: 'RUS;Russia',
          transactionSum: -0.07,
          transactionCurrency: '933',
          accountSum: null,
          commissionSum: null,
          commissionCurrency: null,
          rnnCode: '100000000005',
          authorizationCode: '100006',
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
        1000031: {
          id: '100000049',
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
                id: '100000049'
              },
              fee: 0,
              id: '1000000000000000001',
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
                id: '100000049'
              },
              fee: 0,
              id: '1000000000000000002',
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
                id: '100000049'
              },
              fee: 0,
              id: '1000000000000000003',
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
                id: '100000049'
              },
              fee: 0,
              id: '1000000000000000004',
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
          eventId: '100000050',
          contractId: '1000031',
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
          eventId: '1000000000000000000001',
          contractId: '1000031',
          cardPAN: '422222******1919',
          cardId: '1000000003',
          eventDate: 1694504233000,
          transactionCode: '01000F',
          transactionName: 'P2P SOU Sber Bank > Minsk BLR Терминал: W2P90008 RRN:100000000006 AuthCode:100007',
          merchantId: '0822061',
          merchantPlace: 'P2P SOU Sber Bank > Minsk BLR',
          transactionSum: -92.82,
          transactionCurrency: '933',
          commissionSum: 0,
          commissionCurrency: '933',
          rnnCode: '100000000006',
          authorizationCode: '100007',
          eventStatus: 0,
          payAvailable: false
        },
        {
          sourceSystem: 4,
          eventId: '1000000000000000000002',
          contractId: '1000032',
          cardPAN: '555555******2020',
          cardId: '1000000004',
          eventDate: 1694504233000,
          transactionCode: '01000P',
          transactionName: 'P2P SOU Sber Bank > Minsk BLR Терминал: W2P90008 RRN:100000000007 AuthCode:100008',
          merchantId: '0822061',
          merchantPlace: 'P2P SOU Sber Bank > Minsk BLR',
          transactionSum: 92.82,
          transactionCurrency: '933',
          commissionSum: 0,
          commissionCurrency: '933',
          rnnCode: '100000000007',
          authorizationCode: '100008',
          eventStatus: 0,
          payAvailable: false
        },
        {
          sourceSystem: 3,
          eventId: '100000051',
          contractId: '1000031',
          cardPAN: '422222******1919',
          cardId: '1000000003',
          eventDate: 1694504232000,
          transactionType: -1,
          transactionCode: '313',
          transactionName: 'Перевод BYN на свои карты 555555******2020',
          transactionSum: 92.82,
          transactionCurrency: '933',
          rnnCode: '100000000008',
          authorizationCode: '100007',
          eventStatus: 0,
          souServiceCode: 313,
          souEventId: '100000051',
          payAvailable: false
        }
      ],
      {
        1000031: {
          id: '100000049',
          instrument: 'BYN'
        },
        1000032: {
          id: 'account1',
          instrument: 'BYN'
        }
      },
      [
        {
          date: new Date('2023-09-12T07:37:12.000Z'),
          groupKeys: ['100000051'],
          hold: true,
          merchant: null,
          movements: [
            {
              account: { id: '100000049' },
              fee: 0,
              id: '100000051',
              invoice: null,
              sum: -92.82
            }
          ],
          comment: 'Перевод BYN на свои карты 555555******2020'
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
              account: { id: '100000049' },
              fee: 0,
              id: '1000000000000000000001',
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
              id: '1000000000000000000002',
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
        cardPAN: '111111******2121',
        cardId: 'credit-card',
        eventDate: 1770000000000,
        transactionCode: '01000F',
        transactionName: 'P2P SOU Sber Bank > Minsk BLR Терминал: W2P90008 RRN:100000092424 AuthCode:100009',
        merchantId: '0822061',
        merchantPlace: 'P2P SOU Sber Bank > Minsk BLR',
        transactionSum: -30,
        transactionCurrency: '933',
        commissionSum: 0,
        commissionCurrency: '933',
        rnnCode: '100000092424',
        authorizationCode: '100009',
        eventStatus: 0,
        payAvailable: false
      },
      {
        sourceSystem: 4,
        eventId: 'income-event',
        contractId: 'income-contract',
        cardPAN: '211111******2323',
        cardId: 'income-card',
        eventDate: 1770000000000,
        transactionCode: '01000P',
        transactionName: 'P2P SOU Sber Bank > Minsk BLR Терминал: W2P90008 RRN:100000000010 AuthCode:100010',
        merchantId: '0822061',
        merchantPlace: 'P2P SOU Sber Bank > Minsk BLR',
        transactionSum: 30,
        transactionCurrency: '933',
        commissionSum: 0,
        commissionCurrency: '933',
        rnnCode: '100000000010',
        authorizationCode: '100010',
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
        id: 'card-2323',
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
            account: { id: 'card-2323' },
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

  it('merges online deposit top-up card outcome with target account income', () => {
    const apiTransactions = [
      {
        sourceSystem: 8,
        eventId: 'moneybox-income-event',
        contractId: 'moneybox-contract',
        eventDate: 1770003603000,
        processingDate: 1770000000000,
        transactionType: 1,
        transactionCode: 'D_ZACH_BEZN',
        transactionName: 'On-line пополнение договора с использованием сервиса Мобильный банкинг',
        transactionSum: 75,
        transactionCurrency: '933',
        commissionSum: 0,
        eventStatus: 1
      },
      {
        sourceSystem: 3,
        eventId: 'card-outcome-event',
        souEventId: 'card-outcome-event',
        contractId: 'card-contract',
        cardPAN: '122222******2424',
        cardId: 'card-2424',
        eventDate: 1770003600000,
        processingDate: null,
        transactionType: -1,
        transactionCode: '1455',
        transactionName: 'Пополнение вклада в BYN (on-line) TESTDEPOSIT001',
        transactionSum: 75,
        transactionCurrency: '933',
        commissionSum: 0,
        rnnCode: '100000112424',
        authorizationCode: '100011',
        eventStatus: 0
      },
      {
        sourceSystem: 8,
        eventId: 'card-income-event',
        contractId: 'card-contract',
        eventDate: 1770000000000,
        processingDate: 1769996400000,
        transactionType: 1,
        transactionCode: 'TRAN_ERIP',
        transactionName: 'Пополнение счета через ЕРИП онлайн',
        transactionSum: 75,
        transactionCurrency: '933',
        commissionSum: 0,
        eventStatus: 1
      }
    ]
    const accountsByNumber = {
      'moneybox-contract': {
        id: 'moneybox-account',
        instrument: 'BYN'
      },
      'card-contract': {
        id: 'card-account',
        instrument: 'BYN'
      }
    }

    const transactions = adjustTransactions({
      transactions: convertTransactions(apiTransactions, accountsByNumber)
    })

    expect(transactions).toEqual([
      {
        movements: [
          {
            id: 'card-outcome-event',
            account: { id: 'card-account' },
            invoice: null,
            sum: -75,
            fee: 0
          },
          {
            id: 'moneybox-income-event',
            account: { id: 'moneybox-account' },
            invoice: null,
            sum: 75,
            fee: 0
          }
        ],
        date: new Date(1770003600000),
        hold: null,
        merchant: null,
        comment: 'Пополнение вклада в BYN (on-line) TESTDEPOSIT001'
      },
      {
        hold: false,
        date: new Date(1770000000000),
        movements: [
          {
            id: 'card-income-event',
            account: { id: 'card-account' },
            invoice: null,
            sum: 75,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Пополнение счета через ЕРИП онлайн'
      }
    ])
  })
})
