import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        cardSum: -80000,
        cardCommissionSum: 0,
        cardCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        mcc: '4829',
        valueDate: '2019-09-16T00:00:00Z',
        transactionDate: '2019-09-16T12:06:33Z',
        ground: '520373..7923 Списание RUS MOSCOW PSB-RETAIL 00777781 258361',
        transactionSum: -80000,
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
        date: new Date('2019-09-16T12:06:33Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -80000,
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
        transactionSum: -58.97,
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
            sum: -58.97,
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
        valueDate: '2019-09-22T00:00:00Z',
        transactionDate: '2019-09-22T17:38:44.137Z',
        ground: 'Перевод денежных средств на карту 520373..7923.',
        transactionSum: -2000,
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
        date: new Date('2019-09-22T17:38:44.137Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -2000,
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
        cardSum: -770.69,
        cardCommissionSum: 0,
        cardCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        mcc: '4829',
        valueDate: '2019-10-18T00:00:00Z',
        transactionDate: '2019-10-18T10:34:58Z',
        ground: '520373..6823 Безналичное списание в погашение иного кредита  293250',
        transactionSum: -770.69,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        request:
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
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-10-18T10:34:58Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -770.69,
            fee: 0
          }
        ],
        merchant: null,
        comment: '520373..6823 Безналичное списание в погашение иного кредита  293250',
        groupKeys: [
          '1047910240'
        ]
      },
      {}
    ],
    [
      {
        cardSum: -100,
        cardCommissionSum: 0,
        cardCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        mcc: '6538',
        valueDate: '2019-09-22T00:00:00Z',
        transactionDate: '2019-09-22T18:38:33Z',
        ground: '520373..6823 Перевод RUS IB.PSBANK.RU C2C PSB MOBILE NO FEE 204563 на карту 520373..7923',
        transactionSum: -100,
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
            sum: -100,
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
        cardSum: -200000,
        cardCommissionSum: 0,
        cardCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        mcc: '4829',
        valueDate: '2019-06-10T00:00:00Z',
        transactionDate: '2019-06-10T13:10:21Z',
        ground: '554759..8544 Списание RUS MOSCOW PSB-RETAIL 00777781 574668',
        transactionSum: -200000,
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
        date: new Date('2019-06-10T13:10:21Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -200000,
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
    ],
    [
      {
        valueDate: '2019-08-30T00:00:00Z',
        transactionDate: '2019-08-30T12:49:43.927Z',
        ground: 'Полное досрочное погашение ссуды по кредитному договору 1010561443 от 29.08.2019 Николаев Николай Николаевич',
        transactionSum: -10000,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        request:
          {
            requestId: 1011435612,
            state: 10,
            office: { officeId: 6 },
            operation:
              {
                operationId: 6739,
                code: 3300,
                name: 'Погашение ссуды в ИБ',
                confirmButtonText: 'Подтвердить',
                localities: []
              },
            startTime: '2019-08-30T12:49:36.41Z',
            requestTime: '2019-08-30T12:49:36.41Z',
            finishTime: '2019-08-30T12:49:45.44Z',
            mode: 255,
            sum: 10005.47,
            currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
            stateName: 'Обработано'
          },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-08-30T12:49:43.927Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -10000,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Полное досрочное погашение ссуды по кредитному договору 1010561443 от 29.08.2019 Николаев Николай Николаевич',
        groupKeys: [
          '1011435612'
        ]
      },
      {}
    ],
    [
      {
        valueDate: '2019-09-03T00:00:00Z',
        transactionDate: '2019-09-03T10:31:30.947Z',
        ground: 'Погашение начисленных процентов по кредитному договору 981266399 от 18.07.2019 Николаев Николай Николаевич',
        transactionSum: -1284.17,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        request:
          {
            requestId: 1014704230,
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
            startTime: '2019-09-03T10:30:50.603Z',
            requestTime: '2019-09-03T10:30:50.603Z',
            finishTime: '2019-09-03T10:31:34.09Z',
            mode: 255,
            sum: 2241.4,
            currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
            stateName: 'Обработано'
          },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-09-03T10:31:30.947Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -1284.17,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Погашение начисленных процентов по кредитному договору 981266399 от 18.07.2019 Николаев Николай Николаевич',
        groupKeys: [
          '1014704230'
        ]
      },
      {}
    ],
    [
      {
        valueDate: '2019-09-03T00:00:00Z',
        transactionDate: '2019-09-03T10:31:31.307Z',
        ground: 'Погашение ссуды по кредитному договору 981266399 от 18.07.2019 Николаев Николай Николаевич',
        transactionSum: -957.23,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        request:
          {
            requestId: 1014704230,
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
            startTime: '2019-09-03T10:30:50.603Z',
            requestTime: '2019-09-03T10:30:50.603Z',
            finishTime: '2019-09-03T10:31:34.09Z',
            mode: 255,
            sum: 2241.4,
            currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
            stateName: 'Обработано'
          },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-09-03T10:31:31.307Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -957.23,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Погашение ссуды по кредитному договору 981266399 от 18.07.2019 Николаев Николай Николаевич',
        groupKeys: [
          '1014704230'
        ]
      },
      {}
    ]
  ])('converts inner outcome transfer', (apiTransaction, transaction, accountsById) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' }, accountsById)).toEqual(transaction)
  })
})
