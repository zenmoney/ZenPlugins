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
        comment: 'Перевод на карту 489993******2773',
        date: new Date('2021-08-23T19:27:00.000+06:00'),
        groupKeys: [
          '2372881640'
        ],
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
          }
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
        comment: 'Перевод c карты 510445******7127',
        date: new Date('2021-08-23T19:27:00.000+06:00'),
        groupKeys: [
          '2372881640'
        ],
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
          }
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
        title: 'Перевод на счет KZ068562799116995262',
        description: 'Перевод на счет KZ068562799116995262',
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
        comment: 'Перевод на счет KZ068562799116995262',
        groupKeys: ['3408885048']
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
            }
          ],
        merchant: null,
        comment: 'Перевод c карты 489993******5191',
        groupKeys: ['3408885048']
      }
    ]
  ])('converts innerTransfer', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
