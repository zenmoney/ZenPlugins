import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        date: '19.07.2019',
        name: 'перевод  НДС не облагается',
        descr: '',
        mcc: '',
        iso: 'RUB',
        amount: '-83000.00',
        payerdate: '19.07.2019',
        cardamount: '-83000.00',
        CUR: 'RUB',
        st: 'M',
        card: '40817810750020500000',
        clickable: '1'
      },
      {
        hold: false,
        date: new Date(2019, 6, 19),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -83000,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'RUB',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 83000,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'перевод  НДС не облагается'
      }
    ]
  ])('converts outer transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toEqual(transaction)
  })
})
