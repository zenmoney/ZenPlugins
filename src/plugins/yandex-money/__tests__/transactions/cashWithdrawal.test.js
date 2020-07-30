import { convertTransaction } from '../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        operation_id: '599249979205221162',
        title: 'Снятие наличных в банкомате: VB24 D. 15, LIT. G, PR',
        amount: 10000,
        direction: 'out',
        datetime: '2018-12-27T18:19:39Z',
        status: 'success',
        type: 'payment-shop',
        group_id: 'mcc_6011',
        spendingCategories: [{ name: 'TransferWithdraw', sum: 10000 }]
      },
      {
        date: new Date('2018-12-27T18:19:39.000Z'),
        hold: false,
        comment: 'Снятие наличных в банкомате: VB24 D. 15, LIT. G, PR',
        merchant: null,
        movements: [
          {
            id: '599249979205221162',
            account: { id: 'account' },
            invoice: null,
            sum: -10000,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'RUB',
              syncIds: null,
              company: null
            },
            invoice: null,
            sum: 10000,
            fee: 0
          }
        ]
      }
    ]
  ])('converts cash withdrawal', (apiTransaction, transaction) => {
    const account = { id: 'account', instrument: 'RUB' }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
