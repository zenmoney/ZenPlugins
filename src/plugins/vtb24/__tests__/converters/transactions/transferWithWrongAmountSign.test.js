import { convertTransaction, mergeTransfers } from '../../../converters'

describe('convertTransaction', () => {
  it('converts transaction with wrong amount sign', () => {
    const apiTransactions = [
      // { __type: 'ru.vtb24.mobilebanking.protocol.ObjectIdentityMto',
      //   id: '2EAFF8E027844361BC544BA2B1F68F30',
      //   type: 'ru.vtb24.mobilebanking.protocol.product.MasterAccountMto' }
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.AccountTransactionMto',
        id: '86nMiigWgoO6VuKhqHfdFHEJ2PQ=;NvIN7THfzR5UprmUwG4e5KAP8wQ=',
        details: 'Перевод на счет *7099',
        isHold: false,
        statusName: 'Исполнено',
        debet: { id: 'F85CC22EFB9F414CBEBDCFEB1A4E00C9' },
        transactionDate: new Date('Wed Apr 24 2019 15:44:06 GMT+0300 (MSK)'),
        processedDate: new Date('Wed Apr 24 2019 15:44:08 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -4050,
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
            id: '964898327',
            orderId: 964898327,
            description: 'Перевод на счет *7099',
            pending: false,
            ignoreLimits: false,
            canBeExecuted: true,
            statusName: null,
            creationDate: new Date('Wed Apr 24 2019 15:44:06 GMT+0300 (MSK)'),
            completionDate: new Date('Wed Apr 24 2019 15:44:09 GMT+0300 (MSK)'),
            amount:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
                sum: 4050,
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
                id: '9775',
                enabled: true,
                name: 'Между своими счетами / обмен валюты',
                shortName: 'Перевод между своими счетами',
                description: 'Переводы между собственными счетами и картами в рублях, валюте, а также обмен валюты. Курс обмена будет отображен сразу после выбора счетов /карт в разной валюте. При совершении операций с мультивалютных карт курсы валют вы можете узнать на сайте банка. Обращаем внимание: при переводе с банковской карты за счет кредитных средств или овердрафта взимается комиссия, которая с 01.10.2015 составляет 5,5% (мин. 300 рублей).',
                placeholder: null,
                sortOrder: 0,
                categoryId: '46'
              },
            status: null
          },
        status:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.StatusMto',
            id: 'SUCCESS'
          }
      },
      // { __type: 'ru.vtb24.mobilebanking.protocol.ObjectIdentityMto',
      //   id: 'C57C56DBC1C54EA4B68E97D63A5E31E7',
      //   type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardAccountMto' }
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto',
        id: 'eXObfINHLmN5cXrTTUufqTRv1O4=;hF/+aFujUQDXGNz1VWTw6jDAIpA=',
        details: 'Зачисление со счета *0301',
        isHold: false,
        statusName: 'Исполнено',
        transactionAmountInAccountCurrency:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -4042.99,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        debet: { id: 'CBFDBDDEFC3A4F91A8301B2B176DE527' },
        transactionDate: new Date('Wed Apr 24 2019 15:44:07 GMT+0300 (MSK)'),
        processedDate: new Date('Wed Apr 24 2019 00:00:00 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 4042.99,
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
            id: '964898327',
            orderId: 964898327,
            description: 'Перевод на счет *7099',
            pending: false,
            ignoreLimits: false,
            canBeExecuted: true,
            statusName: null,
            creationDate: new Date('Wed Apr 24 2019 15:44:06 GMT+0300 (MSK)'),
            completionDate: new Date('Wed Apr 24 2019 15:44:09 GMT+0300 (MSK)'),
            amount:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
                sum: 4050,
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
                id: '9775',
                enabled: true,
                name: 'Между своими счетами / обмен валюты',
                shortName: 'Перевод между своими счетами',
                description: 'Переводы между собственными счетами и картами в рублях, валюте, а также обмен валюты. Курс обмена будет отображен сразу после выбора счетов /карт в разной валюте. При совершении операций с мультивалютных карт курсы валют вы можете узнать на сайте банка. Обращаем внимание: при переводе с банковской карты за счет кредитных средств или овердрафта взимается комиссия, которая с 01.10.2015 составляет 5,5% (мин. 300 рублей).',
                placeholder: null,
                sortOrder: 0,
                categoryId: '46'
              },
            status: null
          },
        status:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.StatusMto',
            id: 'SUCCESS'
          }
      },
      // { __type: 'ru.vtb24.mobilebanking.protocol.ObjectIdentityMto',
      //   id: 'C57C56DBC1C54EA4B68E97D63A5E31E7',
      //   type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardAccountMto' }
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto',
        id: 'eXObfINHLmN5cXrTTUufqTRv1O4=;P2zlAdRiTCUYtj032PCMhM9LxB4=',
        details: 'Зачисление со счета *0301',
        isHold: false,
        statusName: 'Исполнено',
        transactionAmountInAccountCurrency:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 4050,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        debet: { id: 'CBFDBDDEFC3A4F91A8301B2B176DE527' },
        transactionDate: new Date('Wed Apr 24 2019 15:44:07 GMT+0300 (MSK)'),
        processedDate: new Date('Wed Apr 24 2019 00:00:00 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 4050,
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
            id: '964898327',
            orderId: 964898327,
            description: 'Перевод на счет *7099',
            pending: false,
            ignoreLimits: false,
            canBeExecuted: true,
            statusName: null,
            creationDate: new Date('Wed Apr 24 2019 15:44:06 GMT+0300 (MSK)'),
            completionDate: new Date('Wed Apr 24 2019 15:44:09 GMT+0300 (MSK)'),
            amount:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
                sum: 4050,
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
                id: '9775',
                enabled: true,
                name: 'Между своими счетами / обмен валюты',
                shortName: 'Перевод между своими счетами',
                description: 'Переводы между собственными счетами и картами в рублях, валюте, а также обмен валюты. Курс обмена будет отображен сразу после выбора счетов /карт в разной валюте. При совершении операций с мультивалютных карт курсы валют вы можете узнать на сайте банка. Обращаем внимание: при переводе с банковской карты за счет кредитных средств или овердрафта взимается комиссия, которая с 01.10.2015 составляет 5,5% (мин. 300 рублей).',
                placeholder: null,
                sortOrder: 0,
                categoryId: '46'
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

    const accountsById = {
      'F85CC22EFB9F414CBEBDCFEB1A4E00C9': { id: 'account1', instrument: 'RUB' },
      'CBFDBDDEFC3A4F91A8301B2B176DE527': { id: 'account2', instrument: 'RUB' }
    }

    const transactions = mergeTransfers(apiTransactions
      .map(apiTransaction => convertTransaction(apiTransaction, accountsById[apiTransaction.debet.id]))
      .filter(x => x))
    const expectedTransactions = [
      {
        'comment': null,
        'date': new Date('2019-04-24T12:44:06.000Z'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            'account': { 'id': 'account1' },
            'fee': 0,
            'id': 'NvIN7THfzR5UprmUwG4e5KAP8wQ=',
            'invoice': null,
            'sum': -4050
          },
          {
            'account': { 'id': 'account2' },
            'fee': 0,
            'id': 'P2zlAdRiTCUYtj032PCMhM9LxB4=',
            'invoice': null,
            'sum': 4050
          }
        ]
      },
      {
        'comment': null,
        'date': new Date('2019-04-24T12:44:07.000Z'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            'account': { 'id': 'account2' },
            'fee': 0,
            'id': 'hF/+aFujUQDXGNz1VWTw6jDAIpA=',
            'invoice': null,
            'sum': 4042.99
          },
          {
            'account': {
              'instrument': 'RUB',
              'company': null,
              'syncIds': ['0301'],
              'type': 'ccard'
            },
            'fee': 0,
            'id': null,
            'invoice': null,
            'sum': -4042.99
          }
        ]
      }
    ]

    expect(transactions).toEqual(expectedTransactions)
  })
})
