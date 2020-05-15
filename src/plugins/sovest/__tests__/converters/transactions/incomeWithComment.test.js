import { convertTransaction } from '../../../converters'

describe('convertTransactions', () => {
  it.each([
    [
      {
        txnId: 56360051,
        txnDate: '2020-01-20T18:09:06+03:00',
        txnStatus: 2,
        txnType: 7,
        txnErrorId: -1,
        txnAmount: 217.4,
        installmentsAmount: 0,
        ownAmount: 217.4,
        installmentsMonths: 0,
        partnersName: 'Начисление кешбэка по акции «Кешбэк 5% по Apple Pay»'
      },
      {
        hold: false,
        date: new Date('2020-01-20T18:09:06+03:00'),
        movements: [
          {
            id: 56360051,
            account: { id: 'account' },
            invoice: null,
            sum: 217.4,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Начисление кешбэка по акции «Кешбэк 5% по Apple Pay»'
      }
    ],
    [
      {
        txnId: 65624020,
        txnDate: '2020-04-29T19:04:05+03:00',
        txnStatus: 2,
        txnType: 3,
        txnErrorId: -1,
        txnAmount: 195.8,
        installmentsAmount: 0,
        ownAmount: 195.8,
        installmentsMonths: 0,
        partnersName: 'Возврат: Оплата через платежный сервис QIWI Кошелек',
        tradePointName: 'QIWI Кошелек',
        txnAcctBal: 14260.26,
        txnDebt: 53739.74
      },
      {
        hold: false,
        date: new Date('2020-04-29T19:04:05+03:00'),
        movements: [
          {
            id: 65624020,
            account: { id: 'account' },
            invoice: null,
            sum: 195.8,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Возврат: Оплата через платежный сервис QIWI Кошелек'
      }
    ]
  ])('converts income (add comments only)', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, [{ id: 'account', instrument: 'RUR' }])).toEqual(transaction)
  })
})
