import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        oper_date: '18.03.2021',
        oper_time: '20:55',
        is_blocked: false,
        is_income: false,
        post_time: '20.03.2021',
        amount: 5460,
        cur: 'KZT',
        fee: 0,
        cms: 0,
        title: 'Sulpak',
        description: 'Sulpak',
        image: 'transactions/sulpak.png',
        rrn: '107780003665',
        trn_id: 1962600239,
        eci: ''
      },
      {
        comment: null,
        date: new Date('2021-03-18T20:55:00.000+06:00'),
        hold: false,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'Sulpak'
        },
        movements: [
          {
            account: {
              id: '1337'
            },
            fee: 0,
            id: '1962600239',
            invoice: null,
            sum: -5460
          }
        ]
      }
    ],
    [
      {
        oper_date: '18.03.2021',
        oper_time: '15:49',
        is_blocked: false,
        is_income: false,
        post_time: '20.03.2021',
        amount: 1300,
        cur: 'KZT',
        fee: 0,
        cms: 0,
        title: 'FRUIT REPUBLIC CAFE',
        description: 'FRUIT REPUBLIC CAFE',
        image: 'transactions/cafe.png',
        rrn: '107781881876',
        trn_id: 1961960541,
        eci: ''
      },
      {
        comment: null,
        date: new Date('2021-03-18T15:49:00.000+06:00'),
        hold: false,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'FRUIT REPUBLIC CAFE'
        },
        movements: [
          {
            account: {
              id: '1337'
            },
            fee: 0,
            id: '1961960541',
            invoice: null,
            sum: -1300
          }
        ]
      }
    ],
    [
      {
        oper_date: '03.12.2022',
        oper_time: '17:03',
        is_blocked: false,
        is_income: false,
        post_time: '03.12.2022',
        amount: 35000,
        cur: 'KZT',
        fee: 0,
        cms: 0,
        title: '',
        description: '',
        image: 'banks/brkekzka.png',
        rrn: '',
        trn_id: 4431735653,
        eci: ''
      },
      {
        hold: false,
        date: new Date('2022-12-03T17:03:00+0600'),
        movements:
          [
            {
              id: '4431735653',
              account: { id: '1337' },
              invoice: null,
              sum: -35000,
              fee: 0
            }
          ],
        merchant: null,
        comment: null
      }
    ],
    [
      {
        oper_date: '03.10.2025',
        oper_time: '16:05',
        is_blocked: false,
        is_income: false,
        post_time: '03.10.2025',
        amount: 9900,
        cur: 'KZT',
        fee: 500,
        cms: 500,
        title: 'Николаев Николай Николаевич',
        description: 'Николаев Николай Николаевич',
        image: 'banks/tseskzka.png',
        bonus_prc: 0,
        rrn: '',
        trn_id: 14214438890,
        trn_code: 2560,
        eci: '',
        refer: '97B33172A38CF9B1D81E20C1D4DFD6F7'
      },
      {
        date: new Date('2025-10-03T16:05:00.000+06:00'),
        hold: false,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'Николаев Николай Николаевич'
        },
        movements: [
          {
            account: { id: '1337' },
            fee: -500,
            id: '14214438890',
            invoice: null,
            sum: -9900
          }
        ],
        comment: null
      }
    ]
  ])('converts outcome', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, [
      {
        id: '1337',
        instrument: 'KZT'
      }
    ])).toEqual(transaction)
  })
})
