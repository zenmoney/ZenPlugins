import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.AccountTransactionMto',
        details: 'ПЕРЕЧИСЛЕНИЕ ЗАРАБОТНОЙ ПЛАТЫ (АВАНСА) ЗА ИЮЛЬ 2019 Г. ПОЛУЧАТЕЛЬ НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ. НДС НЕ ОБЛАГАЕТСЯ',
        isHold: false,
        fullDetails: 'ПЕРЕЧИСЛЕНИЕ ЗАРАБОТНОЙ ПЛАТЫ (АВАНСА) ЗА ИЮЛЬ 2019 Г. ПОЛУЧАТЕЛЬ НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ. НДС НЕ ОБЛАГАЕТСЯ',
        statusName: null,
        id: '9cIachhGGuDcZli0UfBsU1nSivg=;65w6GQR3TH0eY/SoVV4KU+J2c0g=',
        stub: null,
        ver: null,
        debet: null,
        transactionDate: new Date('Thu Jul 25 2019 14:51:00 GMT+0300 (MSK)'),
        processedDate: new Date('Thu Jul 25 2019 14:51:00 GMT+0300 (MSK)'),
        transactionAmount:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
              sum: 8000,
              currency: {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽',
                codeIso: '810',
                detailLevel: 'Full',
                id: 'RUR',
                stub: null,
                ver: null
              }
            },
        feeAmount: null,
        order: null,
        bonus: null,
        transactionAmountInAccountCurrency:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
              sum: 8000,
              currency: {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽',
                codeIso: '810',
                detailLevel: 'Full',
                id: 'RUR',
                stub: null,
                ver: null
              }
            },
        status: {
          __type: 'ru.vtb24.mobilebanking.protocol.StatusMto',
          id: 'SUCCESS'
        }
      },
      {
        hold: false,
        date: new Date('2019-07-25T14:51:00+03:00'),
        movements: [
          {
            id: '65w6GQR3TH0eY/SoVV4KU+J2c0g=',
            account: { id: 'account' },
            invoice: null,
            sum: 8000,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'ПЕРЕЧИСЛЕНИЕ ЗАРАБОТНОЙ ПЛАТЫ (АВАНСА) ЗА ИЮЛЬ 2019 Г. ПОЛУЧАТЕЛЬ НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ. НДС НЕ ОБЛАГАЕТСЯ'
      }
    ]
  ])('converts income', (apiTransaction, transaction) => {
    const account = { id: 'account', instrument: 'RUB' }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })

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
      },
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto',
        id: 'hAJD7WfNZz7YZLW1Zcxn9/ak6Oc=;3UJ6lOXY5qBpYrcvoT3eauLgC8w=',
        details: 'Зачисление на карту',
        isHold: false,
        statusName: null,
        transactionAmountInAccountCurrency:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 59.76,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        debet: '<ref[17]>',
        transactionDate: new Date('Mon Mar 25 2019 16:41:54 GMT+0300 (MSK)'),
        processedDate: new Date('Mon Mar 25 2019 00:00:00 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 59.76,
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

    const expectedTransactions = [
      {
        comment: 'Поступление заработной платы/иных выплат Salary согласно реестру № 0000 от 2019-01-25',
        date: new Date('2019-01-25T08:30:14.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            id: 'ZLebkT6AwbJw22sE0EwyzPxb2So=',
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
            id: 'Y/L9vJBRRTH5TkxtzZARhlxifNo=',
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
            id: '7tZ8ksFE93dDSUEXE4HAkKpp1Cs=',
            account: { id: 'account' },
            invoice: null,
            sum: 1605.63,
            fee: 0
          }
        ]
      },
      {
        comment: 'Зачисление на карту',
        date: new Date('2019-03-25T13:41:54.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            id: '3UJ6lOXY5qBpYrcvoT3eauLgC8w=',
            account: { id: 'account' },
            invoice: null,
            sum: 59.76,
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
