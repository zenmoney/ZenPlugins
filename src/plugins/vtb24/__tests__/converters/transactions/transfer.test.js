import { convertTransaction } from '../../../converters'
const convertForAccount = apiAccount => apiTransaction => convertTransaction(apiTransaction, apiAccount)

describe('convertTransaction', () => {
  it('converts inner transfer', () => {
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
        details: 'Карта *3536 Перевод на другую карту (Р2Р)',
        feeAmount: null,
        id: '880947d1-bdd0-4c88-afd0-eb29283a1db5',
        isHold: true,
        order: null,
        processedDate: new Date('Wed Jun 27 2018 11:45:04 GMT+0300'),
        status: {
          __type: 'ru.vtb24.mobilebanking.protocol.StatusMto',
          id: 'IN_PROGRESS'
        },
        statusName: 'В обработке',
        transactionAmount: {
          __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
          sum: -59585,
          currency: {
            __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
            currencyCode: 'RUR',
            displaySymbol: '₽',
            name: 'Рубль России'
          }
        },
        transactionDate: new Date('Wed Jun 27 2018 11:45:04 GMT+0300')
      },
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto',
        id: '2Qe/wGcaAzn6y+NFxWEMjcy6mjM=;gSdGO1PlZip77oyKjk1avg4jjjY=',
        details: 'Зачисление со счета *3184',
        isHold: false,
        statusName: 'Исполнено',
        transactionAmountInAccountCurrency:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 1500,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        debet: '<ref[17]>',
        transactionDate: new Date('Mon Mar 04 2019 18:27:14 GMT+0300 (MSK)'),
        processedDate: new Date('Mon Mar 04 2019 00:00:00 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 1500,
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
            id: '889845048',
            orderId: 889845048,
            description: 'Перевод на счет *6662',
            pending: false,
            ignoreLimits: false,
            canBeExecuted: true,
            statusName: null,
            creationDate: new Date('Mon Mar 04 2019 18:27:11 GMT+0300 (MSK)'),
            completionDate: new Date('Mon Mar 04 2019 18:27:16 GMT+0300 (MSK)'),
            amount:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
                sum: 1500,
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
                description:
                'Переводы между собственными счетами и картами в рублях, валюте, а также обмен валюты. ' +
                'Курс обмена будет отображен сразу после выбора счетов /карт в разной валюте. ' +
                'При совершении операций с мультивалютных карт курсы валют вы можете узнать на сайте банка. ' +
                'Обращаем внимание: при переводе с банковской карты за счет кредитных средств или овердрафта взимается комиссия, ' +
                'которая с 01.10.2015 составляет 5,5% (мин. 300 рублей).',
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
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.AccountTransactionMto',
        id: 'Q3H+VQYwcGHKSfinvmCRK6mITEA=;fS76Rj7PrQ+sQn/4egQK/EE7LN0=',
        details: 'Ф****в Имь Отчевич',
        isHold: false,
        statusName: 'Исполнено',
        debet: '<ref[15]>',
        transactionDate: new Date('Thu Mar 07 2019 14:56:32 GMT+0300 (MSK)'),
        processedDate: new Date('Thu Mar 07 2019 14:56:33 GMT+0300 (MSK)'),
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

    const expected = [
      {
        date: new Date('2018-06-27T11:45:04+03:00'),
        hold: true,
        income: 0,
        incomeAccount: 'account',
        outcome: 59585,
        outcomeAccount: 'account',
        _transferType: 'income',
        _transferId: 1530089104000
      },
      {
        date: new Date('2019-03-04T15:27:14.000Z'),
        hold: false,
        income: 1500,
        incomeAccount: 'account',
        outcome: 1500,
        outcomeAccount: 'ccard#RUB#3184',
        _transferType: 'outcome',
        _transferId: '889845048'
      },
      {
        comment: 'Ф****в Имь Отчевич',
        date: new Date('2019-03-07T11:56:32.000Z'),
        hold: false,
        income: 0,
        incomeAccount: 'account',
        outcome: 320,
        outcomeAccount: 'account'
      }
    ]

    const apiAccount = {
      zenAccount: {
        id: 'account'
      }
    }

    const converter = convertForAccount(apiAccount)
    const converted = apiTransactions.map(converter)

    expect(converted).toEqual(expected)
  })
})
