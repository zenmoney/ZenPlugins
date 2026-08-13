import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        oper_date: '23.08.2021',
        oper_time: '19:27',
        is_blocked: false,
        is_income: false,
        post_time: '23.08.2021',
        amount: 39901,
        cur: 'KZT',
        fee: 0,
        cms: 0,
        title: 'Перевод на карту 489993******2773',
        description: 'Перевод на карту 489993******2773',
        image: 'transfers/own_transfer.png',
        rrn: '',
        trn_id: 2372881640,
        eci: ''
      },
      [
        {
          id: '2087116',
          instrument: 'KZT'
        }
      ],
      {
        comment: null,
        date: new Date('2021-08-23T19:27:00.000+06:00'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: {
              id: '2087116'
            },
            fee: 0,
            id: '2372881640-',
            invoice: null,
            sum: -39901
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'KZT',
              company: null,
              syncIds: ['2773']
            },
            invoice: null,
            sum: 39901,
            fee: 0
          }
        ],
        groupKeys: [
          '2372881640',
          null
        ]
      }
    ],
    [
      {
        oper_date: '23.08.2021',
        oper_time: '19:27',
        is_blocked: false,
        is_income: true,
        post_time: '23.08.2021',
        amount: 39901,
        cur: 'KZT',
        fee: 0,
        cms: 0,
        title: 'Перевод c карты 510445******7127',
        description: 'Перевод c карты 510445******7127',
        image: 'transfers/own_transfer.png',
        rrn: '',
        trn_id: 2372881640,
        eci: ''
      },
      [
        {
          id: '3849913',
          instrument: 'KZT'
        }
      ],
      {
        comment: null,
        date: new Date('2021-08-23T19:27:00.000+06:00'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: {
              id: '3849913'
            },
            fee: 0,
            id: '2372881640+',
            invoice: null,
            sum: 39901
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'KZT',
              company: null,
              syncIds: ['7127']
            },
            invoice: null,
            sum: -39901,
            fee: 0
          }
        ],
        groupKeys: [
          '2372881640',
          null
        ]
      }
    ],
    [
      {
        oper_date: '12.06.2022',
        oper_time: '19:35',
        is_blocked: false,
        is_income: false,
        post_time: '12.06.2022',
        amount: 0,
        cur: 'KZT',
        fee: 43312.84,
        cms: 43312.84,
        title: 'Перевод на счет KZ000000000000000101',
        description: 'Перевод на счет KZ000000000000000101',
        image: 'transfers/own_transfer.png',
        rrn: '',
        trn_id: 3408885048,
        eci: ''
      },
      [
        {
          id: '5553203',
          instrument: 'KZT'
        }
      ],
      {
        hold: false,
        date: new Date('2022-06-12T19:35:00.000+06:00'),
        movements:
          [
            {
              id: '3408885048-',
              account: { id: '5553203' },
              invoice: null,
              sum: -43312.84,
              fee: 0
            }
          ],
        merchant: null,
        comment: 'Перевод на счет KZ000000000000000101',
        groupKeys: [
          '3408885048',
          null
        ]
      }
    ],
    [
      {
        oper_date: '12.06.2022',
        oper_time: '19:35',
        is_blocked: false,
        is_income: true,
        post_time: '12.06.2022',
        amount: 43312.84,
        cur: 'KZT',
        fee: 0,
        cms: 0,
        title: 'Перевод c карты 489993******5191',
        description: 'Перевод c карты 489993******5191',
        image: 'transfers/own_transfer.png',
        rrn: '',
        trn_id: 3408885048,
        eci: ''
      },
      [
        {
          id: '5553202',
          instrument: 'KZT'
        }
      ],
      {
        hold: false,
        date: new Date('2022-06-12T19:35:00.000+06:00'),
        movements:
          [
            {
              id: '3408885048+',
              account: { id: '5553202' },
              invoice: null,
              sum: 43312.84,
              fee: 0
            },
            {
              id: null,
              account: {
                type: 'ccard',
                instrument: 'KZT',
                company: null,
                syncIds: ['5191']
              },
              invoice: null,
              sum: -43312.84,
              fee: 0
            }
          ],
        merchant: null,
        comment: null,
        groupKeys: [
          '3408885048',
          null
        ]
      }
    ],
    [
      {
        oper_date: '05.03.2026',
        oper_time: '14:55',
        is_blocked: false,
        is_income: true,
        post_time: '05.03.2026',
        amount: 90000,
        cur: 'KZT',
        fee: 0,
        cms: 0,
        title: 'Перевод cо счета KZ000000000000000123',
        description: 'Перевод cо счета KZ000000000000000123',
        image: 'transfers/own_transfer.png',
        rrn: '',
        trn_id: 10000000001,
        eci: ''
      },
      [
        {
          id: '14100085',
          instrument: 'KZT',
          syncIds: ['KZ000000000000000505', '5058']
        },
        {
          id: '19826824',
          instrument: 'KZT',
          syncIds: ['KZ000000000000000123']
        }
      ],
      {
        hold: false,
        date: new Date('2026-03-05T14:55:00.000+06:00'),
        movements:
          [
            {
              id: '10000000001+',
              account: { id: '14100085' },
              invoice: null,
              sum: 90000,
              fee: 0
            },
            {
              id: null,
              account: { id: '19826824' },
              invoice: null,
              sum: -90000,
              fee: 0
            }
          ],
        merchant: null,
        comment: null,
        groupKeys: [
          '10000000001',
          null
        ]
      }
    ],
    [
      {
        oper_date: '21.10.2025',
        oper_time: '23:08',
        is_blocked: false,
        is_income: false,
        post_time: '21.10.2025',
        amount: 4375,
        cur: 'KZT',
        fee: 0,
        cms: 0,
        title: 'Перевод на счет KZ000000000000000102',
        description: 'Перевод на счет KZ000000000000000102',
        image: 'transfers/own_transfer.png',
        bonus_prc: 0,
        rrn: '',
        trn_id: 10000000002,
        trn_code: 2511,
        eci: '',
        refer: '8DE00BCBFE6A89C1A5E44F1AA83D17EA'
      },
      [
        {
          id: '15896430',
          type: 'ccard',
          title: 'Visa SilverMonoCard',
          instrument: 'KZT',
          syncIds: ['KZ000000000000000103', '5529'],
          savings: false,
          balance: 246.89
        },
        {
          id: '19739830',
          type: 'checking',
          title: 'BCC Договора РКО (Металические счета - XAG)',
          instrument: 'A99',
          syncIds: ['KZ000000000000000102'],
          balance: 0
        }
      ],
      {
        hold: false,
        date: new Date('2025-10-21T20:08:00.000+03:00'),
        movements: [
          {
            id: '10000000002-',
            account: { id: '15896430' },
            invoice: null,
            sum: -4375,
            fee: 0
          },
          {
            id: null,
            account: { id: '19739830' },
            invoice: null,
            sum: 4375,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '10000000002',
          '8DE00BCBFE6A89C1A5E44F1AA83D17EA'
        ]
      }
    ],
    [
      {
        oper_date: '21.10.2025',
        oper_time: '23:08',
        is_blocked: false,
        is_income: true,
        post_time: '21.10.2025',
        amount: 5,
        cur: 'XAG',
        fee: 0,
        cms: 0,
        title: 'Перевод c карты 489993******5529',
        description: 'Перевод c карты 489993******5529',
        image: 'transfers/own_transfer.png',
        bonus_prc: 0,
        rrn: '',
        trn_id: 10000000002,
        trn_code: 2511,
        eci: '',
        refer: '8DE00BCBFE6A89C1A5E44F1AA83D17EA'
      },
      [
        {
          id: '15896430',
          type: 'ccard',
          title: 'Visa SilverMonoCard',
          instrument: 'KZT',
          syncIds: ['KZ000000000000000103', '5529'],
          savings: false,
          balance: 246.89
        },
        {
          id: '19739830',
          type: 'checking',
          title: 'BCC Договора РКО (Металические счета - XAG)',
          instrument: 'A99',
          syncIds: ['KZ000000000000000102'],
          balance: 0
        }
      ],
      {
        hold: false,
        date: new Date('2025-10-21T20:08:00.000+03:00'),
        movements: [
          {
            id: '10000000002+',
            account: { id: '19739830' },
            invoice: null,
            sum: 5,
            fee: 0
          },
          {
            id: null,
            account: { id: '15896430' },
            invoice: null,
            sum: -5,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '10000000002',
          '8DE00BCBFE6A89C1A5E44F1AA83D17EA'
        ]
      }
    ],
    [
      {
        oper_date: '12.12.2025',
        oper_time: '15:08',
        is_blocked: false,
        is_income: true,
        post_time: '12.12.2025',
        amount: 74961.6,
        cur: 'KZT',
        fee: 0,
        cms: 0,
        title: 'Перевод cо счета KZ000000000000000104',
        description: 'Перевод cо счета KZ000000000000000104',
        image: 'transfers/own_transfer.png',
        bonus_prc: 0,
        rrn: '',
        trn_id: 10000000003,
        trn_code: 2532,
        eci: '',
        refer: '75462BCD0A2058913528CC0235C50074'
      },
      [
        {
          id: '10492200',
          type: 'checking',
          title: 'Счет для погашения займа KZT',
          instrument: 'KZT',
          syncIds: ['KZ000000000000000105']
        },
        {
          id: '17933627',
          type: 'deposit',
          title: 'Чемпион Чемпион',
          instrument: 'KZT',
          syncIds: ['KZ000000000000000104']
        }
      ],
      {
        hold: false,
        date: new Date('2025-12-12T12:08:00.000+03:00'),
        movements: [
          {
            id: '10000000003+',
            account: { id: '10492200' },
            invoice: null,
            sum: 74961.6,
            fee: 0
          },
          {
            id: null,
            account: { id: '17933627' },
            invoice: null,
            sum: -74961.6,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '10000000003',
          '75462BCD0A2058913528CC0235C50074'
        ]
      }
    ]
  ])('converts innerTransfer', (apiTransaction, accounts, transaction) => {
    expect(convertTransaction(apiTransaction, accounts)).toEqual(transaction)
  })
})
