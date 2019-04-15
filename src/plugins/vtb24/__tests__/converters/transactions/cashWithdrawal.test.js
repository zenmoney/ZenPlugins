import { toZenmoneyTransaction } from '../../../../../common/converters'
import { convertTransaction } from '../../../converters'
const convertToReadableTransactionForAccount = apiAccount => apiTransaction => convertTransaction(apiTransaction, apiAccount)
const convertToZenmoneyTransactionForAccount = accountsByIdLookup => readableTransaction => toZenmoneyTransaction(readableTransaction, accountsByIdLookup)

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
      id: 'account',
      zenAccount: {
        id: 'account'
      }
    }

    const expectedReadableTransactions = [
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

    const expectedZenmoneyTransactions = [
      {
        date: new Date('2019-03-03T07:36:33.000Z'),
        hold: false,
        income: 6000,
        incomeAccount: 'cash#RUB',
        incomeBankID: null,
        outcome: 6000,
        outcomeAccount: 'account',
        comment: null,
        outcomeBankID: 'qIL1uH8RogbpWtIMjCq5tTarUtw='
      }
    ]

    const readableTransactionConverter = convertToReadableTransactionForAccount(apiAccount)
    const readableTransactions = apiTransactions.map(readableTransactionConverter)
    expect(readableTransactions).toEqual(expectedReadableTransactions)

    const zenmoneyTransactionConverter = convertToZenmoneyTransactionForAccount({ [apiAccount.id]: apiAccount })
    const zenmoneyTransactions = readableTransactions.map(zenmoneyTransactionConverter)
    expect(zenmoneyTransactions).toEqual(expectedZenmoneyTransactions)
  })
})
