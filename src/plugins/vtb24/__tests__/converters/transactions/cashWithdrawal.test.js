import { convertTransaction } from '../../../converters'
const convertForAccount = apiAccount => apiTransaction => convertTransaction(apiTransaction, apiAccount)

describe('convertTransaction', () => {
  it('converts cash withdrawal', () => {
    const apiTransactions = [
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto',
        id: '68f+ZNz/Y/7gHfvAvM9LKr+e/KA=;qIL1uH8RogbpWtIMjCq5tTarUtw=',
        details: 'Снятие в банкомате',
        isHold: false,
        statusName: null,
        transactionAmountInAccountCurrency:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -6000,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        debet: '<ref[17]>',
        transactionDate: new Date('Sun Mar 03 2019 10:36:33 GMT+0300 (MSK)'),
        processedDate: new Date('Sun Mar 03 2019 00:00:00 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -6000,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        feeAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 0,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        order: null,
        status:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.StatusMto',
            id: 'SUCCESS'
          }
      }
    ]

    const apiAccount = {
      zenAccount: {
        id: 'account'
      }
    }

    const expectedOldFormat = [
      {
        date: new Date('2019-03-03T07:36:33.000Z'),
        hold: false,
        income: 6000,
        incomeAccount: 'cash#RUB',
        outcome: 6000,
        outcomeAccount: 'account'
      }
    ]

    const converter = convertForAccount(apiAccount)
    const converted = apiTransactions.map(converter)

    expect(converted).toEqual(expectedOldFormat)
  })
})
