import { convertTransaction } from '../../../converters'
const convertForAccount = apiAccount => apiTransaction => convertTransaction(apiTransaction, apiAccount)

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

    const apiAccount = {
      zenAccount: {
        id: 'account'
      }
    }

    const expectedOldFormat = [
      {
        date: new Date('2019-01-25T08:30:14.000Z'),
        hold: false,
        income: 4209,
        incomeAccount: 'account',
        outcome: 0,
        outcomeAccount: 'account',
        comment: 'Поступление заработной платы/иных выплат Salary согласно реестру № 0000 от 2019-01-25'
      },
      {
        date: new Date('2019-01-19T14:56:03.000Z'),
        hold: false,
        income: 5000,
        incomeAccount: 'account',
        outcome: 0,
        outcomeAccount: 'account',
        comment: 'Пополнение'
      },
      {
        date: new Date('2019-01-11T21:00:00.000Z'),
        hold: false,
        income: 1605.63,
        incomeAccount: 'account',
        outcome: 0,
        outcomeAccount: 'account',
        comment: 'Зачисление'
      }
    ]

    const converter = convertForAccount(apiAccount)
    const converted = apiTransactions.map(converter)

    expect(converted).toEqual(expectedOldFormat)
  })
})
