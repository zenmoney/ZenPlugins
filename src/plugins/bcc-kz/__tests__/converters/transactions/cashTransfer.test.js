import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        oper_date: '10.02.2021',
        oper_time: '19:25',
        is_blocked: false,
        is_income: false,
        post_time: '10.02.2021',
        amount: 350000,
        cur: 'KZT',
        fee: 0,
        cms: 0,
        title: 'Снятие денег через банкомат KAZAHSTAN, ALMATY G, T',
        description: 'Снятие денег через банкомат KAZAHSTAN, ALMATY G, T',
        image: 'transactions/db.png',
        rrn: '104102780584',
        trn_id: 1871783097,
        eci: ''
      },
      {
        comment: 'Снятие денег через банкомат KAZAHSTAN, ALMATY G, T',
        date: new Date('2021-02-10T19:25:00.000+06:00'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: {
              id: '2087116'
            },
            fee: 0,
            id: '1871783097',
            invoice: null,
            sum: -350000
          },
          {
            account: {
              company: null,
              instrument: 'KZT',
              syncIds: null,
              type: 'cash'
            },
            id: null,
            invoice: null,
            sum: 350000,
            fee: 0
          }
        ]
      }
    ]
  ])('converts cashTransfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, [{ id: '2087116', instrument: 'KZT' }])).toEqual(transaction)
  })
})
