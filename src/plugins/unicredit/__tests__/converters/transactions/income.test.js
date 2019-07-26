import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        date: '19.07.2019',
        name: 'Salary Jul2019',
        descr: '',
        mcc: '9999',
        iso: 'RUB',
        amount: '86088.39',
        payerdate: '19.07.2019',
        cardamount: '86088.39',
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
            sum: 86088.39,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Salary Jul2019'
      }
    ],
    [
      {
        date: '18.07.2019',
        name: 'CASA Interest Liquidation',
        descr: 'Начисление процентов',
        iso: 'RUR',
        amount: '10.71',
        payerdate: '18.07.2019',
        cardamount: '',
        CUR: '',
        st: 'M',
        card: '40817810750020500000',
        clickable: '1'
      },
      {
        hold: false,
        date: new Date(2019, 6, 18),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 10.71,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Начисление процентов'
      }
    ]
  ])('converts income', (apiTransaction, transaction) => {
    const account = { id: 'account', instrument: 'RUB' }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
