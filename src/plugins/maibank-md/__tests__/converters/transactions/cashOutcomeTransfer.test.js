import { convertTransactions } from '../../../converters'

describe('convertTransactions', () => {
  const account = {
    id: 'account',
    instrument: 'MDL'
  }
  const cardsByLastFourDigits = {
    9473: {
      lastFour: '9473',
      account
    }
  }
  it.each([
    [
      [{
        amount: 5000,
        amountInCardCurrency: 5000,
        approvalCode: '995685',
        balanceAfter: 660.63,
        cardLast4digits: '9473',
        categoryId: '9',
        ccy: 'MDL',
        date: 1549437833000,
        description: 'ATM MAIB AG 1 SUC BALTI>BALTI         MD',
        exchangeRate: 1,
        id: '8B4D17EF-D00C-43A1-B82E-CEB7626DD0FE',
        mdlAmountCents: {
          isPresent: true,
          value: 500000
        },
        origin: { },
        rrn: '903709300551',
        type: 3
      },
      {
        amount: 0,
        balanceAfter: 5660.63
      }],
      [{
        hold: false,
        date: new Date(1549437833000),
        movements: [
          {
            id: '8B4D17EF-D00C-43A1-B82E-CEB7626DD0FE',
            account: { id: 'account' },
            invoice: null,
            sum: -5000.0,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'MDL',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 5000.0,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }]
    ]
  ])('converts cash outcome transfers', (apiTransactions, transactions) => {
    expect(convertTransactions(apiTransactions, cardsByLastFourDigits)).toEqual(transactions)
  })
})
