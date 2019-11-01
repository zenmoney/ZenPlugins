import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        cardSum: 440,
        cardCommissionSum: 0,
        cardCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        mcc: '4829',
        valueDate: '2019-10-23T00:00:00Z',
        transactionDate: '2019-10-23T10:52:11Z',
        ground: '520373..6823 Пополнение RUS MOSCOW PSB-RETAIL 00777781 230542',
        transactionSum: 440,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        request:
          {
            requestId: 1051644867,
            state: 10,
            office: { officeId: 205 },
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
            startTime: '2019-10-23T10:51:22.587Z',
            requestTime: '2019-10-23T10:51:22.587Z',
            finishTime: '2019-10-23T10:52:13.017Z',
            mode: 255,
            senderName: 'Антохина Яна Андреевна',
            receiverName: 'Камиль Рустэмович С.',
            sum: 440,
            currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
            commissionSum: 0,
            stateName: 'Обработано',
            isCreatedByOtherClient: true
          },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-10-23T10:52:11Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 440,
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
            sum: -440,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'Антохина Яна Андреевна',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        cardSum: 440,
        cardCommissionSum: 0,
        cardCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        mcc: '4829',
        valueDate: '2019-10-22T00:00:00Z',
        transactionDate: '2019-10-22T13:29:32Z',
        ground: '520373..6823 Пополнение RUS MOSCOW PSB-RETAIL 00777781 284219',
        transactionSum: 440,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        request:
          {
            requestId: 1050918954,
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
            startTime: '2019-10-22T13:27:59.537Z',
            requestTime: '2019-10-22T13:27:59.537Z',
            finishTime: '2019-10-22T13:29:33.123Z',
            mode: 255,
            senderName: 'Семенова Галина Александровна',
            receiverName: 'Камиль Рустэмович С.',
            sum: 440,
            currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
            commissionSum: 0,
            stateName: 'Обработано',
            isCreatedByOtherClient: true
          },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-10-22T13:29:32Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 440,
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
            sum: -440,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'Семенова Галина Александровна',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        cardSum: 500,
        cardCommissionSum: 0,
        cardCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        mcc: '4829',
        valueDate: '2019-10-21T00:00:00Z',
        transactionDate: '2019-10-21T10:46:30Z',
        ground: '520373..6823 Пополнение RUS MOSCOW AFT-SBP NO FEE 205945',
        transactionSum: 500,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        request:
          {
            requestId: 1050074351,
            state: 10,
            office: { officeId: 1 },
            operation:
              {
                operationId: 7067,
                code: 2066,
                name: 'Получение перевода СБП',
                confirmButtonText: 'Подтвердить',
                localities: []
              },
            startTime: '2019-10-21T10:46:29.207Z',
            requestTime: '2019-10-21T10:46:29.207Z',
            finishTime: '2019-10-21T10:46:30.783Z',
            mode: 255,
            sum: 500,
            currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
            stateName: 'Обработано'
          },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-10-21T10:46:30Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 500,
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
            sum: -500,
            fee: 0
          }
        ],
        merchant: null,
        comment: '520373..6823 Пополнение RUS MOSCOW AFT-SBP NO FEE 205945'
      }
    ]
  ])('converts outer income transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toEqual(transaction)
  })
})
