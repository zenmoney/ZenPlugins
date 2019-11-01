import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        valueDate: '2019-09-16T00:00:00Z',
        transactionDate: '2019-09-16T12:06:34.68Z',
        ground: 'Перевод денежных средств с карты 520373..7923.',
        transactionSum: 80000,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        request:
          {
            requestId: 1023887609,
            state: 10,
            office: { officeId: 6 },
            operation:
              {
                operationId: 2639,
                code: 2010,
                name: 'Между своими счетами ПСБ',
                imageSrc: '/res/i/o/20E0EEA21E3A114C85A1D281EEE87E1C.png',
                isTemplateSupported: true,
                confirmButtonText: 'Подтвердить',
                localities: []
              },
            startTime: '2019-09-16T12:06:17.553Z',
            requestTime: '2019-09-16T12:06:17.553Z',
            finishTime: '2019-09-16T12:06:34.977Z',
            mode: 255,
            sum: 80000,
            currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
            isRepeatAllowed: true,
            stateName: 'Обработано'
          },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-09-16T12:06:34.68Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 80000,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '1023887609'
        ]
      },
      {}
    ],
    [
      {
        valueDate: '2019-09-11T00:00:00Z',
        transactionDate: '2019-09-11T13:35:47.63Z',
        ground: 'Перевод денежных средств на счет.',
        transactionSum: 58.97,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        request:
          {
            requestId: 1020365364,
            state: 10,
            office: { officeId: 6 },
            operation:
              {
                operationId: 2639,
                code: 2010,
                name: 'Между своими счетами ПСБ',
                imageSrc: '/res/i/o/20E0EEA21E3A114C85A1D281EEE87E1C.png',
                isTemplateSupported: true,
                confirmButtonText: 'Подтвердить',
                localities: []
              },
            startTime: '2019-09-11T13:35:37.613Z',
            requestTime: '2019-09-11T13:35:37.613Z',
            finishTime: '2019-09-11T13:35:47.783Z',
            mode: 255,
            sum: 58.97,
            currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
            isRepeatAllowed: true,
            stateName: 'Обработано'
          },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-09-11T13:35:47.63Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 58.97,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '1020365364'
        ]
      },
      {}
    ],
    [
      {
        cardSum: 2000,
        cardCommissionSum: 0,
        cardCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        mcc: '4829',
        valueDate: '2019-09-22T00:00:00Z',
        transactionDate: '2019-09-22T17:38:44Z',
        ground: '520373..7923 Пополнение RUS MOSCOW PSB-RETAIL 00777781 251756',
        transactionSum: 2000,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        request:
          {
            requestId: 1028432383,
            state: 10,
            office: { officeId: 6 },
            operation:
              {
                operationId: 2639,
                code: 2010,
                name: 'Между своими счетами ПСБ',
                imageSrc: '/res/i/o/20E0EEA21E3A114C85A1D281EEE87E1C.png',
                isTemplateSupported: true,
                confirmButtonText: 'Подтвердить',
                localities: []
              },
            startTime: '2019-09-22T17:38:30.607Z',
            requestTime: '2019-09-22T17:38:30.607Z',
            finishTime: '2019-09-22T17:38:44.62Z',
            mode: 255,
            sum: 2000,
            currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
            isRepeatAllowed: true,
            stateName: 'Обработано'
          },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-09-22T17:38:44Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 2000,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '1028432383'
        ]
      },
      {}
    ],
    [
      {
        requestId: 1047910240,
        state: 10,
        office: { officeId: 6 },
        operation:
          {
            operationId: 798,
            code: 2307,
            name: 'Погашение ссуды',
            confirmButtonText: 'Подтвердить',
            localities: []
          },
        startTime: '2019-10-18T10:34:55.033Z',
        requestTime: '2019-10-18T10:34:55.033Z',
        finishTime: '2019-10-18T10:35:01.02Z',
        mode: 255,
        sum: 770.69,
        currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        stateName: 'Обработано'
      },
      {
        hold: false,
        date: new Date('2019-10-18T10:34:55.033Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 770.69,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '1047910240'
        ]
      },
      {}
    ],
    [
      {
        cardSum: 100,
        cardCommissionSum: 0,
        cardCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        mcc: '6536',
        mccImageSrc: '/res/i/mcc/59F4D1887D1EECE6BC6206D0A7BE3518.png',
        valueDate: '2019-09-22T00:00:00Z',
        transactionDate: '2019-09-22T18:38:33Z',
        ground: '520373..7923 Пополнение RUS IB.PSBANK.RU C2C PSB MOBILE NO FEE 258986 с карты 520373..6823',
        transactionSum: 100,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-09-22T18:38:33Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 100,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '2019-09-22_RUB_100_520373******6823_520373******7923'
        ]
      },
      {
        '520373******6823': true,
        '520373******7923': true
      }
    ],
    [
      {
        valueDate: '2019-06-10T00:00:00Z',
        transactionDate: '2019-06-10T13:10:22.11Z',
        ground: 'Перевод денежных средств с карты 554759..8544.',
        transactionSum: 200000,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        request:
          {
            requestId: 953907976,
            state: 10,
            office: { officeId: 378 },
            operation:
              {
                operationId: 38,
                code: 1,
                name: 'Открытие накопительного или текущего счета',
                confirmButtonText: 'Подтвердить',
                localities: []
              },
            startTime: '2019-06-10T13:09:04.593Z',
            requestTime: '2019-06-10T13:09:04.593Z',
            finishTime: '2019-06-10T13:10:22.83Z',
            mode: 255,
            sum: 200000,
            currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
            stateName: 'Обработано'
          },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-06-10T13:10:22.11Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 200000,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '953907976'
        ]
      },
      {}
    ]
  ])('converts inner income transfer', (apiTransaction, transaction, accountsById) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' }, accountsById)).toEqual(transaction)
  })
})
