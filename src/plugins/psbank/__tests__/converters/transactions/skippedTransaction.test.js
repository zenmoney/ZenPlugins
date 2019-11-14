import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    {
      requestId: 1061465679,
      state: 10,
      office: { officeId: 38 },
      operation: {
        operationId: 815,
        code: 2308,
        name: 'Перенос даты погашения кредитного договора',
        confirmButtonText: 'Подтвердить',
        localities: []
      },
      startTime: '2019-11-04T08:30:08.383Z',
      requestTime: '2019-11-04T08:30:08.383Z',
      finishTime: '2019-11-04T08:30:10.54Z',
      mode: 255,
      stateName: 'Обработано'
    },
    {
      cardSum: 97,
      cardCommissionSum: 0,
      cardCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
      valueDate: '2019-10-10T00:00:00Z',
      transactionDate: '2019-10-11T01:52:23Z',
      ground: ' Выдача кредита',
      transactionSum: 97,
      transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
      isProcessed: true
    },
    {
      cardSum: -166,
      cardCommissionSum: 0,
      cardCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
      mcc: '4829',
      valueDate: '2019-10-12T00:00:00Z',
      transactionDate: '2019-10-12T20:44:31Z',
      ground: ' Погашение основного долга',
      transactionSum: -166,
      transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
      request: {
        requestId: 1043700478,
        state: 10,
        office: { officeId: 6 },
        operation: {
          operationId: 2639,
          code: 2010,
          name: 'Между своими счетами ПСБ',
          imageSrc: '/res/i/o/20E0EEA21E3A114C85A1D281EEE87E1C.png',
          isTemplateSupported: true,
          confirmButtonText: 'Подтвердить',
          localities: []
        },
        startTime: '2019-10-12T20:44:15.11Z',
        requestTime: '2019-10-12T20:44:15.11Z',
        finishTime: '2019-10-12T20:44:32.32Z',
        mode: 255,
        sum: 166,
        currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        isRepeatAllowed: true,
        stateName: 'Обработано'
      },
      isProcessed: true
    }
  ])('skips specific transaction', (apiTransaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toBeNull()
  })
})
