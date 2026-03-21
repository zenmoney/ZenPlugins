import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  const accounts = [
    {
      balance: 0,
      id: '5453672',
      instrument: 'KZT',
      savings: false,
      syncIds: [
        'KZ908562204116516952',
        '446375******7973'
      ],
      title: '#TravelCard',
      type: 'ccard'
    },
    {
      balance: 8475.53,
      id: '5448109',
      instrument: 'EUR',
      savings: false,
      syncIds: [
        'KZ658562204216705695'
      ],
      title: 'Счёт EUR #TravelCard',
      type: 'checking'
    }
  ]

  it.each([
    [
      {
        oper_date: '10.05.2022',
        oper_time: '21:10',
        is_blocked: true,
        is_income: false,
        amount: 30.15,
        cur: 'EUR',
        fee: 0,
        cms: 0,
        title: 'PBZ7DMP83',
        description: 'PBZ7DMP83',
        image: 'transactions/beauty.png',
        rrn: '',
        trn_id: 3237108827,
        eci: ''
      },
      {
        hold: true,
        date: new Date('2022-05-10T17:10:00+02:00'),
        movements:
          [
            {
              id: '3237108827',
              account: { id: '5448109' },
              invoice: null,
              sum: -30.15,
              fee: 0
            }
          ],
        merchant:
          {
            country: null,
            city: null,
            title: 'PBZ7DMP83',
            mcc: null,
            location: null
          },
        comment: null
      }

    ]
  ])('converts accountTransaction', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, accounts)).toEqual(transaction)
  })
})
