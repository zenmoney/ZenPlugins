import { convertTransaction } from '../../../converters'
import { adjustTransactions } from '../../../../../common/transactionGroupHandler'

const mergeTransfers = (transactions) => adjustTransactions({ transactions })

describe('mergeTransfers', () => {
  it('merges converted TransferCreditOnLine', () => {
    const apiTransactions = [
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto',
        id: 'rqYnON9OzY/IabHt6BL5Qfi11sA=;MSPxWmBP5xYKBeKp2Wo37OMJXrA=',
        details: 'TransferCreditOnLine   ;AMNT=19475;C2A=Y',
        isHold: true,
        statusName: 'В обработке',
        transactionAmountInAccountCurrency:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -19475,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        debet:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.product.DebitCardMto',
            number: '220065******9876',
            brandName: 'МИР Классическая',
            embossed: 'CARDHOLDER NAME',
            cardHolder: 'Фамильев Имь Отчевич',
            isAuthenticationalCard: false,
            coBrandName: null,
            isEmitedForOwner: true,
            shortNumber: '220065******9876',
            icon: 'MBank_Card',
            cardHolderLastName: null,
            cardHolderFirstName: null,
            cardHolderPatronymic: null,
            nameOnCard: null,
            statusDisplayName: 'Активна',
            isMain: false,
            hasDependantCards: false,
            id: '9F7182936EBD42EFA77CF22D3BCE5CA2',
            name: 'Зарплатная карта',
            displayName: 'Зарплатная карта',
            showOnMainPage: true,
            archived: false,
            overdraft:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.product.OverdraftMto',
                interestRate: 0,
                interest: null,
                minAmountMtoForRepayment: null,
                overdraftLimit:
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
                ownBalance: null,
                pastDueInterest: null,
                pastDueLiability: null,
                pastDueLiabilityPenalty: null,
                pastDueTotal: null,
                planningPaymentDate: null,
                principalDebt: null,
                technicalOverdraft: null,
                technicalOverdraftPenalty: null,
                totalAmountMtoForRepayment: null,
                unusedOverdraftLimit: null
              },
            issueDate: new Date('Tue Mar 27 2018 00:00:00 GMT+0300 (MSK)'),
            expireDate: new Date('Wed Mar 31 2021 00:00:00 GMT+0300 (MSK)'),
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
                amountSum: 0,
                allowedSum: 0,
                authorizedSum: 19475,
                balanceDate: null
              },
            lockedDate: null,
            status:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
                id: 'ACTIVE'
              },
            __id: 17,
            cardAccount:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.product.DebitCardAccountMto',
                number: '220065******9876',
                id: '482DB3278B614204A29472529B40A4E0',
                name: 'Зарплатная карта',
                displayName: 'Зарплатная карта',
                showOnMainPage: true,
                archived: false,
                cards: ['<ref[17]>'],
                mainCard: '<ref[17]>',
                status:
                  {
                    __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
                    id: 'OPEN'
                  },
                openDate: new Date('Tue Mar 27 2018 00:00:00 GMT+0300 (MSK)'),
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
                      name: 'Филиал «Центральный» Банка ВТБ (публичное акционерное общество) в г. Москве (Филиал «Центральный» Банка ВТБ (ПАО))'
                    },
                    {
                      __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      id: 'ИНН Банка получателя',
                      name: '7702070139 '
                    },
                    {
                      __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      id: 'КПП Банка получателя',
                      name: '770943002 '
                    },
                    {
                      __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      id: 'БИК Банка получателя',
                      name: '044525411'
                    },
                    {
                      __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      id: 'К/С Банка получателя',
                      name: '№ 30101810145250000411 в Отделении 1 Главного управления Центрального банка Российской Федерации по Центральному федеральному округу г. Москва'
                    },
                    {
                      __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      id: 'Счет получателя в банке получателя',
                      name: '30232 000 0 0000 0000001'
                    },
                    {
                      __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      id: 'Назначение платежа',
                      name: 'В назначении платежа необходимо указать Фамилию, имя, отчество и № карты (16 знаков) получателя'
                    }
                  ]
              },
            logistics: null,
            details:
              [
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                  id: 'Наименование Банка получателя',
                  name: 'Филиал «Центральный» Банка ВТБ (публичное акционерное общество) в г. Москве (Филиал «Центральный» Банка ВТБ (ПАО))'
                },
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                  id: 'ИНН Банка получателя',
                  name: '7702070139 '
                },
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                  id: 'КПП Банка получателя',
                  name: '770943002 '
                },
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                  id: 'БИК Банка получателя',
                  name: '044525411'
                },
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                  id: 'К/С Банка получателя',
                  name: '№ 30101810145250000411 в Отделении 1 Главного управления Центрального банка Российской Федерации по Центральному федеральному округу г. Москва'
                },
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                  id: 'Счет получателя в банке получателя',
                  name: '30232 000 0 0000 0000001'
                },
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                  id: 'Назначение платежа',
                  name: 'В назначении платежа необходимо указать Фамилию, имя, отчество и № карты (16 знаков) получателя'
                }
              ]
          },
        transactionDate: new Date('Tue Apr 02 2019 12:38:20 GMT+0300 (MSK)'),
        processedDate: new Date('Tue Apr 02 2019 12:38:20 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -19475,
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
        __type: 'ru.vtb24.mobilebanking.protocol.statement.AccountTransactionMto',
        id: 'MO+HH8iJ2gSHWwZg5/uFTLbztJY=;3GdW33rwiH1yj9zNoNd3nRNAuf0=',
        details: 'Зачисление со счета *9876',
        isHold: false,
        statusName: 'Исполнено',
        debet:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.product.SettlementAccountMto',
            isDefault: false,
            number: '40817800000000001234',
            id: 'EA29B20AA8664321BDEB13F473001321',
            name: 'Текущий счет',
            displayName: 'Текущий счет',
            showOnMainPage: true,
            archived: false,
            status:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
                id: 'OPEN'
              },
            openDate: new Date('Fri Aug 24 2018 00:00:00 GMT+0300 (MSK)'),
            lastOperationDate: null,
            closeDate: null,
            amount:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
                sum: 57037.52,
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
        transactionDate: new Date('Tue Apr 02 2019 12:37:36 GMT+0300 (MSK)'),
        processedDate: new Date('Tue Apr 02 2019 12:37:36 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 19475,
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
            id: '931785142',
            orderId: 931785142,
            description: 'Перевод на счет *1234',
            pending: false,
            ignoreLimits: false,
            canBeExecuted: true,
            statusName: null,
            creationDate: new Date('Tue Apr 02 2019 12:38:15 GMT+0300 (MSK)'),
            completionDate: new Date('Tue Apr 02 2019 12:38:24 GMT+0300 (MSK)'),
            amount:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
                sum: 19475,
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
      '9F7182936EBD42EFA77CF22D3BCE5CA2': { id: 'account1', instrument: 'RUB' },
      'EA29B20AA8664321BDEB13F473001321': { id: 'account2', instrument: 'RUB' }
    }

    const transactions = mergeTransfers(apiTransactions.map(apiTransaction => convertTransaction(apiTransaction, accountsById[apiTransaction.debet.id])))
    const expectedTransactions = [
      {
        date: new Date('2019-04-02T09:37:36.000Z'),
        hold: null,
        comment: null,
        merchant: null,
        movements: [
          {
            id: 'MSPxWmBP5xYKBeKp2Wo37OMJXrA=',
            account: { id: 'account1' },
            invoice: null,
            sum: -19475,
            fee: 0
          }, {
            id: '3GdW33rwiH1yj9zNoNd3nRNAuf0=',
            account: { id: 'account2' },
            invoice: null,
            sum: 19475,
            fee: 0
          }
        ]
      }
    ]

    expect(transactions).toEqual(expectedTransactions)
  })

  it('merges bank card transfers', () => {
    const apiTransactions = [
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.AccountTransactionMto',
        id: 'EwJnoQuNCEivGaWT1Mvy9KgutME=;uUnAEirMPnfb5U6KGgF4qrA4Yyg=',
        details: 'Перевод на счет *9876',
        isHold: false,
        statusName: 'Исполнено',
        debet: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.SettlementAccountMto',
          isDefault: false,
          number: '40817800000000004321',
          id: '7D4DFA28CDA24709968514B6EF733AD7',
          name: 'Текущий счет',
          displayName: 'Текущий счет',
          showOnMainPage: true,
          archived: false,
          status:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
              id: 'OPEN'
            },
          openDate: new Date('Wed Feb 06 2019 02:00:00 GMT+0500 (+05)'),
          lastOperationDate: null,
          closeDate: null,
          amount:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
              sum: 823.69,
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
                name: 'Филиал № 6602 Банка ВТБ (публичное акционерное общество)'
              },
              {
                __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                id: 'БИК Банка получателя',
                name: '046577501'
              },
              {
                __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                id: 'ИНН Банка получателя',
                name: '7702070139'
              },
              {
                __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                id: 'К/С Банка получателя',
                name: '30101810165770000501'
              },
              {
                __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                id: 'Получатель',
                name: 'Фамильев Имь Отчевич'
              },
              {
                __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                id: 'Счет получателя в банке получателя',
                name: '40817800000000004321'
              }
            ],
          __id: 15
        },
        transactionDate: new Date('Tue Mar 26 2019 09:08:53 GMT+0500 (+05)'),
        processedDate: new Date('Tue Mar 26 2019 09:08:55 GMT+0500 (+05)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -50000,
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
            id: '921036714',
            orderId: 921036714,
            description: 'Перевод на счет *9876',
            pending: false,
            ignoreLimits: false,
            canBeExecuted: true,
            statusName: null,
            creationDate: new Date('Tue Mar 26 2019 09:09:21 GMT+0500 (+05)'),
            completionDate: new Date('Tue Mar 26 2019 09:09:27 GMT+0500 (+05)'),
            amount:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
                sum: 50000,
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
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto',
        id: 'KFP/DNw+H4KA6FP/JN4xWHwXp/M=;Yx+Zjwl/zXk4JYkJ96uNnhbUV6Y=',
        details: 'Перевод денежных средств по картам Банка    ',
        isHold: false,
        statusName: null,
        transactionAmountInAccountCurrency:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 50000,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        debet: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.DebitCardMto',
          number: '220065******9876',
          brandName: 'МИР Классическая',
          embossed: 'CARDHOLDER NAME',
          cardHolder: 'Фамильев Имь Отчевич',
          isAuthenticationalCard: false,
          coBrandName: null,
          isEmitedForOwner: true,
          shortNumber: '220065******9876',
          icon: 'MBank_Card',
          cardHolderLastName: null,
          cardHolderFirstName: null,
          cardHolderPatronymic: null,
          nameOnCard: null,
          statusDisplayName: 'Активна',
          isMain: false,
          hasDependantCards: false,
          id: '8368CAD908184E378698274A93844B6A',
          name: 'Зарплатная карта',
          displayName: 'Зарплатная карта',
          showOnMainPage: true,
          archived: false,
          overdraft:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.product.OverdraftMto',
              interestRate: 0,
              interest: null,
              minAmountMtoForRepayment: null,
              overdraftLimit:
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
              ownBalance: null,
              pastDueInterest: null,
              pastDueLiability: null,
              pastDueLiabilityPenalty: null,
              pastDueTotal: null,
              planningPaymentDate: null,
              principalDebt: null,
              technicalOverdraft: null,
              technicalOverdraftPenalty: null,
              totalAmountMtoForRepayment: null,
              unusedOverdraftLimit: null
            },
          issueDate: new Date('Fri Jun 09 2017 02:00:00 GMT+0500 (+05)'),
          expireDate: new Date('Tue Jun 30 2020 02:00:00 GMT+0500 (+05)'),
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
              amountSum: 0.76,
              allowedSum: 0.76,
              authorizedSum: 0,
              balanceDate: null
            },
          lockedDate: null,
          status:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
              id: 'ACTIVE'
            },
          __id: 17,
          cardAccount:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.product.DebitCardAccountMto',
              number: '220065******9876',
              id: '4116E91D991B47A0B544FBCD8C253595',
              name: 'Зарплатная карта',
              displayName: 'Зарплатная карта',
              showOnMainPage: true,
              archived: false,
              cards: ['<ref[17]>'],
              mainCard: '<ref[17]>',
              status:
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
                  id: 'OPEN'
                },
              openDate: new Date('Fri Jun 09 2017 02:00:00 GMT+0500 (+05)'),
              lastOperationDate: null,
              closeDate: null,
              amount:
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
                  sum: 0.76,
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
                    name: 'Филиал «Центральный» Банка ВТБ (публичное акционерное общество) в г. Москве (Филиал «Центральный» Банка ВТБ (ПАО))'
                  },
                  {
                    __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                    id: 'ИНН Банка получателя',
                    name: '7702070139 '
                  },
                  {
                    __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                    id: 'КПП Банка получателя',
                    name: '770943002 '
                  },
                  {
                    __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                    id: 'БИК Банка получателя',
                    name: '044525411'
                  },
                  {
                    __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                    id: 'К/С Банка получателя',
                    name: '№ 30101810145250000411 в Отделении 1 Главного управления Центрального банка Российской Федерации по Центральному федеральному округу г. Москва'
                  },
                  {
                    __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                    id: 'Счет получателя в банке получателя',
                    name: '30232 000 0 0000 0000001'
                  },
                  {
                    __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                    id: 'Назначение платежа',
                    name: 'В назначении платежа необходимо указать Фамилию, имя, отчество и № карты (16 знаков) получателя'
                  }
                ]
            },
          logistics: null,
          details:
            [
              {
                __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                id: 'Наименование Банка получателя',
                name: 'Филиал «Центральный» Банка ВТБ (публичное акционерное общество) в г. Москве (Филиал «Центральный» Банка ВТБ (ПАО))'
              },
              {
                __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                id: 'ИНН Банка получателя',
                name: '7702070139 '
              },
              {
                __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                id: 'КПП Банка получателя',
                name: '770943002 '
              },
              {
                __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                id: 'БИК Банка получателя',
                name: '044525411'
              },
              {
                __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                id: 'К/С Банка получателя',
                name: '№ 30101810145250000411 в Отделении 1 Главного управления Центрального банка Российской Федерации по Центральному федеральному округу г. Москва'
              },
              {
                __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                id: 'Счет получателя в банке получателя',
                name: '30232 000 0 0000 0000001'
              },
              {
                __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                id: 'Назначение платежа',
                name: 'В назначении платежа необходимо указать Фамилию, имя, отчество и № карты (16 знаков) получателя'
              }
            ]
        },
        transactionDate: new Date('Tue Mar 26 2019 09:09:25 GMT+0500 (+05)'),
        processedDate: new Date('Tue Mar 26 2019 02:00:00 GMT+0500 (+05)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 50000,
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

    const accountsById = {
      '7D4DFA28CDA24709968514B6EF733AD7': { id: 'account1', instrument: 'RUB' },
      '8368CAD908184E378698274A93844B6A': { id: 'account2', instrument: 'RUB' }
    }

    const transactions = mergeTransfers(apiTransactions.map(apiTransaction => convertTransaction(apiTransaction, accountsById[apiTransaction.debet.id])))
    const expectedTransactions = [
      {
        date: new Date('2019-03-26T04:08:53.000Z'),
        hold: false,
        comment: null,
        merchant: null,
        movements: [
          {
            id: 'uUnAEirMPnfb5U6KGgF4qrA4Yyg=',
            account: { id: 'account1' },
            invoice: null,
            sum: -50000,
            fee: 0
          }, {
            id: 'Yx+Zjwl/zXk4JYkJ96uNnhbUV6Y=',
            account: { id: 'account2' },
            invoice: null,
            sum: 50000,
            fee: 0
          }
        ]
      }
    ]

    expect(transactions).toEqual(expectedTransactions)
  })

  it('merges card transactions', () => {
    const apiTransactions = [
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.AccountTransactionMto',
        id: 'pyJKCH6GC3Gmy0CIvGjgzPX3yMI=;+p18i9x+nWUwS9AwXCv/DP2PsMA=',
        details: 'Перевод на счет *1234',
        isHold: false,
        statusName: 'Исполнено',
        debet: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.MasterAccountMto',
          isDefault: true,
          number: '40817800000000009876',
          id: 'F85CC22EFB9F414CBEBDCFEB1A4E00C9',
          name: 'Мастер счет в рублях',
          displayName: 'Мастер счет в рублях',
          showOnMainPage: true,
          archived: false,
          __id: 21,
          masterAccountCards:
            [
              {
                __type: 'ru.vtb24.mobilebanking.protocol.product.MasterAccountCardMto',
                number: '489347******3025',
                brandName: 'Visa',
                embossed: 'CARDHOLDER NAME',
                cardHolder: 'CARDHOLDER NAME',
                isAuthenticationalCard: false,
                coBrandName: null,
                isEmitedForOwner: true,
                shortNumber: '489347******3025',
                icon: null,
                cardHolderLastName: null,
                cardHolderFirstName: null,
                cardHolderPatronymic: null,
                nameOnCard: null,
                statusDisplayName: 'Карта закрыта',
                isMain: false,
                hasDependantCards: false,
                id: 'ABA9D288493B483880D0C2E3B066BDF9',
                name: 'Мультикарта Unembossed',
                displayName: 'Мультикарта Unembossed',
                showOnMainPage: true,
                archived: true,
                overdraft: null,
                issueDate: new Date('Thu Nov 29 2018 00:00:00 GMT+0300 (MSK)'),
                expireDate: new Date('Tue Nov 30 2021 00:00:00 GMT+0300 (MSK)'),
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
                    amountSum: 10569.65,
                    allowedSum: 10569.65,
                    authorizedSum: 19890.58,
                    balanceDate: null
                  },
                lockedDate: null,
                status:
                  {
                    __type: 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
                    id: 'CLOSE'
                  },
                cardAccount: '<ref[21]>',
                logistics: null,
                details: [],
                __id: 23
              },
              '<ref[17]>',
              {
                __type: 'ru.vtb24.mobilebanking.protocol.product.MasterAccountCardMto',
                number: '489347******0655',
                brandName: 'Visa',
                embossed: 'CARDHOLDER NAME',
                cardHolder: 'CARDHOLDER NAME',
                isAuthenticationalCard: false,
                coBrandName: null,
                isEmitedForOwner: true,
                shortNumber: '489347******0655',
                icon: 'Fifa-gold',
                cardHolderLastName: null,
                cardHolderFirstName: null,
                cardHolderPatronymic: null,
                nameOnCard: null,
                statusDisplayName: 'Активна',
                isMain: false,
                hasDependantCards: false,
                id: '341E6261DFAD4882B8784D1D04B067DC',
                name: 'Мультикарта FIFA',
                displayName: 'Мультикарта FIFA',
                showOnMainPage: true,
                archived: false,
                overdraft: null,
                issueDate: new Date('Thu Dec 07 2017 00:00:00 GMT+0300 (MSK)'),
                expireDate: new Date('Thu Dec 31 2020 00:00:00 GMT+0300 (MSK)'),
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
                    amountSum: 10569.65,
                    allowedSum: 10569.65,
                    authorizedSum: 19890.58,
                    balanceDate: null
                  },
                lockedDate: null,
                status:
                  {
                    __type: 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
                    id: 'ACTIVE'
                  },
                cardAccount: '<ref[21]>',
                logistics: null,
                details: [],
                __id: 28
              },
              {
                __type: 'ru.vtb24.mobilebanking.protocol.product.MasterAccountCardMto',
                number: '527883******1391',
                brandName: 'MasterCard',
                embossed: 'CARDHOLDER NAME',
                cardHolder: 'CARDHOLDER NAME',
                isAuthenticationalCard: false,
                coBrandName: null,
                isEmitedForOwner: true,
                shortNumber: '527883******1391',
                icon: 'MasterCard_Unembossed_rozovaya',
                cardHolderLastName: null,
                cardHolderFirstName: null,
                cardHolderPatronymic: null,
                nameOnCard: null,
                statusDisplayName: 'Карта закрыта',
                isMain: false,
                hasDependantCards: false,
                id: 'D3D144BB42C24846AC8D49AB98A7CDBE',
                name: 'Unembossed',
                displayName: 'Unembossed',
                showOnMainPage: true,
                archived: true,
                overdraft: null,
                issueDate: new Date('Thu Dec 15 2016 00:00:00 GMT+0300 (MSK)'),
                expireDate: new Date('Mon Dec 31 2018 00:00:00 GMT+0300 (MSK)'),
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
                    amountSum: 10569.65,
                    allowedSum: 10569.65,
                    authorizedSum: 19890.58,
                    balanceDate: null
                  },
                lockedDate: null,
                status:
                  {
                    __type: 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
                    id: 'CLOSE'
                  },
                cardAccount: '<ref[21]>',
                logistics: null,
                details: [],
                __id: 33
              },
              {
                __type: 'ru.vtb24.mobilebanking.protocol.product.MasterAccountCardMto',
                number: '471487******2988',
                brandName: 'Visa',
                embossed: 'CARDHOLDER NAME',
                cardHolder: 'CARDHOLDER NAME',
                isAuthenticationalCard: false,
                coBrandName: null,
                isEmitedForOwner: true,
                shortNumber: '471487******2988',
                icon: 'Visa_Classic_Unembossed_rozovaya',
                cardHolderLastName: null,
                cardHolderFirstName: null,
                cardHolderPatronymic: null,
                nameOnCard: null,
                statusDisplayName: 'Карта закрыта',
                isMain: false,
                hasDependantCards: false,
                id: 'BEBB768D518947BEB23051FD74A2997F',
                name: 'Classic',
                displayName: 'Classic',
                showOnMainPage: true,
                archived: true,
                overdraft: null,
                issueDate: new Date('Thu Oct 27 2016 00:00:00 GMT+0300 (MSK)'),
                expireDate: new Date('Wed Oct 31 2018 00:00:00 GMT+0300 (MSK)'),
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
                    amountSum: 10569.65,
                    allowedSum: 10569.65,
                    authorizedSum: 19890.58,
                    balanceDate: null
                  },
                lockedDate: null,
                status:
                  {
                    __type: 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
                    id: 'CLOSE'
                  },
                cardAccount: '<ref[21]>',
                logistics: null,
                details: [],
                __id: 38
              }
            ],
          contract:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.product.ComplexServiceContractMto',
              commissionInterval: null,
              number: null,
              id: '5d83d670-e7c3-472a-82d3-0078f9b3cb2d',
              name: 'Мультикарта',
              displayName: 'Мультикарта',
              showOnMainPage: null,
              archived: false,
              masterAccounts: null,
              nextCommissionDate: null,
              status: null,
              openDate: new Date('Fri Nov 30 2018 00:00:00 GMT+0300 (MSK)'),
              endDate: null,
              closeDate: null,
              contractPeriod: null,
              details: null
            },
          overdraft: null,
          cards:
            [
              '<ref[23]>',
              '<ref[17]>',
              '<ref[28]>',
              '<ref[33]>',
              '<ref[38]>'
            ],
          mainCard: null,
          status:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
              id: 'OPEN'
            },
          openDate: new Date('Thu Nov 17 2016 00:00:00 GMT+0300 (MSK)'),
          lastOperationDate: null,
          closeDate: null,
          amount:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
              sum: 10569.65,
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
                name: 'Филиал № 6318 Банка ВТБ (публичное акционерное общество)'
              },
              {
                __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                id: 'БИК Банка получателя',
                name: '043601968'
              },
              {
                __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                id: 'ИНН Банка получателя',
                name: '7702070139'
              },
              {
                __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                id: 'К/С Банка получателя',
                name: '30101810422023601968'
              },
              {
                __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                id: 'Получатель',
                name: 'Фамильев Имь Отчевич'
              },
              {
                __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                id: 'Счет получателя в банке получателя',
                name: '40817800000000009876'
              }
            ]
        },
        transactionDate: new Date('Sat Apr 06 2019 09:25:43 GMT+0300 (MSK)'),
        processedDate: new Date('Sat Apr 06 2019 09:25:45 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -5000,
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
            id: '937116495',
            orderId: 937116495,
            description: 'Перевод на счет *1234',
            pending: false,
            ignoreLimits: false,
            canBeExecuted: true,
            statusName: null,
            creationDate: new Date('Sat Apr 06 2019 09:26:32 GMT+0300 (MSK)'),
            completionDate: new Date('Sat Apr 06 2019 09:26:38 GMT+0300 (MSK)'),
            amount:
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
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto',
        id: '4BktLjUeh9qC58WHAl0+NWavoik=;uMrfNzOYxeAYJRytuvlaQbGX/nI=',
        details: 'Зачисление со счета *9876',
        isHold: false,
        statusName: 'Исполнено',
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
        debet:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardMto',
            number: '427230******1234',
            brandName: 'Visa',
            embossed: ' CARDHOLDER',
            cardHolder: 'Фамильев И.О.',
            isAuthenticationalCard: false,
            coBrandName: null,
            isEmitedForOwner: true,
            shortNumber: '427230******1234',
            icon: 'Muylticard-VTB',
            cardHolderLastName: 'Фамильев',
            cardHolderFirstName: 'Имь',
            cardHolderPatronymic: 'Отчевич',
            nameOnCard: null,
            statusDisplayName: 'Активна',
            isMain: false,
            hasDependantCards: false,
            id: 'CBFDBDDEFC3A4F91A8301B2B176DE527',
            name: 'карта Instant Issue',
            displayName: 'карта Instant Issue',
            showOnMainPage: true,
            archived: false,
            issueDate: new Date('Wed Nov 21 2018 00:00:00 GMT+0300 (MSK)'),
            expireDate: new Date('Thu Nov 30 2023 00:00:00 GMT+0300 (MSK)'),
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
                amountSum: -10890.84,
                allowedSum: 13109.16,
                authorizedSum: 0,
                balanceDate: null
              },
            lockedDate: null,
            status:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
                id: 'ACTIVE'
              },
            __id: 17,
            cardAccount:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardAccountMto',
                creditLimit: 24000,
                number: '427230******1623',
                id: '8FBDCF32B0CA4590AF6022D0E1B71738',
                name: 'Gold',
                displayName: 'Gold',
                showOnMainPage: true,
                archived: false,
                loanInfo:
                  {
                    __type: 'ru.vtb24.mobilebanking.protocol.product.LoanInfoMto',
                    interestRate: 26,
                    totalLiability: 10890.84,
                    loanRest: null,
                    currentLiability: -10890.84,
                    currentInterest: null,
                    pastDueTotal: 0,
                    pastDueLiability: 0,
                    pastDueLiabilityPenalty: 0,
                    pastDueInterest: 0,
                    pastDueInterestPenalty: 0,
                    repaymentSum: -10890.84,
                    accruedInterest: 0,
                    minAmountForRepayment: 0,
                    overLimit: 0,
                    overLimitPenalty: 0,
                    graceAmountForRepayment: 10890.84,
                    repaymentDate: new Date('Mon Apr 22 2019 00:00:00 GMT+0300 (MSK)'),
                    repaymentEndDate: null,
                    limitEndDate: new Date('Mon Nov 30 2048 00:00:00 GMT+0300 (MSK)'),
                    graceEndDate: new Date('Mon Apr 15 2019 00:00:00 GMT+0300 (MSK)'),
                    repaymentSource: null
                  },
                __id: 21,
                cards:
                  [
                    {
                      __type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardMto',
                      number: '427230******1623',
                      brandName: 'Visa',
                      embossed: 'CARDHOLDER NAME',
                      cardHolder: 'Фамильев И.О.',
                      isAuthenticationalCard: false,
                      coBrandName: null,
                      isEmitedForOwner: true,
                      shortNumber: '427230******1623',
                      icon: 'Muylticard-VTB',
                      cardHolderLastName: 'Фамильев',
                      cardHolderFirstName: 'Имь',
                      cardHolderPatronymic: 'Отчевич',
                      nameOnCard: null,
                      statusDisplayName: 'Карта заблокирована',
                      isMain: false,
                      hasDependantCards: false,
                      id: 'DA88172E49A24725ACE4A709D6AAACEA',
                      name: 'Gold',
                      displayName: 'Gold',
                      showOnMainPage: true,
                      archived: false,
                      issueDate: new Date('Fri Nov 30 2018 00:00:00 GMT+0300 (MSK)'),
                      expireDate: new Date('Tue Nov 30 2021 00:00:00 GMT+0300 (MSK)'),
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
                          amountSum: -10890.84,
                          allowedSum: 13109.16,
                          authorizedSum: 0,
                          balanceDate: null
                        },
                      lockedDate: new Date('Mon Feb 25 2019 00:00:00 GMT+0300 (MSK)'),
                      status:
                        {
                          __type: 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
                          id: 'LOCKED'
                        },
                      cardAccount: '<ref[21]>',
                      logistics: null,
                      details:
                        [
                          {
                            __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                            id: 'Наименование Банка получателя',
                            name: 'Филиал № 7701 Банка ВТБ (публичное акционерное общество) в г. Москве'
                          },
                          {
                            __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                            id: 'Адрес Банка получателя',
                            name: '101000, г.Москва, ул.Мясницкая, д.35'
                          },
                          {
                            __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                            id: 'ИНН Банка получателя',
                            name: '7702070139'
                          },
                          {
                            __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                            id: 'БИК Банка получателя',
                            name: '044525745'
                          },
                          {
                            __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                            id: 'К/С Банка получателя',
                            name: '30101810345250000745'
                          },
                          {
                            __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                            id: 'Получатель',
                            name: 'Счет для пополнений/списаний с банковских карт'
                          },
                          {
                            __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                            id: 'Счет получателя в Банке получателя',
                            name: '30232800000000000009'
                          },
                          {
                            __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                            id: 'Назначение платежа',
                            name: 'Для зачисления на карту (номер карты) Фамильев Имь Отчевич'
                          },
                          {
                            __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                            id: 'Примечание',
                            name: 'Обращаем Ваше внимание, для перевода средств на пластиковые карты в реквизитах необходимо указывать полный номер пластиковой карты, в противном случае зачисление на карту не происходит. Полный номер карты указан непосредственно на карте, за исключением банковских карт Visa Electron.'
                          }
                        ],
                      __id: 24
                    },
                    '<ref[17]>'
                  ],
                mainCard: '<ref[24]>',
                status:
                  {
                    __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
                    id: 'OPEN'
                  },
                openDate: new Date('Fri Nov 30 2018 00:00:00 GMT+0300 (MSK)'),
                lastOperationDate: null,
                closeDate: null,
                amount:
                  {
                    __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
                    sum: 13109.16,
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
                      id: 'Адрес Банка получателя',
                      name: '101000, г.Москва, ул.Мясницкая, д.35'
                    },
                    {
                      __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      id: 'ИНН Банка получателя',
                      name: '7702070139'
                    },
                    {
                      __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      id: 'БИК Банка получателя',
                      name: '044525745'
                    },
                    {
                      __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      id: 'К/С Банка получателя',
                      name: '30101810345250000745'
                    },
                    {
                      __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      id: 'Получатель',
                      name: 'Счет для пополнений/списаний с банковских карт'
                    },
                    {
                      __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      id: 'Счет получателя в Банке получателя',
                      name: '30232800000000000009'
                    },
                    {
                      __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      id: 'Назначение платежа',
                      name: 'Для зачисления на карту (номер карты) Фамильев Имь Отчевич'
                    },
                    {
                      __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      id: 'Примечание',
                      name: 'Обращаем Ваше внимание, для перевода средств на пластиковые карты в реквизитах необходимо указывать полный номер пластиковой карты, в противном случае зачисление на карту не происходит. Полный номер карты указан непосредственно на карте, за исключением банковских карт Visa Electron.'
                    }
                  ]
              },
            logistics: null,
            details:
              [
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                  id: 'Наименование Банка получателя',
                  name: 'Филиал № 7701 Банка ВТБ (публичное акционерное общество) в г. Москве'
                },
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                  id: 'Адрес Банка получателя',
                  name: '101000, г.Москва, ул.Мясницкая, д.35'
                },
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                  id: 'ИНН Банка получателя',
                  name: '7702070139'
                },
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                  id: 'БИК Банка получателя',
                  name: '044525745'
                },
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                  id: 'К/С Банка получателя',
                  name: '30101810345250000745'
                },
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                  id: 'Получатель',
                  name: 'Счет для пополнений/списаний с банковских карт'
                },
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                  id: 'Счет получателя в Банке получателя',
                  name: '30232800000000000009'
                },
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                  id: 'Назначение платежа',
                  name: 'Для зачисления на карту (номер карты) Фамильев Имь Отчевич'
                },
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                  id: 'Примечание',
                  name: 'Обращаем Ваше внимание, для перевода средств на пластиковые карты в реквизитах необходимо указывать полный номер пластиковой карты, в противном случае зачисление на карту не происходит. Полный номер карты указан непосредственно на карте, за исключением банковских карт Visa Electron.'
                }
              ]
          },
        transactionDate: new Date('Sat Apr 06 2019 09:26:36 GMT+0300 (MSK)'),
        processedDate: new Date('Sat Apr 06 2019 00:00:00 GMT+0300 (MSK)'),
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
        order:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.OrderMto',
            id: '937116495',
            orderId: 937116495,
            description: 'Перевод на счет *1234',
            pending: false,
            ignoreLimits: false,
            canBeExecuted: true,
            statusName: null,
            creationDate: new Date('Sat Apr 06 2019 09:26:32 GMT+0300 (MSK)'),
            completionDate: new Date('Sat Apr 06 2019 09:26:38 GMT+0300 (MSK)'),
            amount:
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
          },
        __id: 14
      }
    ]

    const accountsById = {
      'F85CC22EFB9F414CBEBDCFEB1A4E00C9': { id: 'account1', instrument: 'RUB' },
      'CBFDBDDEFC3A4F91A8301B2B176DE527': { id: 'account2', instrument: 'RUB' }
    }

    const transactions = mergeTransfers(apiTransactions.map(apiTransaction => convertTransaction(apiTransaction, accountsById[apiTransaction.debet.id])))
    const expectedTransactions = [
      {
        'comment': null,
        'date': new Date('2019-04-06T06:25:43.000Z'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            'account': { 'id': 'account1' },
            'fee': 0,
            'id': '+p18i9x+nWUwS9AwXCv/DP2PsMA=',
            'invoice': null,
            'sum': -5000
          },
          {
            'account': { 'id': 'account2' },
            'fee': 0,
            'id': 'uMrfNzOYxeAYJRytuvlaQbGX/nI=',
            'invoice': null,
            'sum': 5000
          }
        ]
      }
    ]

    expect(transactions).toEqual(expectedTransactions)
  })
})
