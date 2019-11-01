import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        cardSum: 25450,
        cardCommissionSum: 0,
        cardCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        valueDate: '2019-10-16T00:00:00Z',
        transactionDate: '2019-10-16T00:00:00Z',
        ground: ' Зачисление (на основании реестра от работодателя) ',
        transactionSum: 25450,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-10-16T00:00:00Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 25450,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Зачисление (на основании реестра от работодателя)'
      }
    ],
    [
      {
        valueDate: '2019-07-18T00:00:00Z',
        transactionDate: '2019-07-18T22:01:29.16Z',
        ground: 'Выдача ссуды по кредитному договору № 981266399 от 18.07.2019 Николаев Николай Николаевич',
        transactionSum: 126000,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        request:
          {
            requestId: 981266399,
            state: 10,
            office: { officeId: 6 },
            operation:
              {
                operationId: 964,
                code: 2311,
                name: 'Кредитная анкета',
                imageSrc: '/res/i/o/9E9D34F3D42D71E359067BC4429A38DA.png',
                confirmButtonText: 'Подтвердить',
                localities: []
              },
            startTime: '2019-07-18T21:37:25.613Z',
            requestTime: '2019-07-18T21:37:25.613Z',
            finishTime: '2019-07-18T22:01:35.427Z',
            mode: 255,
            sum: 1000000,
            currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
            stateName: 'Обработано'
          },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-07-18T22:01:29.16Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 126000,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Выдача ссуды по кредитному договору № 981266399 от 18.07.2019 Николаев Николай Николаевич'
      }
    ],
    [
      {
        cardSum: 671,
        cardCommissionSum: 0,
        cardCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        mcc: '5399',
        valueDate: '2019-10-11T00:00:00Z',
        transactionDate: '2019-10-11T12:12:02Z',
        ground: ' Пополнение счета Зачисление рублей за баллы ',
        transactionSum: 671,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-10-11T12:12:02Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 671,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Пополнение счета Зачисление рублей за баллы'
      }
    ],
    [
      {
        valueDate: '2019-07-01T00:00:00Z',
        transactionDate: '2019-07-01T03:33:03.55Z',
        ground: 'Выплата процентов по вкладу №953907976',
        transactionSum: 1288.77,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-07-01T03:33:03.55Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 1288.77,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Выплата процентов по вкладу №953907976'
      }
    ]
  ])('converts income', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toEqual(transaction)
  })
})
