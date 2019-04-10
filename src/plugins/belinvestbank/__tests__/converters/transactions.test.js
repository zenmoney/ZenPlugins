import { convertTransaction } from '../../converters'

describe('convertTransaction', () => {
  const accounts = [{
    id: '30848200',
    type: 'card',
    title: 'Безымянная*1111',
    instrument: 'BYN',
    balance: 99.9,
    syncID: ['1111']
  }]

  const tt = [
    {
      name: 'failed transaction',
      transaction: {
        status: 'ОТМЕНЕНО'
      },
      expectedTransaction: null
    },
    {
      name: 'cash add',
      transaction: {
        cardNum: '**** **** **** 1111',
        date: '2019-01-01 10:12:13',
        type: 'Выдача наличных',
        accountAmt: '10,13',
        status: 'ПРОВЕДЕНО',
        cardAcceptor: 'Выдача наличных в ATM'
      },
      expectedTransaction: {
        hold: false,
        date: new Date('2019-01-01T10:12:13+03:00'),
        movements: [
          {
            id: null,
            invoice: null,
            account: { id: '30848200' },
            sum: -10.13,
            fee: 0
          },
          {
            account: {
              company: null,
              instrument: undefined,
              syncIds: null,
              type: 'cash'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: 10.13
          }
        ],
        merchant: {
          fullTitle: 'Выдача наличных в ATM',
          location: null,
          mcc: null
        },
        comment: null
      }
    }
  ]

  // run all tests
  tt.forEach(function (tc) {
    it(tc.name, () => {
      const transaction = convertTransaction(tc.transaction, accounts)

      expect(transaction).toEqual(tc.expectedTransaction)
    })
  })
})
