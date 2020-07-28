import { convertTransaction } from '../../converters'

const toReadableTransactionForAccount = account => transaction => convertTransaction(transaction, account)

describe('convertTransaction', () => {
  const account = {
    id: 'account',
    instrument: 'RUB'
  }

  it('converts cash withdrawal', () => {
    const apiTransactions = [
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
      }
    ]

    const expectedReadableTransactions = [
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

    const toReadableTransaction = toReadableTransactionForAccount(account)
    const readableTransactions = apiTransactions.map(toReadableTransaction)
    expect(readableTransactions).toEqual(expectedReadableTransactions)
  })
})
