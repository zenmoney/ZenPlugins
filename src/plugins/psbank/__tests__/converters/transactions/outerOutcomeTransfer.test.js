import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        cardSum: -40000,
        cardCommissionSum: 0,
        cardCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        mcc: '4829',
        valueDate: '2019-09-17T00:00:00Z',
        transactionDate: '2019-09-17T16:47:11Z',
        ground: '520373..6823 Списание RUS MOSCOW AFT-SBP FEE 237451',
        transactionSum: -40000,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        request:
          {
            requestId: 1024683351,
            state: 10,
            office: { officeId: 6 },
            operation:
              {
                operationId: 7061,
                code: 2065,
                name: 'По номеру телефона',
                imageSrc: '/res/i/o/6A2C9BA99003EA26DE0E48C2964C6A30.png',
                isTemplateSupported: true,
                confirmButtonText: 'Подтвердить',
                localities: []
              },
            startTime: '2019-09-17T16:46:51.13Z',
            requestTime: '2019-09-17T16:46:51.13Z',
            finishTime: '2019-09-17T16:50:20.65Z',
            mode: 255,
            receiverName: 'Камиль Рустэмович С',
            sum: 40000,
            currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
            commissionSum: 0,
            isRepeatAllowed: true,
            stateName: 'Обработано'
          },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-09-17T16:47:11Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -40000,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUB',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 40000,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'Камиль Рустэмович С',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        cardSum: -4567.5,
        cardCommissionSum: -67.5,
        cardCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        mcc: '6538',
        valueDate: '2019-08-30T00:00:00Z',
        transactionDate: '2019-08-30T16:32:56Z',
        ground: '520373..6823 Перевод RUS IB.PSBANK.RU C2C PSB MOBILE FEE 216207 на карту 546938..4088',
        transactionSum: -4500,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-08-30T16:32:56Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -4500,
            fee: -67.5
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUB',
              company: null,
              syncIds: ['4088']
            },
            invoice: null,
            sum: 4500,
            fee: 0
          }
        ],
        merchant: null,
        comment: '520373..6823 Перевод RUS IB.PSBANK.RU C2C PSB MOBILE FEE 216207 на карту 546938..4088'
      }
    ],
    [
      {
        cardSum: -25375,
        cardCommissionSum: -375,
        cardCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        mcc: '6538',
        valueDate: '2019-10-08T00:00:00Z',
        transactionDate: '2019-10-05T14:38:19Z',
        ground: '520373..7923 Перевод RUS MOSCOW C2C R-ONLINE MC 272120 на карту 8195861',
        transactionSum: -25000,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-10-05T14:38:19Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -25000,
            fee: -375
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUB',
              company: { id: '5156' },
              syncIds: ['5861']
            },
            invoice: null,
            sum: 25000,
            fee: 0
          }
        ],
        merchant: null,
        comment: '520373..7923 Перевод RUS MOSCOW C2C R-ONLINE MC 272120 на карту 8195861'
      }
    ],
    [
      {
        cardSum: -10000,
        cardCommissionSum: 0,
        cardCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        mcc: '5399',
        valueDate: '2019-07-19T00:00:00Z',
        transactionDate: '2019-07-18T22:05:36Z',
        ground: '520373..7923 Безналичное списание RUS MOSCOW PSB-RETAIL 00888890 551919',
        transactionSum: -10000,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        request:
          {
            requestId: 981281032,
            state: 10,
            office: { officeId: 6 },
            operation:
              {
                operationId: 2751,
                code: 2102,
                name: 'Рублевый перевод',
                imageSrc: '/res/i/o/38957344A67629554654C4E98AC426C7.png',
                isTemplateSupported: true,
                confirmButtonText: 'Подтвердить',
                localities: []
              },
            startTime: '2019-07-18T22:05:15.103Z',
            requestTime: '2019-07-18T22:05:15.103Z',
            finishTime: '2019-07-19T02:01:20.47Z',
            mode: 255,
            template:
              {
                templateId: 4423778,
                code: 1,
                name: 'Перевод себе на Райф main'
              },
            receiverName: 'Николаев Николай Николаевич',
            sum: 10000,
            currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
            commissionSum: 0,
            isRepeatAllowed: true,
            stateName: 'Обработано'
          },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-07-18T22:05:36Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -10000,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUB',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 10000,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'Николаев Николай Николаевич',
          mcc: null,
          location: null
        },
        comment: 'Перевод себе на Райф main'
      }
    ],
    [
      {
        cardSum: -599,
        cardCommissionSum: 0,
        cardCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        mcc: '5399',
        valueDate: '2019-07-03T00:00:00Z',
        transactionDate: '2019-07-03T10:19:18Z',
        ground: '554759..8544 Безналичное списание RUS MOSCOW PSB-RETAIL 00888891 574675',
        transactionSum: -599,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        request:
          {
            requestId: 970668927,
            state: 10,
            office: { officeId: 378 },
            operation:
              {
                operationId: 2713,
                code: 6019,
                name: 'Оплата счетов Яндекс.Деньги',
                confirmButtonText: 'Подтвердить',
                localities: []
              },
            startTime: '2019-07-03T10:15:01.847Z',
            requestTime: '2019-07-03T10:15:01.847Z',
            finishTime: '2019-07-03T10:19:20.757Z',
            mode: 255,
            sum: 599,
            currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
            commissionSum: 0,
            stateName: 'Обработано'
          },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-07-03T10:19:18Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -599,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUB',
              company: { id: '15420' },
              syncIds: null
            },
            invoice: null,
            sum: 599,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Оплата счетов Яндекс.Деньги'
      }
    ],
    [
      {
        cardSum: -25000,
        cardCommissionSum: 0,
        cardCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        mcc: '5399',
        valueDate: '2019-06-10T00:00:00Z',
        transactionDate: '2019-06-10T13:13:19Z',
        ground: '554759..8544 Безналичное списание RUS MOSCOW PSB-RETAIL 00888890 574669',
        transactionSum: -25000,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        request:
          {
            requestId: 953909191,
            state: 10,
            office: { officeId: 378 },
            operation:
              {
                operationId: 6731,
                code: 2103,
                name: 'По номеру счета в другой банк',
                imageSrc: '/res/i/o/539EABC6D52BCC76E94C08B31251459D.png',
                isTemplateSupported: true,
                confirmButtonText: 'Подтвердить',
                localities: []
              },
            startTime: '2019-06-10T13:11:20.11Z',
            requestTime: '2019-06-10T13:11:20.11Z',
            finishTime: '2019-06-10T13:13:20.55Z',
            mode: 255,
            receiverName: 'АНДРЕЙЧУК РОМАН НИКОЛАЕВИЧ',
            sum: 25000,
            currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
            commissionSum: 0,
            isRepeatAllowed: true,
            stateName: 'Обработано'
          },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-06-10T13:13:19Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -25000,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUB',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 25000,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'АНДРЕЙЧУК РОМАН НИКОЛАЕВИЧ',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
  ])('converts outer outcome transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toEqual(transaction)
  })
})
