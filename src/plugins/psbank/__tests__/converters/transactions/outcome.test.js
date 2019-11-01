import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        cardSum: -534.96,
        cardCommissionSum: 0,
        cardCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        mcc: '5311',
        mccImageSrc: '/res/i/mcc/6676AC9AEC65F31A201EF2F7450FC7D5.png',
        valueDate: '2019-10-22T00:00:00Z',
        transactionDate: '2019-10-19T07:24:32Z',
        ground: '520373..6823 Покупка TUR ANTALYA URART GUMRUKSUZ MAGAZA 244171',
        transactionSum: -47.28,
        transactionCurrency: { currencyId: 151, name: 'Турецкая лира (н)', nameIso: 'TRY' },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-10-19T07:24:32Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: { sum: -47.28, instrument: 'TRY' },
            sum: -534.96,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'TUR ANTALYA URART GUMRUKSUZ MAGAZA 244171',
          mcc: 5311,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        cardSum: -6200,
        cardCommissionSum: 0,
        cardCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        mcc: '8299',
        valueDate: '2019-10-21T00:00:00Z',
        transactionDate: '2019-10-18T11:56:35Z',
        ground: '520373..6823 Покупка RUS g. Moskva IP Korneeva 294107',
        transactionSum: -6200,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-10-18T11:56:35Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -6200,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'RUS g. Moskva IP Korneeva 294107',
          mcc: 8299,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        cardSum: -390,
        cardCommissionSum: 0,
        cardCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        mcc: '5814',
        mccImageSrc: '/res/i/mcc/DC9437F9036ECFA42E56216B2C24B2EE.png',
        valueDate: '2019-10-04T00:00:00Z',
        transactionDate: '2019-10-01T14:45:37Z',
        ground: '520373..6823 Покупка RUS MOSCOW MCDONALDS 11015 268192',
        transactionSum: -390,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-10-01T14:45:37Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -390,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'RUS MOSCOW MCDONALDS 11015 268192',
          mcc: 5814,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        cardSum: -4142.16,
        cardCommissionSum: 0,
        valueDate: '2019-10-29T00:00:00Z',
        transactionDate: '2019-10-29T09:23:19Z',
        ground: 'OPLATA DEP.OBRAZOVANIY',
        transactionSum: -4142.16,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' }
      },
      {
        hold: true,
        date: new Date('2019-10-29T09:23:19Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -4142.16,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'OPLATA DEP.OBRAZOVANIY',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        valueDate: '2019-07-19T00:00:00Z',
        transactionDate: '2019-07-18T22:01:35.49Z',
        ground: 'Перевод средств на погашение кредитных обязательств по договору кредитная карта от 18.03.2016, Николаев Николай Николаевич',
        transactionSum: -20659,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        request:
          {
            requestId: 981279137,
            state: 10,
            office: { officeId: 6 },
            operation:
              {
                operationId: 31,
                code: 2100,
                name: 'Рублевый перевод в другой банк',
                imageSrc: '/res/i/o/9853200AA9EBA84495F7F90202BED796.png',
                isTemplateSupported: true,
                confirmButtonText: 'Подтвердить',
                localities: []
              },
            startTime: '2019-07-18T22:01:34.927Z',
            requestTime: '2019-07-18T22:01:34.927Z',
            finishTime: '2019-07-18T22:01:35.613Z',
            mode: 255,
            receiverName: 'Николаев Николай Николаевич',
            sum: 20659,
            currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
            commissionSum: 0,
            isRepeatAllowed: true,
            stateName: 'Обработано'
          },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-07-18T22:01:35.49Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -20659,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод средств на погашение кредитных обязательств по договору кредитная карта от 18.03.2016, Николаев Николай Николаевич'
      }
    ],
    [
      {
        valueDate: '2019-07-19T00:00:00Z',
        transactionDate: '2019-07-18T22:01:35.007Z',
        ground: 'Перевод средств на погашение кредитных обязательств по договору MAJAA9 от 02.08.2018, Николаев Николай Николаевич',
        transactionSum: -84661,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        request:
          {
            requestId: 981279131,
            state: 10,
            office: { officeId: 6 },
            operation:
              {
                operationId: 31,
                code: 2100,
                name: 'Рублевый перевод в другой банк',
                imageSrc: '/res/i/o/9853200AA9EBA84495F7F90202BED796.png',
                isTemplateSupported: true,
                confirmButtonText: 'Подтвердить',
                localities: []
              },
            startTime: '2019-07-18T22:01:34.443Z',
            requestTime: '2019-07-18T22:01:34.443Z',
            finishTime: '2019-07-18T22:01:35.193Z',
            mode: 255,
            receiverName: 'Николаев Николай Николаевич',
            sum: 84661,
            currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
            commissionSum: 0,
            isRepeatAllowed: true,
            stateName: 'Обработано'
          },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-07-18T22:01:35.007Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -84661,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод средств на погашение кредитных обязательств по договору MAJAA9 от 02.08.2018, Николаев Николай Николаевич'
      }
    ]
  ])('converts outcome', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toEqual(transaction)
  })
})
