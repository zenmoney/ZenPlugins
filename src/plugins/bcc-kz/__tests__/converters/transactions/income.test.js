import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        oper_date: '26.08.2021',
        oper_time: '18:43',
        is_blocked: false,
        is_income: true,
        post_time: '26.08.2021',
        amount: 130000,
        cur: 'KZT',
        fee: 0,
        cms: 0,
        title: 'Заработная плата',
        description: 'Товарищество с ограниченной ответственностью "CENTRAL ASIA MEDICAL INDUSTRIES"',
        image: 'transactions/cr.png',
        rrn: '',
        trn_id: null,
        eci: ''
      },
      {
        comment: null,
        date: new Date('2021-08-26T18:43:00.000+06:00'),
        hold: false,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'Товарищество с ограниченной ответственностью "CENTRAL ASIA MEDICAL INDUSTRIES"'
        },
        movements: [
          {
            account: {
              id: '1337'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: 130000
          }
        ]
      }
    ]
  ])('converts income', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, [{ id: '1337', instrument: 'KZT' }])).toEqual(transaction)
  })
})
