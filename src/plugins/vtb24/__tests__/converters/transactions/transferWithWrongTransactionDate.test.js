import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it('converts transfer with wrong date', () => {
    const apiTransactions = [
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.AccountTransactionMto',
        id: 'Q3H+VQYwcGHKSfinvmCRK6mITEA=;fS76Rj7PrQ+sQn/4egQK/EE7LN0=',
        details: 'Ф****в Имь Отчевич',
        isHold: false,
        statusName: 'Исполнено',
        debet: '<ref[15]>',
        transactionDate: new Date('0001-01-02T21:00:00.000Z'),
        processedDate: new Date('2016-05-10T21:00:00.000Z'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -320,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        feeAmount: null,
        order:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.OrderMto',
            id: '894261060',
            orderId: 894261060,
            description: 'Ф****в Имь Отчевич',
            pending: false,
            ignoreLimits: false,
            canBeExecuted: true,
            statusName: null,
            creationDate: new Date('Thu Mar 07 2019 14:56:30 GMT+0300 (MSK)'),
            completionDate: new Date('Thu Mar 07 2019 14:56:34 GMT+0300 (MSK)'),
            amount:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
                sum: 320,
                currency:
                  {
                    __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                    currencyCode: 'RUR',
                    name: 'Рубль России',
                    displaySymbol: '₽'
                  }
              },
            operationInfo:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.operation.OperationInfoMto',
                id: '7993',
                enabled: true,
                name: 'Перевод между счетами различных клиентов внутри банка',
                shortName: 'Перевод другому клиенту ВТБ',
                description: null,
                placeholder: null,
                sortOrder: 0,
                categoryId: '47'
              },
            status: null
          },
        status:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.StatusMto',
            id: 'SUCCESS'
          }
      }
    ]

    const expectedTransactions = [
      {
        comment: null,
        date: new Date('2016-05-10T21:00:00.000Z'),
        hold: false,
        merchant: {
          city: null,
          country: null,
          mcc: null,
          location: null,
          title: 'Ф****в Имь Отчевич'
        },
        movements: [
          {
            id: 'fS76Rj7PrQ+sQn/4egQK/EE7LN0=',
            account: { id: 'account' },
            invoice: null,
            sum: -320,
            fee: 0
          }
        ]
      }
    ]
    const account = {
      id: 'account',
      instrument: 'RUB'
    }

    expect(apiTransactions.map(apiTransaction => convertTransaction(apiTransaction, account))).toEqual(expectedTransactions)
  })
})
