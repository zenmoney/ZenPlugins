import { convertTransaction } from '../../../converters'

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

    const account = {
      id: 'account',
      instrument: 'RUB'
    }

    const expectedTransactions = [
      {
        comment: null,
        date: new Date('2019-03-03T07:36:33.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            id: 'qIL1uH8RogbpWtIMjCq5tTarUtw=',
            account: { id: 'account' },
            invoice: null,
            sum: -6000,
            fee: 0
          },
          {
            id: null,
            account: { type: 'cash', instrument: 'RUB', syncIds: null, company: null },
            invoice: null,
            sum: 6000,
            fee: 0
          }
        ]
      }
    ]

    expect(apiTransactions.map(apiTransaction => convertTransaction(apiTransaction, account))).toEqual(expectedTransactions)
  })
})
