import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        date: '22.07.2019',
        name: 'Перевод собственных средств',
        descr: '',
        mcc: '9999',
        iso: 'RUB',
        amount: '6000.00',
        payerdate: '22.07.2019',
        cardamount: '6000.00',
        CUR: 'RUB',
        st: 'M',
        card: '40817810450020500000',
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
            sum: 6000,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод собственных средств',
        groupKeys: [
          '22.07.2019_RUB_6000'
        ]
      }
    ]
  ])('converts inner income transfer', (apiTransaction, transaction) => {
    const account = { id: 'account', instrument: 'RUB' }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
