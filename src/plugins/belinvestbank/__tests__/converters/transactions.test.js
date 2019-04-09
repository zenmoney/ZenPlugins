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
        amount: '1 600,00',
        amountReal: '1 600,00',
        authCode: '264505',
        cardNum: '1111',
        currency: 'USD',
        currencyReal: 'USD',
        date: '18.01.2019 21:36',
        description: 'Внесение наличных на карту',
        mcc: '↵',
        place: 'BY BGPB PST-93, MINSK',
        type: 'ЗАЧИСЛЕНИЕ'
      },
      expectedTransaction: {
        'comment': null,
        'date': new Date('2019-01-18T18:36:00.000Z'),
        'hold': false,
        'merchant': {
          'city': 'MINSK',
          'country': 'BY',
          'location': null,
          'mcc': null,
          'title': 'BGPB PST-93'
        },
        'movements':
        [
          {
            'account': {
              'id': '11161311-117d11'
            },
            'fee': 0,
            'id': null,
            'invoice': null,
            'sum': 1600
          },
          {
            'account': {
              'company': null,
              'instrument': 'USD',
              'syncIds': null,
              'type': 'cash'
            },
            'fee': 0,
            'id': null,
            'invoice': null,
            'sum': -1600
          }
        ]
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
