import { convertTransactions } from '../../../converters'

describe('filterDuplicates', () => {
  it.each([
    [
      [
        {
          sourceSystem: 4,
          eventId: '1000000000000000000003',
          contractId: '10000002',
          cardPAN: '911111******2525',
          cardId: '1000000005',
          eventDate: 1712911020000,
          transactionCode: '01000R',
          transactionName: 'SOU Sber Bank > Minsk BLR Терминал: WWL90902 RRN:100000000012 AuthCode:100012',
          merchantId: '0802082',
          merchantPlace: 'SOU Sber Bank > Minsk BLR',
          transactionSum: -50,
          transactionCurrency: '933',
          commissionSum: 0,
          commissionCurrency: '933',
          rnnCode: '100000000012',
          authorizationCode: '100012',
          eventStatus: 0,
          payAvailable: false
        },
        {
          sourceSystem: 2,
          eventId: '1000000006',
          contractId: '10000003',
          contractCurrency: '933',
          cardPAN: '',
          eventDate: 1712911022000,
          processingDate: 1712869200000,
          transactionType: 1,
          transactionCode: '1',
          transactionName: 'Открытие',
          operationCode: '1000001',
          transactionSum: 50,
          transactionCurrency: '933',
          eventStatus: 1,
          payAvailable: false
        },
        {
          sourceSystem: 3,
          eventId: '100000052',
          contractId: '10000002',
          cardPAN: '911111******2525',
          cardId: '1000000005',
          eventDate: 1712911020000,
          transactionType: -1,
          transactionCode: '1463',
          transactionName: 'Открытие вклада в BYN (on-line) 1000001A001XX1',
          transactionSum: 50,
          transactionCurrency: '933',
          rnnCode: '100000000013',
          authorizationCode: '100012',
          eventStatus: 0,
          souServiceCode: 1463,
          souEventId: '100000052',
          payAvailable: false
        }
      ],
      {
        10000002: {
          id: 'account-1',
          instrument: 'BYN'
        },
        10000003: {
          id: 'account-2',
          instrument: 'BYN'
        }
      },
      [
        {
          comment: null,
          date: new Date('2024-04-12T08:37:00.000Z'),
          hold: true,
          merchant: {
            city: 'Minsk',
            country: 'BLR',
            location: null,
            mcc: null,
            title: 'SOU Sber Bank'
          },
          movements: [
            {
              account: { id: 'account-1' },
              fee: 0,
              id: '1000000000000000000003',
              invoice: null,
              sum: -50
            }
          ]
        },
        {
          hold: false,
          date: new Date('2024-04-12T08:37:02.000Z'),
          movements: [
            {
              id: '1000000006',
              account: { id: 'account-2' },
              invoice: null,
              sum: 50,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Открытие'
        }
      ]
    ],
    [
      [
        {
          sourceSystem: 4,
          eventId: 'hold-event',
          contractId: '10000002',
          cardPAN: '911111******2525',
          cardId: '1000000005',
          eventDate: 1712911020000,
          transactionCode: '01000R',
          transactionName: 'SOU Sber Bank > Minsk BLR Терминал: WWL90902 RRN:100000000012 AuthCode:100012',
          merchantId: '0802082',
          merchantPlace: 'SOU Sber Bank > Minsk BLR',
          transactionSum: -50,
          transactionCurrency: '933',
          commissionSum: 0,
          commissionCurrency: '933',
          rnnCode: '100000000012',
          authorizationCode: '100012',
          eventStatus: 0,
          payAvailable: false
        },
        {
          sourceSystem: 1,
          eventId: 'posted-event',
          contractId: '10000002',
          contractCurrency: '933',
          cardPAN: '911111******2525',
          cardId: '1000000005',
          eventDate: 1712911022000,
          processingDate: 1712914622000,
          transactionType: -1,
          transactionCode: '205',
          transactionName: 'Покупка SOU Sber Bank',
          operationCode: null,
          merchantId: '0802082',
          merchantName: 'SOU Sber Bank',
          merchantPlace: 'Minsk',
          transactionSum: 50,
          transactionCurrency: '933',
          accountSum: 50,
          commissionSum: 0,
          commissionCurrency: '933',
          rnnCode: '100000000012',
          authorizationCode: '100012',
          eventStatus: 1,
          payAvailable: false
        }
      ],
      {
        10000002: {
          id: 'account-1',
          instrument: 'BYN'
        }
      },
      [
        {
          hold: false,
          date: new Date('2024-04-12T08:37:02.000Z'),
          movements: [
            {
              id: 'posted-event',
              account: { id: 'account-1' },
              invoice: null,
              sum: -50,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Покупка SOU Sber Bank'
        }
      ]
    ],
    [
      [
        {
          sourceSystem: 4,
          eventId: 'hold-event',
          contractId: '10000002',
          cardPAN: '911111******2525',
          cardId: '1000000005',
          eventDate: 1712911020000,
          transactionCode: '01000R',
          transactionName: 'SOU Sber Bank > Minsk BLR Терминал: WWL90902 RRN:100000000012 AuthCode:100012',
          merchantId: '0802082',
          merchantPlace: 'SOU Sber Bank > Minsk BLR',
          transactionSum: -50,
          transactionCurrency: '933',
          commissionSum: 0,
          commissionCurrency: '933',
          rnnCode: '100000000012',
          authorizationCode: '100012',
          eventStatus: 0,
          payAvailable: false
        },
        {
          sourceSystem: 1,
          eventId: 'posted-event',
          contractId: '10000002',
          contractCurrency: '933',
          cardPAN: '911111******2525',
          cardId: '1000000005',
          eventDate: 1712911022000,
          processingDate: 1712914622000,
          transactionType: -1,
          transactionCode: '205',
          transactionName: 'Покупка SOU Sber Bank',
          operationCode: null,
          merchantId: '0802082',
          merchantName: 'SOU Sber Bank',
          merchantPlace: 'Minsk',
          transactionSum: 50,
          transactionCurrency: '933',
          accountSum: 50,
          commissionSum: 0,
          commissionCurrency: '933',
          rnnCode: '100000000012',
          authorizationCode: '100013',
          eventStatus: 1,
          payAvailable: false
        }
      ],
      {
        10000002: {
          id: 'account-1',
          instrument: 'BYN'
        }
      },
      [
        {
          hold: false,
          date: new Date('2024-04-12T08:37:02.000Z'),
          movements: [
            {
              id: 'posted-event',
              account: { id: 'account-1' },
              invoice: null,
              sum: -50,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Покупка SOU Sber Bank'
        }
      ]
    ],
    [
      [
        {
          sourceSystem: 4,
          eventId: 'hold-event',
          contractId: '10000002',
          cardPAN: '911111******2525',
          cardId: '1000000005',
          eventDate: 1712911020000,
          transactionCode: '01000R',
          transactionName: 'SOU Sber Bank > Minsk BLR Терминал: WWL90902 RRN:100000000012 AuthCode:100012',
          merchantId: '0802082',
          merchantPlace: 'SOU Sber Bank > Minsk BLR',
          transactionSum: -50,
          transactionCurrency: '933',
          commissionSum: 0,
          commissionCurrency: '933',
          rnnCode: '100000000012',
          authorizationCode: '100012',
          eventStatus: 0,
          payAvailable: false
        },
        {
          sourceSystem: 1,
          eventId: 'posted-event',
          contractId: '10000002',
          contractCurrency: '933',
          cardPAN: '911111******2525',
          cardId: '',
          eventDate: 1712911022000,
          processingDate: 1712914622000,
          transactionType: -1,
          transactionCode: '205',
          transactionName: 'Покупка SOU Sber Bank',
          operationCode: null,
          merchantId: '0802082',
          merchantName: 'SOU Sber Bank',
          merchantPlace: 'Minsk',
          transactionSum: 50,
          transactionCurrency: '933',
          accountSum: 50,
          commissionSum: 0,
          commissionCurrency: '933',
          rnnCode: '100000000012',
          authorizationCode: '100012',
          eventStatus: 1,
          payAvailable: false
        }
      ],
      {
        10000002: {
          id: 'account-1',
          instrument: 'BYN'
        }
      },
      [
        {
          hold: false,
          date: new Date('2024-04-12T08:37:02.000Z'),
          movements: [
            {
              id: 'posted-event',
              account: { id: 'account-1' },
              invoice: null,
              sum: -50,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Покупка SOU Sber Bank'
        }
      ]
    ],
    [
      [
        {
          sourceSystem: 3,
          eventId: '100000053',
          contractId: '10000004',
          contractCurrency: '933',
          cardPAN: '911111******2323',
          cardId: 'income-card',
          eventDate: 1780994156000,
          transactionType: -1,
          transactionCode: '5337531',
          transactionName: 'Пополнение карточки 1000000000002',
          transactionSum: 20,
          transactionCurrency: '933',
          rnnCode: '100000000014',
          authorizationCode: '100014',
          eventStatus: 0,
          payAvailable: false
        }
      ],
      {
        10000004: {
          id: 'card-2323',
          instrument: 'BYN'
        }
      },
      [
        {
          hold: true,
          date: new Date(1780994156000),
          movements: [
            {
              id: '100000053',
              account: { id: 'card-2323' },
              invoice: null,
              sum: -20,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Пополнение карточки 1000000000002'
        }
      ]
    ],
    [
      [
        {
          sourceSystem: 8,
          eventId: '-100000019999#7#25',
          contractId: '10000004',
          contractCurrency: '933',
          cardPAN: '',
          eventDate: 1779901343000,
          processingDate: 1779829200000,
          transactionType: 1,
          transactionCode: 'TRAN_ERIP',
          transactionName: 'Пополнение счета через ЕРИП онлайн',
          transactionSum: 20,
          transactionCurrency: '933',
          eventStatus: 1,
          payAvailable: false
        },
        {
          sourceSystem: 8,
          eventId: '-100000019999#7#26',
          contractId: '10000004',
          contractCurrency: '933',
          cardPAN: '',
          eventDate: 1779901343000,
          processingDate: 1779829200000,
          transactionType: 1,
          transactionCode: 'TRAN_ERIP',
          transactionName: 'Пополнение счета через ЕРИП онлайн',
          transactionSum: 20,
          transactionCurrency: '933',
          eventStatus: 1,
          payAvailable: false
        }
      ],
      {
        10000004: {
          id: 'account-1',
          instrument: 'BYN'
        }
      },
      [
        {
          hold: false,
          date: new Date('2026-05-27T17:02:23.000Z'),
          movements: [
            {
              id: '-100000019999#7#25',
              account: { id: 'account-1' },
              invoice: null,
              sum: 20,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Пополнение счета через ЕРИП онлайн'
        },
        {
          hold: false,
          date: new Date('2026-05-27T17:02:23.000Z'),
          movements: [
            {
              id: '-100000019999#7#26',
              account: { id: 'account-1' },
              invoice: null,
              sum: 20,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Пополнение счета через ЕРИП онлайн'
        }
      ]
    ]
  ])('converts filter duplicates transactions', (apiTransactions, accountsByContractNumber, transactions) => {
    expect(convertTransactions(apiTransactions, accountsByContractNumber)).toEqual(transactions)
  })
})
