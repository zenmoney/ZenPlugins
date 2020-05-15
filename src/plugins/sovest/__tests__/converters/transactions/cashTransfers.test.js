import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      { txnId: 56647044,
        txnDate: '2020-01-23T23:53:05+03:00',
        txnStatus: 2,
        txnType: 8,
        txnErrorId: -1,
        txnAmount: 4900,
        installmentsAmount: 4900,
        ownAmount: 0,
        installmentsMonths: 3,
        partnersName: 'Снятие наличных',
        txnAcctBal: 28755.38,
        txnDebt: 39244.62 },
      {
        'comment': null,
        'date': new Date('2020-01-23T23:53:05+03:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            'id': 56647044,
            'account': { 'id': 'account' },
            'invoice': null,
            'sum': -4900,
            'fee': 0
          },
          {
            'id': null,
            'account': {
              'type': 'cash',
              'instrument': 'RUR',
              'company': null,
              'syncIds': null
            },
            'invoice': null,
            'sum': 4900,
            'fee': 0
          }
        ]
      }
    ]
  ])('converts cash withdrawal', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, [{ id: 'account', instrument: 'RUR' }])).toEqual(transaction)
  })
})
