import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        oper_date: '27.08.2021',
        oper_time: '20:14',
        is_blocked: false,
        is_income: false,
        post_time: '29.08.2021',
        amount: 30000,
        cur: 'KZT',
        fee: 0,
        cms: 0,
        title: 'Перевод с карты *7127',
        description: 'Перевод с карты *7127',
        image: 'transactions/transfer.png',
        rrn: '534282234',
        trn_id: 2386042496,
        eci: '08'
      },
      {
        comment: 'Перевод с карты *7127',
        date: new Date('2021-08-27T20:14:00.000+06:00'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: {
              id: '2087116'
            },
            fee: 0,
            id: '2386042496',
            invoice: null,
            sum: -30000
          },
          {
            account: {
              company: null,
              instrument: 'KZT',
              syncIds: ['7127'],
              type: 'ccard'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: 30000
          }
        ]
      }
    ],
    [
      {
        oper_date: '15.07.2022',
        oper_time: '13:17',
        is_blocked: false,
        is_income: false,
        post_time: '18.07.2022',
        amount: 800,
        cur: 'KZT',
        fee: 1012,
        cms: 1012,
        title: 'TCOU',
        description: 'TCOU',
        image: 'transactions/transfer.png',
        rrn: '219685333615',
        trn_id: 3563049919,
        eci: ''
      },
      {
        hold: false,
        date: new Date('2022-07-15T13:17:00+06:00'),
        movements:
          [
            {
              id: '3563049919',
              account: { id: '2087116' },
              invoice: null,
              sum: -800,
              fee: -1012
            },
            {
              id: null,
              account: {
                type: 'ccard',
                instrument: 'KZT',
                company: null,
                syncIds: null
              },
              invoice: null,
              sum: 800,
              fee: 0
            }
          ],
        merchant: null,
        comment: 'TCOU'
      }
    ],
    [
      {
        oper_date: '18.05.2022',
        oper_time: '03:09',
        is_blocked: false,
        is_income: false,
        post_time: '19.05.2022',
        amount: 150,
        cur: 'KZT',
        fee: 250,
        cms: 250,
        title: 'Перевод с карты *0080',
        description: 'Перевод с карты *0080',
        image: 'transactions/transfer.png',
        rrn: '213885554992',
        trn_id: 3268480734,
        eci: '05'
      },
      {
        hold: false,
        date: new Date('2022-05-18T03:09:00+06:00'),
        movements:
          [
            {
              id: '3268480734',
              account: { id: '2087116' },
              invoice: null,
              sum: -150,
              fee: -250
            },
            {
              id: null,
              account: {
                type: 'ccard',
                instrument: 'KZT',
                company: null,
                syncIds: ['0080']
              },
              invoice: null,
              sum: 150,
              fee: 0
            }
          ],
        merchant: null,
        comment: 'Перевод с карты *0080'
      }
    ]
  ])('converts outerTransfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, [
      {
        id: '2087116',
        instrument: 'KZT'
      }
    ])).toEqual(transaction)
  })
})
