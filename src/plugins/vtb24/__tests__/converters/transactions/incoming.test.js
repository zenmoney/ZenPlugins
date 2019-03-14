import { toZenmoneyTransaction } from '../../../../../common/converters'
import { convertTransaction } from '../../../converters'
const convertToReadableTransactionForAccount = apiAccount => apiTransaction => convertTransaction(apiTransaction, apiAccount)
const convertToZenmoneyTransactionForAccount = accountsByIdLookup => readableTransaction => toZenmoneyTransaction(readableTransaction, accountsByIdLookup)

describe('convertTransaction', () => {
  it('converts incoming payment', () => {
    const apiTransactions = [
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.AccountTransactionMto',
        id: 'iQ7Tx24cT+OGJGZvx95rV1NN9Ww=;ZLebkT6AwbJw22sE0EwyzPxb2So=',
        details: 'Поступление заработной платы/иных выплат Salary согласно реестру № 0000 от 2019-01-25',
        isHold: false,
        statusName: null,
        debet: '<ref[21]>',
        transactionDate: new Date('Fri Jan 25 2019 11:30:14 GMT+0300 (MSK)'),
        processedDate: new Date('Fri Jan 25 2019 11:30:14 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 4209,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        feeAmount: null,
        order: null,
        status:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.StatusMto',
            id: 'SUCCESS'
          }
      },
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto',
        id: 'UxyFDmFrU9H5zcg2Blf8Xdo5cv4=;Y/L9vJBRRTH5TkxtzZARhlxifNo=',
        details: 'Пополнение',
        isHold: false,
        statusName: null,
        transactionAmountInAccountCurrency:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 5000,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        debet: '<ref[17]>',
        transactionDate: new Date('Sat Jan 19 2019 17:56:03 GMT+0300 (MSK)'),
        processedDate: new Date('Sat Jan 19 2019 00:00:00 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 5000,
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
      },
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto',
        id: 'UxyFDmFrU9H5zcg2Blf8Xdo5cv4=;7tZ8ksFE93dDSUEXE4HAkKpp1Cs=',
        details: 'Зачисление',
        isHold: false,
        statusName: null,
        transactionAmountInAccountCurrency:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 1605.63,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        debet: '<ref[17]>',
        transactionDate: new Date('Sat Jan 12 2019 00:00:00 GMT+0300 (MSK)'),
        processedDate: new Date('Tue Jan 15 2019 00:00:00 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 1605.63,
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

    const expectedReadableTransactions = [
      {
        comment: 'Поступление заработной платы/иных выплат Salary согласно реестру № 0000 от 2019-01-25',
        date: new Date('2019-01-25T08:30:14.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            id: 'iQ7Tx24cT+OGJGZvx95rV1NN9Ww=;ZLebkT6AwbJw22sE0EwyzPxb2So=',
            account: { id: 'account' },
            invoice: null,
            sum: 4209,
            fee: 0
          }
        ]
      },
      {
        comment: 'Пополнение',
        date: new Date('2019-01-19T14:56:03.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            id: 'UxyFDmFrU9H5zcg2Blf8Xdo5cv4=;Y/L9vJBRRTH5TkxtzZARhlxifNo=',
            account: { id: 'account' },
            invoice: null,
            sum: 5000,
            fee: 0
          }
        ]
      },
      {
        comment: 'Зачисление',
        date: new Date('2019-01-11T21:00:00.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            id: 'UxyFDmFrU9H5zcg2Blf8Xdo5cv4=;7tZ8ksFE93dDSUEXE4HAkKpp1Cs=',
            account: { id: 'account' },
            invoice: null,
            sum: 1605.63,
            fee: 0
          }
        ]
      }
    ]

    const expectedZenmoneyTransactions = [
      {
        id: 'iQ7Tx24cT+OGJGZvx95rV1NN9Ww=;ZLebkT6AwbJw22sE0EwyzPxb2So=',
        date: new Date('2019-01-25T08:30:14.000Z'),
        hold: false,
        income: 4209,
        incomeAccount: 'account',
        outcome: 0,
        outcomeAccount: 'account',
        comment: 'Поступление заработной платы/иных выплат Salary согласно реестру № 0000 от 2019-01-25'
      },
      {
        id: 'UxyFDmFrU9H5zcg2Blf8Xdo5cv4=;Y/L9vJBRRTH5TkxtzZARhlxifNo=',
        date: new Date('2019-01-19T14:56:03.000Z'),
        hold: false,
        income: 5000,
        incomeAccount: 'account',
        outcome: 0,
        outcomeAccount: 'account',
        comment: 'Пополнение'
      },
      {
        id: 'UxyFDmFrU9H5zcg2Blf8Xdo5cv4=;7tZ8ksFE93dDSUEXE4HAkKpp1Cs=',
        date: new Date('2019-01-11T21:00:00.000Z'),
        hold: false,
        income: 1605.63,
        incomeAccount: 'account',
        outcome: 0,
        outcomeAccount: 'account',
        comment: 'Зачисление'
      }
    ]

    const apiAccount = {
      id: 'account',
      zenAccount: {
        id: 'account'
      }
    }

    const readableTransactionConverter = convertToReadableTransactionForAccount(apiAccount)
    const readableTransactions = apiTransactions.map(readableTransactionConverter)
    expect(readableTransactions).toEqual(expectedReadableTransactions)

    const zenmoneyTransactionConverter = convertToZenmoneyTransactionForAccount({ [apiAccount.id]: apiAccount })
    const zenmoneyTransactions = readableTransactions.map(zenmoneyTransactionConverter)
    expect(zenmoneyTransactions).toEqual(expectedZenmoneyTransactions)
  })
})
