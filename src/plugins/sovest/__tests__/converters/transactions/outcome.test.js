import { convertTransaction } from '../../../converters'

describe('convertTransactions', () => {
  it.each([
    [
      {
        txnId: 63087317,
        txnDate: '2020-03-26T14:48:54+03:00',
        txnStatus: 2,
        txnType: 2,
        txnErrorId: -1,
        txnAmount: 99.9,
        installmentsAmount: 99.9,
        ownAmount: 0,
        installmentsMonths: 10,
        partnersName: 'Burger King',
        tradePointName: 'Мобильное приложение',
        txnAcctBal: 46300.46,
        txnDebt: 21699.54
      },
      {
        hold: false,
        date: new Date('2020-03-26T14:48:54+03:00'),
        movements: [
          {
            id: 63087317,
            account: { id: 'account' },
            invoice: null,
            sum: -99.9,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'Burger King',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
  ])('converts outcome spending', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, [{ id: 'account', instrument: 'RUR' }])).toEqual(transaction)
  })
})
