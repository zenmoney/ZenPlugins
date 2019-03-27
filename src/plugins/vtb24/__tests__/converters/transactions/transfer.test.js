import { toZenmoneyTransaction } from '../../../../../common/converters'
import { convertTransaction } from '../../../converters'
const convertToReadableTransactionForAccount = apiAccount => apiTransaction => convertTransaction(apiTransaction, apiAccount)
const convertToZenmoneyTransactionForAccount = accountsByIdLookup => readableTransaction => toZenmoneyTransaction(readableTransaction, accountsByIdLookup)

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

    const expectedReadableTransactions = [
      {
        comment: null,
        date: new Date('2018-06-27T08:45:04.000Z'),
        hold: true,
        merchant: null,
        movements: [
          {
            id: '880947d1-bdd0-4c88-afd0-eb29283a1db5',
            account: { id: 'account' },
            invoice: null,
            sum: -59585,
            fee: 0
          }
        ]
      },
      {
        comment: null,
        date: new Date('2019-03-04T15:27:14.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            id: 'gSdGO1PlZip77oyKjk1avg4jjjY=',
            account: { id: 'account' },
            invoice: null,
            sum: 1500,
            fee: 0
          },
          {
            id: null,
            account: {
              company: null,
              instrument: 'RUB',
              syncIds: [
                '3184'
              ],
              type: 'ccard'
            },
            invoice: null,
            sum: -1500,
            fee: 0
          }
        ]
      },
      {
        comment: null,
        date: new Date('2019-03-07T11:56:32.000Z'),
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

    const expectedZenmoneyTransactions = [
      {
        id: '880947d1-bdd0-4c88-afd0-eb29283a1db5',
        date: new Date('2018-06-27T11:45:04+03:00'),
        hold: true,
        income: 0,
        incomeAccount: 'account',
        outcome: 59585,
        outcomeAccount: 'account',
        comment: null
      },
      {
        date: new Date('2019-03-04T15:27:14.000Z'),
        hold: false,
        income: 1500,
        incomeAccount: 'account',
        incomeBankID: 'gSdGO1PlZip77oyKjk1avg4jjjY=',
        outcome: 1500,
        outcomeAccount: 'ccard#RUB#3184',
        outcomeBankID: null,
        comment: null
      },
      {
        id: 'fS76Rj7PrQ+sQn/4egQK/EE7LN0=',
        date: new Date('2019-03-07T11:56:32.000Z'),
        hold: false,
        income: 0,
        incomeAccount: 'account',
        outcome: 320,
        outcomeAccount: 'account',
        payee: 'Ф****в Имь Отчевич',
        comment: null,
        mcc: null
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

  xit('skips internal account to card transfers', () => {
    const apiTransactions = [
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.AccountTransactionMto',
        id: 'rip/IEqwxKZ6wIMEAEh1qBHq7lw=;55bCGjg2jU00TA9FW0tT67PjU8Y=',
        details: 'Перевод на счет *4321',
        isHold: false,
        statusName: 'Исполнено',
        debet:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.product.MasterAccountMto',
            isDefault: true,
            number: '40817800000000001234',
            id: 'E6634F3C165543ABA57F3644B2AC2249',
            name: 'Мастер счет в рублях',
            displayName: 'Мастер счет в рублях',
            showOnMainPage: true,
            archived: false,
            masterAccountCards: [],
            contract:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.product.ComplexServiceContractMto',
                commissionInterval: null,
                number: null,
                id: 'db4492e1-e187-4cbb-94fa-7bae8fc3a2be',
                name: 'Базовый',
                displayName: 'Базовый',
                showOnMainPage: null,
                archived: false,
                masterAccounts: null,
                nextCommissionDate: null,
                status: null,
                openDate: new Date('Sun Jan 13 2019 00:00:00 GMT+0300 (MSK)'),
                endDate: null,
                closeDate: null,
                contractPeriod: null,
                details: null
              },
            overdraft: null,
            cards: [],
            mainCard: null,
            status:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
                id: 'OPEN'
              },
            openDate: new Date('Sat Jan 13 2018 00:00:00 GMT+0300 (MSK)'),
            lastOperationDate: null,
            closeDate: null,
            amount:
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
            details:
              [
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                  id: 'Наименование Банка получателя',
                  name: 'Филиал № 7701 Банка ВТБ (публичное акционерное общество) в г. Москве'
                },
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                  id: 'БИК Банка получателя',
                  name: '044525745'
                },
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                  id: 'ИНН Банка получателя',
                  name: '7702070139'
                },
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                  id: 'К/С Банка получателя',
                  name: '30101810345250000745'
                },
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                  id: 'Получатель',
                  name: 'Фамильев Имь Отчевич'
                },
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                  id: 'Счет получателя в банке получателя',
                  name: '40817800000000001234'
                }
              ],
            __id: 15
          },
        transactionDate: new Date('Sun Mar 17 2019 00:47:37 GMT+0300 (MSK)'),
        processedDate: new Date('Sun Mar 17 2019 01:35:37 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -15000,
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
            id: '908126180',
            orderId: 908126180,
            description: 'Перевод на счет *4321',
            pending: false,
            ignoreLimits: false,
            canBeExecuted: true,
            statusName: null,
            creationDate: new Date('Sun Mar 17 2019 00:47:36 GMT+0300 (MSK)'),
            completionDate: new Date('Sun Mar 17 2019 00:47:40 GMT+0300 (MSK)'),
            amount:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
                sum: 15000,
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
        id: 'rip/IEqwxKZ6wIMEAEh1qBHq7lw=;RTG8eydtWvh4RAs9Ng5Sai7KK/U=',
        details: 'Перевод средств между своими счетами. НДС не облагается',
        isHold: false,
        statusName: null,
        debet: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.MasterAccountMto',
          isDefault: true,
          number: '40817800000000001234',
          id: 'E6634F3C165543ABA57F3644B2AC2249',
          name: 'Мастер счет в рублях',
          displayName: 'Мастер счет в рублях',
          showOnMainPage: true,
          archived: false,
          masterAccountCards: [],
          contract:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.product.ComplexServiceContractMto',
              commissionInterval: null,
              number: null,
              id: 'db4492e1-e187-4cbb-94fa-7bae8fc3a2be',
              name: 'Базовый',
              displayName: 'Базовый',
              showOnMainPage: null,
              archived: false,
              masterAccounts: null,
              nextCommissionDate: null,
              status: null,
              openDate: new Date('Sun Jan 13 2019 00:00:00 GMT+0300 (MSK)'),
              endDate: null,
              closeDate: null,
              contractPeriod: null,
              details: null
            },
          overdraft: null,
          cards: [],
          mainCard: null,
          status:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
              id: 'OPEN'
            },
          openDate: new Date('Sat Jan 13 2018 00:00:00 GMT+0300 (MSK)'),
          lastOperationDate: null,
          closeDate: null,
          amount:
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
          details:
            [
              {
                __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                id: 'Наименование Банка получателя',
                name: 'Филиал № 7701 Банка ВТБ (публичное акционерное общество) в г. Москве'
              },
              {
                __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                id: 'БИК Банка получателя',
                name: '044525745'
              },
              {
                __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                id: 'ИНН Банка получателя',
                name: '7702070139'
              },
              {
                __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                id: 'К/С Банка получателя',
                name: '30101810345250000745'
              },
              {
                __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                id: 'Получатель',
                name: 'Смирнова Александра Вадимовна'
              },
              {
                __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                id: 'Счет получателя в банке получателя',
                name: '40817800000000001234'
              }
            ],
          __id: 15
        },
        transactionDate: new Date('Fri Mar 15 2019 17:47:02 GMT+0300 (MSK)'),
        processedDate: new Date('Fri Mar 15 2019 17:47:02 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 15000,
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
        id: '5x68QJ9sIpVHryQQflawldCFCPc=;0ofllHddHh7JrKwjGwIWdt4Z0r8=',
        details: 'Перевод денежных средств по картам Банка    ',
        isHold: false,
        statusName: null,
        transactionAmountInAccountCurrency:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 15000,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        debet: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardMto',
          number: '465218******4321',
          brandName: 'Visa',
          embossed: 'MR CARDHOLDER',
          cardHolder: 'Фамильев Имь Отчевич',
          isAuthenticationalCard: false,
          coBrandName: null,
          isEmitedForOwner: true,
          shortNumber: '465218******4321',
          icon: 'MBank_Card',
          cardHolderLastName: null,
          cardHolderFirstName: null,
          cardHolderPatronymic: null,
          nameOnCard: null,
          statusDisplayName: 'Активна',
          isMain: false,
          hasDependantCards: false,
          id: '4B206FF1AB074BA096C3478FDD9D6B88',
          name: 'Classic',
          displayName: 'Classic',
          showOnMainPage: true,
          archived: false,
          issueDate: new Date('Mon Aug 06 2018 00:00:00 GMT+0300 (MSK)'),
          expireDate: new Date('Fri May 31 2019 00:00:00 GMT+0300 (MSK)'),
          baseCurrency:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
              currencyCode: 'RUR',
              name: 'Рубль России',
              displaySymbol: '₽'
            },
          limits: null,
          balance:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.product.CardBalanceMto',
              amountSum: -47002,
              allowedSum: 137998,
              authorizedSum: 6386,
              balanceDate: null
            },
          lockedDate: null,
          status:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
              id: 'ACTIVE'
            },
          __id: 17
        },
        transactionDate: new Date('Sun Mar 17 2019 00:47:39 GMT+0300 (MSK)'),
        processedDate: new Date('Mon Mar 18 2019 00:00:00 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 15000,
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
        id: '9ghIeHu0gwkvGUDg6JNSxCA2Uu4=;nSFdV9/SG/Tcw4vZgi9eansXG4o=',
        details: 'Перевод денежных средств по картам Банка    ',
        isHold: false,
        statusName: null,
        transactionAmountInAccountCurrency:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 15000,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        debet: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardMto',
          number: '465206******9876',
          brandName: 'Visa',
          embossed: 'MR CARDHOLDER',
          cardHolder: 'Фамильев Имь Отчевич',
          isAuthenticationalCard: false,
          coBrandName: null,
          isEmitedForOwner: true,
          shortNumber: '465206******9876',
          icon: 'MBank_Card',
          cardHolderLastName: null,
          cardHolderFirstName: null,
          cardHolderPatronymic: null,
          nameOnCard: null,
          statusDisplayName: 'Активна',
          isMain: false,
          hasDependantCards: false,
          id: 'FD6D0B0C1911471B877E23F9E788293A',
          name: 'Visa Classic POS CARD',
          displayName: 'Visa Classic POS CARD',
          showOnMainPage: true,
          archived: false,
          issueDate: new Date('Wed May 10 2017 00:00:00 GMT+0300 (MSK)'),
          expireDate: new Date('Fri May 31 2019 00:00:00 GMT+0300 (MSK)'),
          baseCurrency:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
              currencyCode: 'RUR',
              name: 'Рубль России',
              displaySymbol: '₽'
            },
          limits: null,
          balance:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.product.CardBalanceMto',
              amountSum: -47002,
              allowedSum: 137998,
              authorizedSum: 6386,
              balanceDate: null
            },
          lockedDate: null,
          status:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
              id: 'ACTIVE'
            },
          __id: 17
        },
        transactionDate: new Date('Sun Mar 17 2019 00:47:39 GMT+0300 (MSK)'),
        processedDate: new Date('Mon Mar 18 2019 00:00:00 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 15000,
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
        date: new Date('2019-03-16T21:47:37.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            id: 'rip/IEqwxKZ6wIMEAEh1qBHq7lw=;55bCGjg2jU00TA9FW0tT67PjU8Y=',
            account: { 'id': 'account' },
            invoice: null,
            sum: -15000,
            fee: 0
          },
          {
            id: null,
            account: {
              company: null,
              instrument: 'RUB',
              syncIds: ['4321'],
              type: 'ccard'
            },
            invoice: null,
            sum: 15000,
            fee: 0
          }
        ]
      },
      {
        comment: 'Перевод средств между своими счетами. НДС не облагается',
        date: new Date('2019-03-15T14:47:02.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            id: 'rip/IEqwxKZ6wIMEAEh1qBHq7lw=;RTG8eydtWvh4RAs9Ng5Sai7KK/U=',
            account: { 'id': 'account' },
            invoice: null,
            sum: 15000,
            fee: 0
          }
        ]
      },
      null,
      null
    ]

    const apiAccount = {
      id: 'account',
      zenAccount: {
        id: 'account'
      }
    }

    const accountsByIdLookup = {
      '4B206FF1AB074BA096C3478FDD9D6B88': {
        id: '4B206FF1AB074BA096C3478FDD9D6B88',
        zenAccount: {
          id: '4B206FF1AB074BA096C3478FDD9D6B88'
        }
      },
      'FD6D0B0C1911471B877E23F9E788293A': {
        id: 'FD6D0B0C1911471B877E23F9E788293A',
        zenAccount: {
          id: 'FD6D0B0C1911471B877E23F9E788293A'
        }
      }
    }
    const readableTransactionConverter = accountId => convertToReadableTransactionForAccount(accountsByIdLookup[accountId] || apiAccount)
    const readableTransactions = apiTransactions.map(transaction => readableTransactionConverter(transaction.debet.id)(transaction))
    expect(readableTransactions).toEqual(expectedReadableTransactions)
  })
})
