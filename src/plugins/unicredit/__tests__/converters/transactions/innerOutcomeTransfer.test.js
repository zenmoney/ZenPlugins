import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        date: '22.07.2019',
        name: 'Payments',
        descr: 'Перевод',
        iso: 'RUR',
        amount: '-6000.00',
        payerdate: '22.07.2019',
        cardamount: '',
        CUR: '',
        st: 'M',
        card: '40817810750020500000',
        clickable: '1'
      },
      {
        hold: false,
        date: new Date(2019, 6, 22),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -6000,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод',
        groupKeys: [
          '22.07.2019_RUB_6000'
        ]
      }
    ]
  ])('converts inner outcome transfer', (apiTransaction, transaction) => {
    const account = { id: 'account', instrument: 'RUB' }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
