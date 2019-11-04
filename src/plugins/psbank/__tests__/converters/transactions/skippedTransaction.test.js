import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      { requestId: 1061465679,
        state: 10,
        office: { officeId: 38 },
        operation: { operationId: 815,
          code: 2308,
          name: 'Перенос даты погашения кредитного договора',
          confirmButtonText: 'Подтвердить',
          localities: [ ]
        },
        startTime: '2019-11-04T08:30:08.383Z',
        requestTime: '2019-11-04T08:30:08.383Z',
        finishTime: '2019-11-04T08:30:10.54Z',
        mode: 255,
        stateName: 'Обработано'
      }
    ]
  ])('skips specific transaction', (apiTransaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toBeNull()
  })
})
