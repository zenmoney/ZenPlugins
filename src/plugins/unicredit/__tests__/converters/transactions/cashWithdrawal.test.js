import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        date: '26.10.2019',
        name: 'ATM 10421360, SERGIEV POSAD',
        descr: 'Операция с наличными в банкомате',
        mcc: '6011',
        iso: 'RUB',
        amount: '-5000.00',
        payerdate: '30.10.2019',
        cardamount: '-5000.00',
        CUR: 'RUB',
        st: 'M',
        card: '40817810150011128561 (522458******0932)',
        clickable: '1'
      },
      {
        hold: false,
        date: new Date(2019, 9, 26),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -5000,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'RUB',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 5000,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ]
  ])('converts cash withdrawal', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toEqual(transaction)
  })
})
