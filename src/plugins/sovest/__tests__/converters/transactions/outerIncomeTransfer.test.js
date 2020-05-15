import { convertTransaction } from '../../../converters'

describe('convertTransactions', () => {
  it.each([
    [
      { txnId: 65624020,
        txnDate: '2020-04-29T19:04:05+03:00',
        txnStatus: 2,
        txnType: 3,
        txnErrorId: -1,
        txnAmount: 195.8,
        installmentsAmount: 0,
        ownAmount: 195.8,
        installmentsMonths: 0,
        partnersName: 'Пополнение',
        tradePointName: 'QIWI Кошелек',
        txnAcctBal: 14260.26,
        txnDebt: 53739.74 },
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
          },
          {
            'id': null,
            'account': {
              'type': 'ccard',
              'instrument': 'RUR',
              'company': null,
              'syncIds': null
            },
            'invoice': null,
            'sum': -195.8,
            'fee': 0
          }
        ],
        merchant: null,
        comment: null
      }
    ]
  ])('converts outer income transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, [{ id: 'account', instrument: 'RUR' }])).toEqual(transaction)
  })
})
