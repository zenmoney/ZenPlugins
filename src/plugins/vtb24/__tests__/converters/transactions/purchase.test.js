import { toZenmoneyTransaction } from '../../../../../common/converters'
import { convertTransaction } from '../../../converters'
const convertToReadableTransactionForAccount = apiAccount => apiTransaction => convertTransaction(apiTransaction, apiAccount)
const convertToZenmoneyTransactionForAccount = accountsByIdLookup => readableTransaction => toZenmoneyTransaction(readableTransaction, accountsByIdLookup)

describe('convertTransaction', () => {
  it('converts purchases', () => {
    const apiTransactions = [
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.AccountTransactionMto',
        debet: {
          amount: { __type: 'ru.vtb24.mobilebanking.protocol.AmountMto', sum: 10000.97, currency: {} },
          archived: false,
          cards: [],
          closeDate: null,
          contract: {
            __type: 'ru.vtb24.mobilebanking.protocol.product.ComplexServiceContractMto',
            commissionInterval: null,
            number: null,
            id: '127c2a7e-4e04-4c5e-96c8-2faab1556ba3',
            name: 'Привилегия'
          },
          details: [],
          displayName: 'Мастер счет в рублях',
          id: 'F71710FBFC614CC29030ACF227509AA1',
          isDefault: true,
          lastOperationDate: null,
          mainCard: null,
          masterAccountCards: [],
          name: 'Мастер счет в рублях',
          number: '40235280003523002672',
          openDate: new Date('Sat Dec 12 2015 00:00:00 GMT+0300'),
          overdraft: null,
          showOnMainPage: true,
          status: {
            __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
            id: 'OPEN'
          },
          __type: 'ru.vtb24.mobilebanking.protocol.product.MasterAccountMto'
        },
        details: 'Карта *3536 MOTEL KIROVSKIE DACHI',
        feeAmount: null,
        id: '53989a75-7138-484b-aaa7-e9ea1d12f30a',
        isHold: false,
        order: null,
        processedDate: new Date('Fri Jun 22 2018 10:53:38 GMT+0300'),
        status: {
          __type: 'ru.vtb24.mobilebanking.protocol.StatusMto',
          id: 'SUCCESS'
        },
        statusName: null,
        transactionAmount: {
          __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
          sum: -5400,
          currency: {
            __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
            currencyCode: 'RUR',
            displaySymbol: '₽',
            name: 'Рубль России'
          }
        },
        transactionDate: new Date('Mon Jun 18 2018 19:16:42 GMT+0300')
      },
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto',
        id: '2Qe/wGcaAzn6y+NFxWEMjcy6mjM=;4YzFJfeuAJ8m+MUjn/oMSUbFUMM=',
        details: 'Списание по карте',
        isHold: false,
        statusName: 'Исполнено',
        transactionAmountInAccountCurrency:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -300,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        debet: '<ref[17]>',
        transactionDate: new Date('Thu Mar 07 2019 08:01:03 GMT+0300 (MSK)'),
        processedDate: new Date('Thu Mar 07 2019 00:00:00 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -300,
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
        order:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.OrderMto',
            id: '893388825',
            orderId: 893388825,
            description: 'ООО КБ "ПЛАТИНА"  Карта Стрелка (ООО "Единая Транспортная Карта")',
            pending: false,
            ignoreLimits: false,
            canBeExecuted: true,
            statusName: null,
            creationDate: new Date('Thu Mar 07 2019 08:01:02 GMT+0300 (MSK)'),
            completionDate: new Date('Thu Mar 07 2019 08:01:09 GMT+0300 (MSK)'),
            amount:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
                sum: 300,
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
                id: '3801',
                enabled: true,
                name: 'ООО КБ "ПЛАТИНА"  Карта Стрелка (ООО "Единая Транспортная Карта")',
                shortName: 'ООО КБ "ПЛАТИНА"  Карта Стрелк',
                description: 'Здесь вы можете без комиссии пополнить карту «Стрелка».',
                placeholder: null,
                sortOrder: 0,
                categoryId: '6'
              },
            status: null
          },
        status:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.StatusMto',
            id: 'SUCCESS'
          }
      },
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto',
        id: 'iQ7Tx24cT+OGJGZvx95rV1NN9Ww=;83RHe8XMecT36x1EiaFcB1l8S/M=',
        details: 'Карта *2772 PAY MTS RU TOPUP 6342',
        isHold: true,
        statusName: 'В обработке',
        transactionAmountInAccountCurrency:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -250,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        debet: '<ref[23]>',
        transactionDate: new Date('Fri Jan 25 2019 19:27:39 GMT+0300 (MSK)'),
        processedDate: new Date('Fri Jan 25 2019 19:27:39 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -250,
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
            id: 'IN_PROGRESS'
          }
      },
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto',
        id: 'UxyFDmFrU9H5zcg2Blf8Xdo5cv4=;lOkFTtbsHoVUzPn9rEAFZF4u7SY=',
        details: 'YANDEX TAXI',
        isHold: false,
        statusName: null,
        transactionAmountInAccountCurrency:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -39,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        debet: '<ref[17]>',
        transactionDate: new Date('Tue Jan 15 2019 00:00:00 GMT+0300 (MSK)'),
        processedDate: new Date('Fri Jan 18 2019 00:00:00 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -39,
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
        id: 'UxyFDmFrU9H5zcg2Blf8Xdo5cv4=;rHqO/DOMvX+E12mf0FQg3WkgC/Q=',
        details: 'Начисленные %',
        isHold: false,
        statusName: null,
        transactionAmountInAccountCurrency:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -466.3,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        debet: '<ref[17]>',
        transactionDate: new Date('Fri Dec 28 2018 00:00:00 GMT+0300 (MSK)'),
        processedDate: new Date('Sun Dec 30 2018 00:00:00 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 466.3,
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
        id: '5x68QJ9sIpVHryQQflawldCFCPc=;ZDvGUy6vxtxx72SQZ4YAUFRLDBw=',
        details: 'Покупка RUS SANKT-PETERBU MAGNIT MM LEVACKIY ',
        isHold: false,
        statusName: null,
        transactionAmountInAccountCurrency:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -144.7,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        debet: '<ref[17]>',
        transactionDate: new Date('Wed Mar 13 2019 00:00:00 GMT+0300 (MSK)'),
        processedDate: new Date('Mon Mar 18 2019 00:00:00 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -144.7,
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
      }
    ]

    const expectedReadableTransactions = [
      {
        comment: null,
        date: new Date('2018-06-18T19:16:42+03:00'),
        hold: false,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'MOTEL KIROVSKIE DACHI'
        },
        movements: [
          {
            id: '53989a75-7138-484b-aaa7-e9ea1d12f30a',
            account: { id: 'account' },
            invoice: null,
            sum: -5400,
            fee: 0
          }
        ]
      },
      {
        comment: 'Списание по карте',
        date: new Date('2019-03-07T05:01:03.000Z'),
        hold: false,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'ООО КБ "ПЛАТИНА"  Карта Стрелка (ООО "Единая Транспортная Карта")'
        },
        movements: [
          {
            id: '4YzFJfeuAJ8m+MUjn/oMSUbFUMM=',
            account: { id: 'account' },
            invoice: null,
            sum: -300,
            fee: 0
          }
        ]
      },
      {
        comment: null,
        date: new Date('2019-01-25T16:27:39.000Z'),
        hold: true,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'PAY MTS RU TOPUP 6342'
        },
        movements: [
          {
            id: '83RHe8XMecT36x1EiaFcB1l8S/M=',
            account: { id: 'account' },
            invoice: null,
            sum: -250,
            fee: 0
          }
        ]
      },
      {
        comment: null,
        date: new Date('2019-01-14T21:00:00.000Z'),
        hold: false,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'YANDEX TAXI'
        },
        movements: [
          {
            id: 'lOkFTtbsHoVUzPn9rEAFZF4u7SY=',
            account: { id: 'account' },
            invoice: null,
            sum: -39,
            fee: 0
          }
        ]
      },
      {
        comment: 'Начисленные %',
        date: new Date('2018-12-27T21:00:00.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            id: 'rHqO/DOMvX+E12mf0FQg3WkgC/Q=',
            account: { id: 'account' },
            invoice: null,
            sum: -466.3,
            fee: 0
          }
        ]
      },
      {
        comment: null,
        date: new Date('2019-03-12T21:00:00.000Z'),
        hold: false,
        merchant: {
          location: null,
          mcc: null,
          fullTitle: 'RUS SANKT-PETERBU MAGNIT MM LEVACKIY'
        },
        movements: [
          {
            id: 'ZDvGUy6vxtxx72SQZ4YAUFRLDBw=',
            account: { id: 'account' },
            invoice: null,
            sum: -144.7,
            fee: 0
          }
        ]
      }
    ]

    const expectedZenmoneyTransactions = [
      {
        id: '53989a75-7138-484b-aaa7-e9ea1d12f30a',
        date: new Date('2018-06-18T19:16:42+03:00'),
        hold: false,
        income: 0,
        incomeAccount: 'account',
        outcome: 5400,
        outcomeAccount: 'account',
        payee: 'MOTEL KIROVSKIE DACHI',
        mcc: null,
        comment: null
      },
      {
        id: '4YzFJfeuAJ8m+MUjn/oMSUbFUMM=',
        date: new Date('2019-03-07T05:01:03.000Z'),
        hold: false,
        income: 0,
        incomeAccount: 'account',
        outcome: 300,
        outcomeAccount: 'account',
        payee: 'ООО КБ "ПЛАТИНА"  Карта Стрелка (ООО "Единая Транспортная Карта")',
        mcc: null,
        comment: 'Списание по карте'
      },
      {
        id: '83RHe8XMecT36x1EiaFcB1l8S/M=',
        date: new Date('2019-01-25T16:27:39.000Z'),
        hold: true,
        income: 0,
        incomeAccount: 'account',
        outcome: 250,
        outcomeAccount: 'account',
        payee: 'PAY MTS RU TOPUP 6342',
        mcc: null,
        comment: null
      },
      {
        id: 'lOkFTtbsHoVUzPn9rEAFZF4u7SY=',
        date: new Date('2019-01-14T21:00:00.000Z'),
        hold: false,
        income: 0,
        incomeAccount: 'account',
        outcome: 39,
        outcomeAccount: 'account',
        payee: 'YANDEX TAXI',
        mcc: null,
        comment: null
      },
      {
        id: 'rHqO/DOMvX+E12mf0FQg3WkgC/Q=',
        date: new Date('2018-12-27T21:00:00.000Z'),
        hold: false,
        income: 0,
        incomeAccount: 'account',
        outcome: 466.3,
        outcomeAccount: 'account',
        comment: 'Начисленные %'
      },
      {
        id: 'ZDvGUy6vxtxx72SQZ4YAUFRLDBw=',
        date: new Date('2019-03-12T21:00:00.000Z'),
        hold: false,
        income: 0,
        incomeAccount: 'account',
        outcome: 144.7,
        outcomeAccount: 'account',
        payee: 'RUS SANKT-PETERBU MAGNIT MM LEVACKIY',
        mcc: null,
        comment: null
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

  it('converts purchases in other currency', () => {
    const apiTransactions = [
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto',
        id: 'UxyFDmFrU9H5zcg2Blf8Xdo5cv4=;pA/9gNf9M67Uz/hf17TaYbq8YUc=',
        details: 'PAYPAL ROSEGAL',
        isHold: false,
        statusName: null,
        transactionAmountInAccountCurrency:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -501.88,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        debet: '<ref[17]>',
        transactionDate: new Date('Thu Dec 27 2018 00:00:00 GMT+0300 (MSK)'),
        processedDate: new Date('Fri Dec 28 2018 00:00:00 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -6.99,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'USD',
                name: 'Доллар США',
                displaySymbol: '$'
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
        comment: null,
        date: new Date('2018-12-26T21:00:00.000Z'),
        hold: false,
        merchant: {
          city: null,
          country: null,
          mcc: null,
          location: null,
          title: 'PAYPAL ROSEGAL'
        },
        movements: [
          {
            id: 'pA/9gNf9M67Uz/hf17TaYbq8YUc=',
            account: { id: 'account' },
            invoice: {
              sum: -6.99,
              instrument: 'USD'
            },
            sum: -501.88,
            fee: 0
          }
        ]
      }
    ]

    const expectedZenmoneyTransactions = [
      {
        id: 'pA/9gNf9M67Uz/hf17TaYbq8YUc=',
        date: new Date('2018-12-26T21:00:00.000Z'),
        hold: false,
        income: 0,
        incomeAccount: 'account',
        opOutcome: 6.99,
        opOutcomeInstrument: 'USD',
        outcome: 501.88,
        outcomeAccount: 'account',
        payee: 'PAYPAL ROSEGAL',
        mcc: null,
        comment: null
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
