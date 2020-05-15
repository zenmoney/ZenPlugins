import { convertTransaction } from '../../../converters'

describe('convertTransactions', () => {
  it.each([
    [
      {
        txnId: 66229151,
        txnDate: '2020-05-07T22:07:38+03:00',
        txnStatus: 2,
        txnType: 9,
        txnErrorId: -1,
        txnAmount: 998,
        installmentsAmount: 998,
        ownAmount: 0,
        installmentsMonths: 1,
        partnersName: 'Комиссия за перевод',
        txnAcctBal: 1.28,
        txnDebt: 67998.72
      },
      {
        hold: false,
        date: new Date('2020-05-07T22:07:38+03:00'),
        movements: [
          {
            id: 66229151,
            account: { id: 'account' },
            invoice: null,
            sum: -998,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Комиссия за перевод'
      }
    ],
    [
      { txnId: 64568183,
        txnDate: '2020-04-13T17:59:08+03:00',
        txnStatus: 2,
        txnType: 1,
        txnErrorId: -1,
        txnAmount: 695.3,
        installmentsAmount: 0,
        ownAmount: 695.3,
        installmentsMonths: 0,
        partnersName: 'Штраф за невнесение ежемесячного платежа' },
      {
        hold: false,
        date: new Date('2020-04-13T17:59:08+03:00'),
        movements: [
          {
            id: 64568183,
            account: { id: 'account' },
            invoice: null,
            sum: -695.3,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Штраф за невнесение ежемесячного платежа'
      }
    ]
  ])('converts outcome spending (add comments only)', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, [{ id: 'account', instrument: 'RUR' }])).toEqual(transaction)
  })
})
