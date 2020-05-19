import { convertTransaction } from '../../../converters'

describe('convertTransactions', () => {
  it.each([
    [
      {
        txnId: 4933310,
        txnDate: '2018-01-05T00:41:46+03:00',
        txnStatus: 2,
        txnType: 6,
        txnErrorId: -1,
        txnAmount: 46389,
        installmentsAmount: 0,
        ownAmount: 46389,
        installmentsMonths: 0,
        partnersName: 'Вывод собственных средств'
      },
      {
        hold: false,
        date: new Date('2018-01-05T00:41:46+03:00'),
        movements: [
          {
            id: '4933310',
            account: { id: 'account' },
            invoice: null,
            sum: -46389,
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
            'sum': 46389,
            'fee': 0
          }
        ],
        merchant: null,
        comment: null
      }
    ]
  ])('converts outer outcome transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, [{ id: 'account', instrument: 'RUR' }])).toEqual(transaction)
  })
})
