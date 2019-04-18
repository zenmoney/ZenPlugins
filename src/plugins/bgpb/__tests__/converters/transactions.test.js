import { convertTransaction, convertLastTransaction } from '../../converters'

describe('convertTransaction', () => {
  const accounts = [{
    id: '11161311-117d11',
    transactionsAccId: null,
    type: 'card',
    title: 'Расчетная карточка*1111',
    currencyCode: '840',
    cardNumber: '529911******1111',
    instrument: 'USD',
    balance: 0,
    syncID: ['1111'],
    productType: 'MS'
  }]

  const tt = [
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
    },
    {
      name: 'internet pay',
      transaction: {
        amount: '300,00',
        amountReal: '250,00',
        authCode: '357178',
        cardNum: '1111',
        currency: 'USD',
        currencyReal: 'EUR',
        date: '02.01.2019 22:02',
        description: 'Безналичная оплата',
        mcc: '1200',
        place: 'GB SHOP, DOUGLAS',
        type: 'СПИСАНИЕ'
      },
      expectedTransaction: {
        'comment': null,
        'date': new Date('2019-01-02T19:02:00.000Z'),
        'hold': false,
        'merchant': {
          'city': 'DOUGLAS',
          'country': 'GB',
          'location': null,
          'mcc': 1200,
          'title': 'SHOP'
        },
        'movements':
        [
          {
            'account': {
              'id': '11161311-117d11'
            },
            'fee': 0,
            'id': null,
            'invoice': {
              'instrument': 'EUR',
              'sum': -250
            },
            'sum': -300
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

describe('convertLastTransaction', () => {
  const accounts = [{
    id: '11161311-117d11',
    transactionsAccId: null,
    type: 'card',
    title: 'Расчетная карточка*1111',
    currencyCode: '840',
    cardNumber: '529911******1111',
    instrument: 'USD',
    balance: 0,
    syncID: ['1111'],
    productType: 'MS'
  }]

  const tt = [
    {
      name: 'notification',
      transaction: {
        acceptedTime: 1554541890000,
        eventType: 4,
        id: '2019-7871636',
        pushMessageText: 'Card7592; Смена статуса карты; 04.04.19 17:31:40;'
      },
      expectedTransaction: null
    },
    {
      name: 'notification 2',
      transaction: {
        acceptedTime: 1554541890000,
        eventType: 4,
        id: '2019-7871636',
        pushMessageText: 'Приложение BGPB_Mobile активировано на устройстве Unknown Android SDK built for x86_64__.'
      },
      expectedTransaction: null
    },
    {
      name: 'cash add',
      transaction: {
        acceptedTime: 1554492493000,
        eventType: 4,
        id: '2019-7848714',
        pushMessageText: 'Card1111; Пополнение: 1 100,00 USD; 05.04.19 22:27:59; BGPB CASH-IN 76,MINSK,BY; Dostupno: 34,71 USD'
      },
      expectedTransaction: {
        'comment': null,
        'date': new Date('2019-04-05T19:27:00.000Z'),
        'hold': false,
        'merchant': {
          'city': 'MINSK',
          'country': 'BY',
          'location': null,
          'mcc': null,
          'title': 'BGPB CASH-IN 76'
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
              'sum': 1100
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
              'sum': -1100
            }
          ]
      }
    }
  ]

  // run all tests
  tt.forEach(function (tc) {
    it(tc.name, () => {
      const transaction = convertLastTransaction(tc.transaction, accounts)

      expect(transaction).toEqual(tc.expectedTransaction)
    })
  })
})
