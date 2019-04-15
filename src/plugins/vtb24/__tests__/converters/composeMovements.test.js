import { composeReferencedMovement } from '../../converters'

describe('composeReferencedMovement', () => {
  it('composes with unknown order id', () => {
    const relatedMovements = [
      {
        'accountId': '14A32BB15CB74A528AD385BEC4F172C6',
        'apiTransaction': {
          '__type': 'ru.vtb24.mobilebanking.protocol.statement.AccountTransactionMto',
          'id': '3nCFmhkFvhsJ/SGkqkFT0WkLE6I=;iZ7/Nz3Tf6NmApOV1xbXcv8pfo0=',
          'details': 'Перевод на счет *9876',
          'isHold': false,
          'statusName': 'Исполнено',
          'debet': {
            '__type': 'ru.vtb24.mobilebanking.protocol.product.MasterAccountMto',
            'isDefault': true,
            'number': '40817800000000008765',
            'id': '14A32BB15CB74A528AD385BEC4F172C6',
            'name': 'Мастер счет в рублях',
            'displayName': 'Мастер счет в рублях',
            'showOnMainPage': true,
            'archived': false,
            '__id': 15,
            'masterAccountCards': [
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.product.MasterAccountCardMto',
                'number': '536829******4321',
                'brandName': 'MasterCard',
                'embossed': 'CARDHOLDER NAME',
                'cardHolder': 'CARDHOLDER NAME',
                'isAuthenticationalCard': false,
                'coBrandName': null,
                'isEmitedForOwner': true,
                'shortNumber': '536829******4321',
                'icon': 'Muylticard-VTB',
                'cardHolderLastName': null,
                'cardHolderFirstName': null,
                'cardHolderPatronymic': null,
                'nameOnCard': null,
                'statusDisplayName': 'Активна',
                'isMain': false,
                'hasDependantCards': false,
                'id': '701671471E9B4CB9946262DD2E853C6B',
                'name': 'Мультикарта',
                'displayName': 'Мультикарта',
                'showOnMainPage': true,
                'archived': false,
                'overdraft': null,
                'issueDate': 'Tue Aug 28 2018 00:00:00 GMT+0300 (MSK)',
                'expireDate': 'Tue Aug 31 2021 00:00:00 GMT+0300 (MSK)',
                'baseCurrency': {
                  '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                  'currencyCode': 'RUR',
                  'name': 'Рубль России',
                  'displaySymbol': '₽'
                },
                'limits': null,
                'balance': {
                  '__type': 'ru.vtb24.mobilebanking.protocol.product.CardBalanceMto',
                  'amountSum': 100000,
                  'allowedSum': 100000,
                  'authorizedSum': 0,
                  'balanceDate': null
                },
                'lockedDate': null,
                'status': {
                  '__type': 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
                  'id': 'ACTIVE'
                },
                'cardAccount': '<ref[15]>',
                'logistics': null,
                'details': [],
                '__id': 17
              }
            ],
            'contract': {
              '__type': 'ru.vtb24.mobilebanking.protocol.product.ComplexServiceContractMto',
              'commissionInterval': null,
              'number': null,
              'id': '8ba067a9-fff9-4ec1-a2c5-9fdb7182a60d',
              'name': 'Мультикарта',
              'displayName': 'Мультикарта',
              'showOnMainPage': null,
              'archived': false,
              'masterAccounts': null,
              'nextCommissionDate': null,
              'status': null,
              'openDate': 'Sat Dec 01 2018 00:00:00 GMT+0300 (MSK)',
              'endDate': null,
              'closeDate': null,
              'contractPeriod': null,
              'details': null
            },
            'overdraft': null,
            'cards': [
              '<ref[17]>'
            ],
            'mainCard': null,
            'status': {
              '__type': 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
              'id': 'OPEN'
            },
            'openDate': 'Wed Mar 16 2016 00:00:00 GMT+0300 (MSK)',
            'lastOperationDate': null,
            'closeDate': null,
            'amount': {
              '__type': 'ru.vtb24.mobilebanking.protocol.AmountMto',
              'sum': 100000,
              'currency': {
                '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                'currencyCode': 'RUR',
                'name': 'Рубль России',
                'displaySymbol': '₽'
              }
            },
            'details': [
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'Наименование Банка получателя',
                'name': 'Филиал № 7701 Банка ВТБ (публичное акционерное общество) в г. Москве'
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'БИК Банка получателя',
                'name': '044525745'
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'ИНН Банка получателя',
                'name': '7702070139'
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'К/С Банка получателя',
                'name': '30101810345250000745'
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'Получатель',
                'name': 'Фамильев Имь Отчевич'
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'Счет получателя в банке получателя',
                'name': '40817800000000008765'
              }
            ]
          },
          'transactionDate': 'Mon Apr 01 2019 09:51:44 GMT+0300 (MSK)',
          'processedDate': '2019-04-01T06:51:46.000Z',
          'transactionAmount': {
            '__type': 'ru.vtb24.mobilebanking.protocol.AmountMto',
            'sum': -15050.39,
            'currency': {
              '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
              'currencyCode': 'RUR',
              'name': 'Рубль России',
              'displaySymbol': '₽'
            }
          },
          'feeAmount': null,
          'order': {
            '__type': 'ru.vtb24.mobilebanking.protocol.OrderMto',
            'id': '929956251',
            'orderId': 929956251,
            'description': 'Перевод на счет *9876',
            'pending': false,
            'ignoreLimits': false,
            'canBeExecuted': true,
            'statusName': null,
            'creationDate': 'Mon Apr 01 2019 09:52:23 GMT+0300 (MSK)',
            'completionDate': 'Mon Apr 01 2019 09:52:29 GMT+0300 (MSK)',
            'amount': {
              '__type': 'ru.vtb24.mobilebanking.protocol.AmountMto',
              'sum': 15050.39,
              'currency': {
                '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                'currencyCode': 'RUR',
                'name': 'Рубль России',
                'displaySymbol': '₽'
              }
            },
            'operationInfo': {
              '__type': 'ru.vtb24.mobilebanking.protocol.operation.OperationInfoMto',
              'id': '9775',
              'enabled': true,
              'name': 'Между своими счетами / обмен валюты',
              'shortName': 'Перевод между своими счетами',
              'description': 'Переводы между собственными счетами и картами в рублях, валюте, а также обмен валюты. Курс обмена будет отображен сразу после выбора счетов /карт в разной валюте. При совершении операций с мультивалютных карт курсы валют вы можете узнать на сайте банка. Обращаем внимание: при переводе с банковской карты за счет кредитных средств или овердрафта взимается комиссия, которая с 01.10.2015 составляет 5,5% (мин. 300 рублей).',
              'placeholder': null,
              'sortOrder': 0,
              'categoryId': '46'
            },
            'status': null
          },
          'status': {
            '__type': 'ru.vtb24.mobilebanking.protocol.StatusMto',
            'id': 'SUCCESS'
          }
        }
      },
      {
        'accountId': '14A32BB15CB74A528AD385BEC4F172C6',
        'apiTransaction': {
          '__type': 'ru.vtb24.mobilebanking.protocol.statement.AccountTransactionMto',
          'id': '3nCFmhkFvhsJ/SGkqkFT0WkLE6I=;hpethepaKlZM2XFWUCJrl/E2ASA=',
          'details': 'Зачисление со счета *1234',
          'isHold': false,
          'statusName': 'Исполнено',
          'debet': {
            '__type': 'ru.vtb24.mobilebanking.protocol.product.MasterAccountMto',
            'isDefault': true,
            'number': '40817800000000008765',
            'id': '14A32BB15CB74A528AD385BEC4F172C6',
            'name': 'Мастер счет в рублях',
            'displayName': 'Мастер счет в рублях',
            'showOnMainPage': true,
            'archived': false,
            '__id': 15,
            'masterAccountCards': [
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.product.MasterAccountCardMto',
                'number': '536829******4321',
                'brandName': 'MasterCard',
                'embossed': 'CARDHOLDER NAME',
                'cardHolder': 'CARDHOLDER NAME',
                'isAuthenticationalCard': false,
                'coBrandName': null,
                'isEmitedForOwner': true,
                'shortNumber': '536829******4321',
                'icon': 'Muylticard-VTB',
                'cardHolderLastName': null,
                'cardHolderFirstName': null,
                'cardHolderPatronymic': null,
                'nameOnCard': null,
                'statusDisplayName': 'Активна',
                'isMain': false,
                'hasDependantCards': false,
                'id': '701671471E9B4CB9946262DD2E853C6B',
                'name': 'Мультикарта',
                'displayName': 'Мультикарта',
                'showOnMainPage': true,
                'archived': false,
                'overdraft': null,
                'issueDate': 'Tue Aug 28 2018 00:00:00 GMT+0300 (MSK)',
                'expireDate': 'Tue Aug 31 2021 00:00:00 GMT+0300 (MSK)',
                'baseCurrency': {
                  '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                  'currencyCode': 'RUR',
                  'name': 'Рубль России',
                  'displaySymbol': '₽'
                },
                'limits': null,
                'balance': {
                  '__type': 'ru.vtb24.mobilebanking.protocol.product.CardBalanceMto',
                  'amountSum': 100000,
                  'allowedSum': 100000,
                  'authorizedSum': 0,
                  'balanceDate': null
                },
                'lockedDate': null,
                'status': {
                  '__type': 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
                  'id': 'ACTIVE'
                },
                'cardAccount': '<ref[15]>',
                'logistics': null,
                'details': [],
                '__id': 17
              }
            ],
            'contract': {
              '__type': 'ru.vtb24.mobilebanking.protocol.product.ComplexServiceContractMto',
              'commissionInterval': null,
              'number': null,
              'id': '8ba067a9-fff9-4ec1-a2c5-9fdb7182a60d',
              'name': 'Мультикарта',
              'displayName': 'Мультикарта',
              'showOnMainPage': null,
              'archived': false,
              'masterAccounts': null,
              'nextCommissionDate': null,
              'status': null,
              'openDate': 'Sat Dec 01 2018 00:00:00 GMT+0300 (MSK)',
              'endDate': null,
              'closeDate': null,
              'contractPeriod': null,
              'details': null
            },
            'overdraft': null,
            'cards': [
              '<ref[17]>'
            ],
            'mainCard': null,
            'status': {
              '__type': 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
              'id': 'OPEN'
            },
            'openDate': 'Wed Mar 16 2016 00:00:00 GMT+0300 (MSK)',
            'lastOperationDate': null,
            'closeDate': null,
            'amount': {
              '__type': 'ru.vtb24.mobilebanking.protocol.AmountMto',
              'sum': 100000,
              'currency': {
                '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                'currencyCode': 'RUR',
                'name': 'Рубль России',
                'displaySymbol': '₽'
              }
            },
            'details': [
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'Наименование Банка получателя',
                'name': 'Филиал № 7701 Банка ВТБ (публичное акционерное общество) в г. Москве'
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'БИК Банка получателя',
                'name': '044525745'
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'ИНН Банка получателя',
                'name': '7702070139'
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'К/С Банка получателя',
                'name': '30101810345250000745'
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'Получатель',
                'name': 'Фамильев Имь Отчевич'
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'Счет получателя в банке получателя',
                'name': '40817800000000008765'
              }
            ]
          },
          'transactionDate': 'Mon Apr 01 2019 09:40:35 GMT+0300 (MSK)',
          'processedDate': '2019-04-01T06:40:35.000Z',
          'transactionAmount': {
            '__type': 'ru.vtb24.mobilebanking.protocol.AmountMto',
            'sum': 15050.39,
            'currency': {
              '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
              'currencyCode': 'RUR',
              'name': 'Рубль России',
              'displaySymbol': '₽'
            }
          },
          'feeAmount': null,
          'order': {
            '__type': 'ru.vtb24.mobilebanking.protocol.OrderMto',
            'id': '929937953',
            'orderId': 929937953,
            'description': 'Перевод на счет *8765',
            'pending': false,
            'ignoreLimits': false,
            'canBeExecuted': true,
            'statusName': null,
            'creationDate': 'Mon Apr 01 2019 09:41:14 GMT+0300 (MSK)',
            'completionDate': 'Mon Apr 01 2019 09:41:21 GMT+0300 (MSK)',
            'amount': {
              '__type': 'ru.vtb24.mobilebanking.protocol.AmountMto',
              'sum': 15050.39,
              'currency': {
                '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                'currencyCode': 'RUR',
                'name': 'Рубль России',
                'displaySymbol': '₽'
              }
            },
            'operationInfo': {
              '__type': 'ru.vtb24.mobilebanking.protocol.operation.OperationInfoMto',
              'id': '9775',
              'enabled': true,
              'name': 'Между своими счетами / обмен валюты',
              'shortName': 'Перевод между своими счетами',
              'description': 'Переводы между собственными счетами и картами в рублях, валюте, а также обмен валюты. Курс обмена будет отображен сразу после выбора счетов /карт в разной валюте. При совершении операций с мультивалютных карт курсы валют вы можете узнать на сайте банка. Обращаем внимание: при переводе с банковской карты за счет кредитных средств или овердрафта взимается комиссия, которая с 01.10.2015 составляет 5,5% (мин. 300 рублей).',
              'placeholder': null,
              'sortOrder': 0,
              'categoryId': '46'
            },
            'status': null
          },
          'status': {
            '__type': 'ru.vtb24.mobilebanking.protocol.StatusMto',
            'id': 'SUCCESS'
          }
        }
      },
      {
        'accountId': '89B64934B76642258E2D8425BB5676F7',
        'apiTransaction': {
          '__type': 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto',
          'id': '1dazd2Fi6tLxHa9p4TxgHeRomLY=;TH0piJ8HUlUezsvEDesFvOChZSs=',
          'details': 'Зачисление со счета *8765',
          'isHold': false,
          'statusName': 'Исполнено',
          'transactionAmountInAccountCurrency': {
            '__type': 'ru.vtb24.mobilebanking.protocol.AmountMto',
            'sum': 15050.39,
            'currency': {
              '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
              'currencyCode': 'RUR',
              'name': 'Рубль России',
              'displaySymbol': '₽'
            }
          },
          'debet': {
            '__type': 'ru.vtb24.mobilebanking.protocol.product.CreditCardAccountMto',
            'creditLimit': 100000,
            'number': '427230******2358',
            'id': '89B64934B76642258E2D8425BB5676F7',
            'name': 'Gold',
            'displayName': 'Gold',
            'showOnMainPage': true,
            'archived': false,
            'loanInfo': {
              '__type': 'ru.vtb24.mobilebanking.protocol.product.LoanInfoMto',
              'interestRate': 26,
              'totalLiability': 0,
              'loanRest': null,
              'currentLiability': 0,
              'currentInterest': null,
              'pastDueTotal': 0,
              'pastDueLiability': 0,
              'pastDueLiabilityPenalty': 0,
              'pastDueInterest': 0,
              'pastDueInterestPenalty': 0,
              'repaymentSum': 0,
              'accruedInterest': 0,
              'minAmountForRepayment': 0,
              'overLimit': 0,
              'overLimitPenalty': 0,
              'graceAmountForRepayment': 0,
              'repaymentDate': 'Mon Apr 22 2019 00:00:00 GMT+0300 (MSK)',
              'repaymentEndDate': null,
              'limitEndDate': 'Tue Dec 01 2048 00:00:00 GMT+0300 (MSK)',
              'graceEndDate': 'Mon Apr 22 2019 00:00:00 GMT+0300 (MSK)',
              'repaymentSource': null
            },
            '__id': 21,
            'cards': [
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.product.CreditCardMto',
                'number': '427230******2358',
                'brandName': 'Visa',
                'embossed': 'CARDHOLDER NAME',
                'cardHolder': 'Фамильев И.О.',
                'isAuthenticationalCard': false,
                'coBrandName': null,
                'isEmitedForOwner': true,
                'shortNumber': '427230******2358',
                'icon': 'Muylticard-VTB',
                'cardHolderLastName': 'Фамильев',
                'cardHolderFirstName': 'Имь',
                'cardHolderPatronymic': 'Отчевич',
                'nameOnCard': null,
                'statusDisplayName': 'Активна',
                'isMain': false,
                'hasDependantCards': false,
                'id': '61A8241B9F3942B0930CBE1C8131C614',
                'name': 'Gold',
                'displayName': 'Gold',
                'showOnMainPage': true,
                'archived': false,
                'issueDate': 'Sat Dec 01 2018 00:00:00 GMT+0300 (MSK)',
                'expireDate': 'Fri Dec 31 2021 00:00:00 GMT+0300 (MSK)',
                'baseCurrency': {
                  '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                  'currencyCode': 'RUR',
                  'name': 'Рубль России',
                  'displaySymbol': '₽'
                },
                'limits': null,
                'balance': {
                  '__type': 'ru.vtb24.mobilebanking.protocol.product.CardBalanceMto',
                  'amountSum': -1179,
                  'allowedSum': 98821,
                  'authorizedSum': 1179,
                  'balanceDate': null
                },
                'lockedDate': null,
                'status': {
                  '__type': 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
                  'id': 'ACTIVE'
                },
                '__id': 17,
                'cardAccount': {
                  '__type': 'ru.vtb24.mobilebanking.protocol.product.CreditCardAccountMto',
                  'creditLimit': 100000,
                  'number': '427230******2358',
                  'id': '89B64934B76642258E2D8425BB5676F7',
                  'name': 'Gold',
                  'displayName': 'Gold',
                  'showOnMainPage': true,
                  'archived': false,
                  'loanInfo': {
                    '__type': 'ru.vtb24.mobilebanking.protocol.product.LoanInfoMto',
                    'interestRate': 26,
                    'totalLiability': 0,
                    'loanRest': null,
                    'currentLiability': 0,
                    'currentInterest': null,
                    'pastDueTotal': 0,
                    'pastDueLiability': 0,
                    'pastDueLiabilityPenalty': 0,
                    'pastDueInterest': 0,
                    'pastDueInterestPenalty': 0,
                    'repaymentSum': 0,
                    'accruedInterest': 0,
                    'minAmountForRepayment': 0,
                    'overLimit': 0,
                    'overLimitPenalty': 0,
                    'graceAmountForRepayment': 0,
                    'repaymentDate': 'Mon Apr 22 2019 00:00:00 GMT+0300 (MSK)',
                    'repaymentEndDate': null,
                    'limitEndDate': 'Tue Dec 01 2048 00:00:00 GMT+0300 (MSK)',
                    'graceEndDate': 'Mon Apr 22 2019 00:00:00 GMT+0300 (MSK)',
                    'repaymentSource': null
                  },
                  '__id': 21,
                  'cards': [
                    '<ref[17]>',
                    {
                      '__type': 'ru.vtb24.mobilebanking.protocol.product.CreditCardMto',
                      'number': '427230******9876',
                      'brandName': 'Visa',
                      'embossed': ' CARDHOLDER',
                      'cardHolder': 'Фамильев И.О.',
                      'isAuthenticationalCard': false,
                      'coBrandName': null,
                      'isEmitedForOwner': true,
                      'shortNumber': '427230******9876',
                      'icon': 'Muylticard-VTB',
                      'cardHolderLastName': 'Фамильев',
                      'cardHolderFirstName': 'Имь',
                      'cardHolderPatronymic': 'Отчевич',
                      'nameOnCard': null,
                      'statusDisplayName': 'Активна',
                      'isMain': false,
                      'hasDependantCards': false,
                      'id': '887D0EF7CEFC449A95E1083A79DE7907',
                      'name': 'карта Instant Issue',
                      'displayName': 'карта Instant Issue',
                      'showOnMainPage': true,
                      'archived': false,
                      'issueDate': 'Thu Oct 11 2018 00:00:00 GMT+0300 (MSK)',
                      'expireDate': 'Tue Oct 31 2023 00:00:00 GMT+0300 (MSK)',
                      'baseCurrency': {
                        '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                        'currencyCode': 'RUR',
                        'name': 'Рубль России',
                        'displaySymbol': '₽'
                      },
                      'limits': null,
                      'balance': {
                        '__type': 'ru.vtb24.mobilebanking.protocol.product.CardBalanceMto',
                        'amountSum': -1179,
                        'allowedSum': 98821,
                        'authorizedSum': 1179,
                        'balanceDate': null
                      },
                      'lockedDate': null,
                      'status': {
                        '__type': 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
                        'id': 'ACTIVE'
                      },
                      'cardAccount': '<ref[21]>',
                      'logistics': null,
                      'details': null,
                      '__id': 24
                    }
                  ],
                  'mainCard': '<ref[17]>',
                  'status': {
                    '__type': 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
                    'id': 'OPEN'
                  },
                  'openDate': 'Sat Dec 01 2018 00:00:00 GMT+0300 (MSK)',
                  'lastOperationDate': null,
                  'closeDate': null,
                  'amount': {
                    '__type': 'ru.vtb24.mobilebanking.protocol.AmountMto',
                    'sum': -1179,
                    'currency': {
                      '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                      'currencyCode': 'RUR',
                      'name': 'Рубль России',
                      'displaySymbol': '₽'
                    }
                  },
                  'details': [
                    {
                      '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      'id': 'Наименование Банка получателя',
                      'name': 'Филиал № 7701 Банка ВТБ (публичное акционерное общество) в г. Москве'
                    },
                    {
                      '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      'id': 'Адрес Банка получателя',
                      'name': '101000, г.Москва, ул.Мясницкая, д.35'
                    },
                    {
                      '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      'id': 'ИНН Банка получателя',
                      'name': '7702070139'
                    },
                    {
                      '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      'id': 'БИК Банка получателя',
                      'name': '044525745'
                    },
                    {
                      '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      'id': 'К/С Банка получателя',
                      'name': '30101810345250000745'
                    },
                    {
                      '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      'id': 'Получатель',
                      'name': 'Счет для пополнений/списаний с банковских карт'
                    },
                    {
                      '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      'id': 'Счет получателя в Банке получателя',
                      'name': '30232810481100000009'
                    },
                    {
                      '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      'id': 'Назначение платежа',
                      'name': 'Для зачисления на карту (номер карты) Фамильев Имь Отчевич'
                    },
                    {
                      '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      'id': 'Примечание',
                      'name': 'Обращаем Ваше внимание, для перевода средств на пластиковые карты в реквизитах необходимо указывать полный номер пластиковой карты, в противном случае зачисление на карту не происходит. Полный номер карты указан непосредственно на карте, за исключением банковских карт Visa Electron.'
                    }
                  ]
                },
                'logistics': null,
                'details': [
                  {
                    '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                    'id': 'Наименование Банка получателя',
                    'name': 'Филиал № 7701 Банка ВТБ (публичное акционерное общество) в г. Москве'
                  },
                  {
                    '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                    'id': 'Адрес Банка получателя',
                    'name': '101000, г.Москва, ул.Мясницкая, д.35'
                  },
                  {
                    '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                    'id': 'ИНН Банка получателя',
                    'name': '7702070139'
                  },
                  {
                    '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                    'id': 'БИК Банка получателя',
                    'name': '044525745'
                  },
                  {
                    '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                    'id': 'К/С Банка получателя',
                    'name': '30101810345250000745'
                  },
                  {
                    '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                    'id': 'Получатель',
                    'name': 'Счет для пополнений/списаний с банковских карт'
                  },
                  {
                    '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                    'id': 'Счет получателя в Банке получателя',
                    'name': '30232810481100000009'
                  },
                  {
                    '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                    'id': 'Назначение платежа',
                    'name': 'Для зачисления на карту (номер карты) Фамильев Имь Отчевич'
                  },
                  {
                    '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                    'id': 'Примечание',
                    'name': 'Обращаем Ваше внимание, для перевода средств на пластиковые карты в реквизитах необходимо указывать полный номер пластиковой карты, в противном случае зачисление на карту не происходит. Полный номер карты указан непосредственно на карте, за исключением банковских карт Visa Electron.'
                  }
                ]
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.product.CreditCardMto',
                'number': '427230******9876',
                'brandName': 'Visa',
                'embossed': ' CARDHOLDER',
                'cardHolder': 'Фамильев И.О.',
                'isAuthenticationalCard': false,
                'coBrandName': null,
                'isEmitedForOwner': true,
                'shortNumber': '427230******9876',
                'icon': 'Muylticard-VTB',
                'cardHolderLastName': 'Фамильев',
                'cardHolderFirstName': 'Имь',
                'cardHolderPatronymic': 'Отчевич',
                'nameOnCard': null,
                'statusDisplayName': 'Активна',
                'isMain': false,
                'hasDependantCards': false,
                'id': '887D0EF7CEFC449A95E1083A79DE7907',
                'name': 'карта Instant Issue',
                'displayName': 'карта Instant Issue',
                'showOnMainPage': true,
                'archived': false,
                'issueDate': 'Thu Oct 11 2018 00:00:00 GMT+0300 (MSK)',
                'expireDate': 'Tue Oct 31 2023 00:00:00 GMT+0300 (MSK)',
                'baseCurrency': {
                  '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                  'currencyCode': 'RUR',
                  'name': 'Рубль России',
                  'displaySymbol': '₽'
                },
                'limits': null,
                'balance': {
                  '__type': 'ru.vtb24.mobilebanking.protocol.product.CardBalanceMto',
                  'amountSum': -1179,
                  'allowedSum': 98821,
                  'authorizedSum': 1179,
                  'balanceDate': null
                },
                'lockedDate': null,
                'status': {
                  '__type': 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
                  'id': 'ACTIVE'
                },
                'cardAccount': '<ref[21]>',
                'logistics': null,
                'details': null,
                '__id': 24
              }
            ],
            'mainCard': '<ref[17]>',
            'status': {
              '__type': 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
              'id': 'OPEN'
            },
            'openDate': 'Sat Dec 01 2018 00:00:00 GMT+0300 (MSK)',
            'lastOperationDate': null,
            'closeDate': null,
            'amount': {
              '__type': 'ru.vtb24.mobilebanking.protocol.AmountMto',
              'sum': -1179,
              'currency': {
                '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                'currencyCode': 'RUR',
                'name': 'Рубль России',
                'displaySymbol': '₽'
              }
            },
            'details': [
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'Наименование Банка получателя',
                'name': 'Филиал № 7701 Банка ВТБ (публичное акционерное общество) в г. Москве'
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'Адрес Банка получателя',
                'name': '101000, г.Москва, ул.Мясницкая, д.35'
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'ИНН Банка получателя',
                'name': '7702070139'
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'БИК Банка получателя',
                'name': '044525745'
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'К/С Банка получателя',
                'name': '30101810345250000745'
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'Получатель',
                'name': 'Счет для пополнений/списаний с банковских карт'
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'Счет получателя в Банке получателя',
                'name': '30232810481100000009'
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'Назначение платежа',
                'name': 'Для зачисления на карту (номер карты) Фамильев Имь Отчевич'
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'Примечание',
                'name': 'Обращаем Ваше внимание, для перевода средств на пластиковые карты в реквизитах необходимо указывать полный номер пластиковой карты, в противном случае зачисление на карту не происходит. Полный номер карты указан непосредственно на карте, за исключением банковских карт Visa Electron.'
              }
            ]
          },
          'transactionDate': 'Mon Apr 01 2019 09:52:27 GMT+0300 (MSK)',
          'processedDate': '2019-03-31T21:00:00.000Z',
          'transactionAmount': {
            '__type': 'ru.vtb24.mobilebanking.protocol.AmountMto',
            'sum': 15050.39,
            'currency': {
              '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
              'currencyCode': 'RUR',
              'name': 'Рубль России',
              'displaySymbol': '₽'
            }
          },
          'feeAmount': {
            '__type': 'ru.vtb24.mobilebanking.protocol.AmountMto',
            'sum': 0,
            'currency': {
              '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
              'currencyCode': 'RUR',
              'name': 'Рубль России',
              'displaySymbol': '₽'
            }
          },
          'order': {
            '__type': 'ru.vtb24.mobilebanking.protocol.OrderMto',
            'id': '929956251',
            'orderId': 929956251,
            'description': 'Перевод на счет *9876',
            'pending': false,
            'ignoreLimits': false,
            'canBeExecuted': true,
            'statusName': null,
            'creationDate': 'Mon Apr 01 2019 09:52:23 GMT+0300 (MSK)',
            'completionDate': 'Mon Apr 01 2019 09:52:29 GMT+0300 (MSK)',
            'amount': {
              '__type': 'ru.vtb24.mobilebanking.protocol.AmountMto',
              'sum': 15050.39,
              'currency': {
                '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                'currencyCode': 'RUR',
                'name': 'Рубль России',
                'displaySymbol': '₽'
              }
            },
            'operationInfo': {
              '__type': 'ru.vtb24.mobilebanking.protocol.operation.OperationInfoMto',
              'id': '9775',
              'enabled': true,
              'name': 'Между своими счетами / обмен валюты',
              'shortName': 'Перевод между своими счетами',
              'description': 'Переводы между собственными счетами и картами в рублях, валюте, а также обмен валюты. Курс обмена будет отображен сразу после выбора счетов /карт в разной валюте. При совершении операций с мультивалютных карт курсы валют вы можете узнать на сайте банка. Обращаем внимание: при переводе с банковской карты за счет кредитных средств или овердрафта взимается комиссия, которая с 01.10.2015 составляет 5,5% (мин. 300 рублей).',
              'placeholder': null,
              'sortOrder': 0,
              'categoryId': '46'
            },
            'status': null
          },
          'status': {
            '__type': 'ru.vtb24.mobilebanking.protocol.StatusMto',
            'id': 'SUCCESS'
          }
        }
      },
      {
        'accountId': 'FEEC72204C93471DAE7A73F7F87E2B04',
        'apiTransaction': {
          '__type': 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto',
          'id': '0tGcRLJYTo972P3k0LSStz+MjXA=;5FPNg3V4bGvdij7CPKsF/4BRwuU=',
          'details': 'Перевод денежных средств по картам Банка    ',
          'isHold': false,
          'statusName': null,
          'transactionAmountInAccountCurrency': {
            '__type': 'ru.vtb24.mobilebanking.protocol.AmountMto',
            'sum': -15050.39,
            'currency': {
              '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
              'currencyCode': 'RUR',
              'name': 'Рубль России',
              'displaySymbol': '₽'
            }
          },
          'debet': {
            '__type': 'ru.vtb24.mobilebanking.protocol.product.DebitCardAccountMto',
            'number': '220065******1234',
            'id': 'FEEC72204C93471DAE7A73F7F87E2B04',
            'name': 'Зарплатная карта "Люди дела"',
            'displayName': 'Зарплатная карта "Люди дела"',
            'showOnMainPage': true,
            'archived': false,
            'cards': [
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.product.DebitCardMto',
                'number': '220065******1234',
                'brandName': 'МИР Классическая',
                'embossed': 'CARDHOLDER NAME',
                'cardHolder': 'Фамильев Имь Отчевич',
                'isAuthenticationalCard': false,
                'coBrandName': null,
                'isEmitedForOwner': true,
                'shortNumber': '220065******1234',
                'icon': 'MBank_Card',
                'cardHolderLastName': null,
                'cardHolderFirstName': null,
                'cardHolderPatronymic': null,
                'nameOnCard': null,
                'statusDisplayName': 'Активна',
                'isMain': false,
                'hasDependantCards': false,
                'id': 'F17FC14E8EDE4F42BBEE9A99D7CA23D1',
                'name': 'Зарплатная карта "Люди дела"',
                'displayName': 'Зарплатная карта "Люди дела"',
                'showOnMainPage': true,
                'archived': false,
                'overdraft': {
                  '__type': 'ru.vtb24.mobilebanking.protocol.product.OverdraftMto',
                  'interestRate': 0,
                  'interest': null,
                  'minAmountMtoForRepayment': null,
                  'overdraftLimit': {
                    '__type': 'ru.vtb24.mobilebanking.protocol.AmountMto',
                    'sum': 0,
                    'currency': {
                      '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                      'currencyCode': 'RUR',
                      'name': 'Рубль России',
                      'displaySymbol': '₽'
                    }
                  },
                  'ownBalance': null,
                  'pastDueInterest': null,
                  'pastDueLiability': null,
                  'pastDueLiabilityPenalty': null,
                  'pastDueTotal': null,
                  'planningPaymentDate': null,
                  'principalDebt': null,
                  'technicalOverdraft': null,
                  'technicalOverdraftPenalty': null,
                  'totalAmountMtoForRepayment': null,
                  'unusedOverdraftLimit': null
                },
                'issueDate': 'Tue Oct 10 2017 00:00:00 GMT+0300 (MSK)',
                'expireDate': 'Sat Oct 31 2020 00:00:00 GMT+0300 (MSK)',
                'baseCurrency': {
                  '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                  'currencyCode': 'RUR',
                  'name': 'Рубль России',
                  'displaySymbol': '₽'
                },
                'limits': null,
                'balance': {
                  '__type': 'ru.vtb24.mobilebanking.protocol.product.CardBalanceMto',
                  'amountSum': 21915.66,
                  'allowedSum': 21915.66,
                  'authorizedSum': 6032.32,
                  'balanceDate': null
                },
                'lockedDate': null,
                'status': {
                  '__type': 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
                  'id': 'ACTIVE'
                },
                '__id': 17,
                'cardAccount': {
                  '__type': 'ru.vtb24.mobilebanking.protocol.product.DebitCardAccountMto',
                  'number': '220065******1234',
                  'id': 'FEEC72204C93471DAE7A73F7F87E2B04',
                  'name': 'Зарплатная карта "Люди дела"',
                  'displayName': 'Зарплатная карта "Люди дела"',
                  'showOnMainPage': true,
                  'archived': false,
                  'cards': [
                    '<ref[17]>'
                  ],
                  'mainCard': '<ref[17]>',
                  'status': {
                    '__type': 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
                    'id': 'OPEN'
                  },
                  'openDate': 'Tue Oct 10 2017 00:00:00 GMT+0300 (MSK)',
                  'lastOperationDate': null,
                  'closeDate': null,
                  'amount': {
                    '__type': 'ru.vtb24.mobilebanking.protocol.AmountMto',
                    'sum': 21915.66,
                    'currency': {
                      '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                      'currencyCode': 'RUR',
                      'name': 'Рубль России',
                      'displaySymbol': '₽'
                    }
                  },
                  'details': [
                    {
                      '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      'id': 'Наименование Банка получателя',
                      'name': 'Филиал «Центральный» Банка ВТБ (публичное акционерное общество) в г. Москве (Филиал «Центральный» Банка ВТБ (ПАО))'
                    },
                    {
                      '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      'id': 'ИНН Банка получателя',
                      'name': '7702070139 '
                    },
                    {
                      '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      'id': 'КПП Банка получателя',
                      'name': '770943002 '
                    },
                    {
                      '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      'id': 'БИК Банка получателя',
                      'name': '044525411'
                    },
                    {
                      '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      'id': 'К/С Банка получателя',
                      'name': '№ 30101810145250000411 в Отделении 1 Главного управления Центрального банка Российской Федерации по Центральному федеральному округу г. Москва'
                    },
                    {
                      '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      'id': 'Счет получателя в банке получателя',
                      'name': '30232 810 7 0000 2000004'
                    },
                    {
                      '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                      'id': 'Назначение платежа',
                      'name': 'В назначении платежа необходимо указать Фамилию, имя, отчество и № карты (16 знаков) получателя'
                    }
                  ]
                },
                'logistics': null,
                'details': [
                  {
                    '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                    'id': 'Наименование Банка получателя',
                    'name': 'Филиал «Центральный» Банка ВТБ (публичное акционерное общество) в г. Москве (Филиал «Центральный» Банка ВТБ (ПАО))'
                  },
                  {
                    '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                    'id': 'ИНН Банка получателя',
                    'name': '7702070139 '
                  },
                  {
                    '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                    'id': 'КПП Банка получателя',
                    'name': '770943002 '
                  },
                  {
                    '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                    'id': 'БИК Банка получателя',
                    'name': '044525411'
                  },
                  {
                    '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                    'id': 'К/С Банка получателя',
                    'name': '№ 30101810145250000411 в Отделении 1 Главного управления Центрального банка Российской Федерации по Центральному федеральному округу г. Москва'
                  },
                  {
                    '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                    'id': 'Счет получателя в банке получателя',
                    'name': '30232 810 7 0000 2000004'
                  },
                  {
                    '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                    'id': 'Назначение платежа',
                    'name': 'В назначении платежа необходимо указать Фамилию, имя, отчество и № карты (16 знаков) получателя'
                  }
                ]
              }
            ],
            'mainCard': '<ref[17]>',
            'status': {
              '__type': 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
              'id': 'OPEN'
            },
            'openDate': 'Tue Oct 10 2017 00:00:00 GMT+0300 (MSK)',
            'lastOperationDate': null,
            'closeDate': null,
            'amount': {
              '__type': 'ru.vtb24.mobilebanking.protocol.AmountMto',
              'sum': 21915.66,
              'currency': {
                '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                'currencyCode': 'RUR',
                'name': 'Рубль России',
                'displaySymbol': '₽'
              }
            },
            'details': [
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'Наименование Банка получателя',
                'name': 'Филиал «Центральный» Банка ВТБ (публичное акционерное общество) в г. Москве (Филиал «Центральный» Банка ВТБ (ПАО))'
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'ИНН Банка получателя',
                'name': '7702070139 '
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'КПП Банка получателя',
                'name': '770943002 '
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'БИК Банка получателя',
                'name': '044525411'
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'К/С Банка получателя',
                'name': '№ 30101810145250000411 в Отделении 1 Главного управления Центрального банка Российской Федерации по Центральному федеральному округу г. Москва'
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'Счет получателя в банке получателя',
                'name': '30232 810 7 0000 2000004'
              },
              {
                '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
                'id': 'Назначение платежа',
                'name': 'В назначении платежа необходимо указать Фамилию, имя, отчество и № карты (16 знаков) получателя'
              }
            ]
          },
          'transactionDate': 'Mon Apr 01 2019 09:41:17 GMT+0300 (MSK)',
          'processedDate': '2019-03-31T21:00:00.000Z',
          'transactionAmount': {
            '__type': 'ru.vtb24.mobilebanking.protocol.AmountMto',
            'sum': -15050.39,
            'currency': {
              '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
              'currencyCode': 'RUR',
              'name': 'Рубль России',
              'displaySymbol': '₽'
            }
          },
          'feeAmount': null,
          'order': null,
          'status': {
            '__type': 'ru.vtb24.mobilebanking.protocol.StatusMto',
            'id': 'SUCCESS'
          }
        }
      }
    ]

    const movement = {
      'accountId': '14A32BB15CB74A528AD385BEC4F172C6',
      'apiTransaction': {
        '__type': 'ru.vtb24.mobilebanking.protocol.statement.AccountTransactionMto',
        'id': '3nCFmhkFvhsJ/SGkqkFT0WkLE6I=;hpethepaKlZM2XFWUCJrl/E2ASA=',
        'details': 'Зачисление со счета *1234',
        'isHold': false,
        'statusName': 'Исполнено',
        'debet': {
          '__type': 'ru.vtb24.mobilebanking.protocol.product.MasterAccountMto',
          'isDefault': true,
          'number': '40817800000000008765',
          'id': '14A32BB15CB74A528AD385BEC4F172C6',
          'name': 'Мастер счет в рублях',
          'displayName': 'Мастер счет в рублях',
          'showOnMainPage': true,
          'archived': false,
          '__id': 15,
          'masterAccountCards': [
            {
              '__type': 'ru.vtb24.mobilebanking.protocol.product.MasterAccountCardMto',
              'number': '536829******4321',
              'brandName': 'MasterCard',
              'embossed': 'CARDHOLDER NAME',
              'cardHolder': 'CARDHOLDER NAME',
              'isAuthenticationalCard': false,
              'coBrandName': null,
              'isEmitedForOwner': true,
              'shortNumber': '536829******4321',
              'icon': 'Muylticard-VTB',
              'cardHolderLastName': null,
              'cardHolderFirstName': null,
              'cardHolderPatronymic': null,
              'nameOnCard': null,
              'statusDisplayName': 'Активна',
              'isMain': false,
              'hasDependantCards': false,
              'id': '701671471E9B4CB9946262DD2E853C6B',
              'name': 'Мультикарта',
              'displayName': 'Мультикарта',
              'showOnMainPage': true,
              'archived': false,
              'overdraft': null,
              'issueDate': 'Tue Aug 28 2018 00:00:00 GMT+0300 (MSK)',
              'expireDate': 'Tue Aug 31 2021 00:00:00 GMT+0300 (MSK)',
              'baseCurrency': {
                '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                'currencyCode': 'RUR',
                'name': 'Рубль России',
                'displaySymbol': '₽'
              },
              'limits': null,
              'balance': {
                '__type': 'ru.vtb24.mobilebanking.protocol.product.CardBalanceMto',
                'amountSum': 100000,
                'allowedSum': 100000,
                'authorizedSum': 0,
                'balanceDate': null
              },
              'lockedDate': null,
              'status': {
                '__type': 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
                'id': 'ACTIVE'
              },
              'cardAccount': '<ref[15]>',
              'logistics': null,
              'details': [],
              '__id': 17
            }
          ],
          'contract': {
            '__type': 'ru.vtb24.mobilebanking.protocol.product.ComplexServiceContractMto',
            'commissionInterval': null,
            'number': null,
            'id': '8ba067a9-fff9-4ec1-a2c5-9fdb7182a60d',
            'name': 'Мультикарта',
            'displayName': 'Мультикарта',
            'showOnMainPage': null,
            'archived': false,
            'masterAccounts': null,
            'nextCommissionDate': null,
            'status': null,
            'openDate': 'Sat Dec 01 2018 00:00:00 GMT+0300 (MSK)',
            'endDate': null,
            'closeDate': null,
            'contractPeriod': null,
            'details': null
          },
          'overdraft': null,
          'cards': [
            '<ref[17]>'
          ],
          'mainCard': null,
          'status': {
            '__type': 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
            'id': 'OPEN'
          },
          'openDate': 'Wed Mar 16 2016 00:00:00 GMT+0300 (MSK)',
          'lastOperationDate': null,
          'closeDate': null,
          'amount': {
            '__type': 'ru.vtb24.mobilebanking.protocol.AmountMto',
            'sum': 100000,
            'currency': {
              '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
              'currencyCode': 'RUR',
              'name': 'Рубль России',
              'displaySymbol': '₽'
            }
          },
          'details': [
            {
              '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
              'id': 'Наименование Банка получателя',
              'name': 'Филиал № 7701 Банка ВТБ (публичное акционерное общество) в г. Москве'
            },
            {
              '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
              'id': 'БИК Банка получателя',
              'name': '044525745'
            },
            {
              '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
              'id': 'ИНН Банка получателя',
              'name': '7702070139'
            },
            {
              '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
              'id': 'К/С Банка получателя',
              'name': '30101810345250000745'
            },
            {
              '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
              'id': 'Получатель',
              'name': 'Фамильев Имь Отчевич'
            },
            {
              '__type': 'ru.vtb24.mobilebanking.protocol.item.ItemMto',
              'id': 'Счет получателя в банке получателя',
              'name': '40817800000000008765'
            }
          ]
        },
        'transactionDate': 'Mon Apr 01 2019 09:40:35 GMT+0300 (MSK)',
        'processedDate': '2019-04-01T06:40:35.000Z',
        'transactionAmount': {
          '__type': 'ru.vtb24.mobilebanking.protocol.AmountMto',
          'sum': 15050.39,
          'currency': {
            '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
            'currencyCode': 'RUR',
            'name': 'Рубль России',
            'displaySymbol': '₽'
          }
        },
        'feeAmount': null,
        'order': {
          '__type': 'ru.vtb24.mobilebanking.protocol.OrderMto',
          'id': '929937953',
          'orderId': 929937953,
          'description': 'Перевод на счет *8765',
          'pending': false,
          'ignoreLimits': false,
          'canBeExecuted': true,
          'statusName': null,
          'creationDate': 'Mon Apr 01 2019 09:41:14 GMT+0300 (MSK)',
          'completionDate': 'Mon Apr 01 2019 09:41:21 GMT+0300 (MSK)',
          'amount': {
            '__type': 'ru.vtb24.mobilebanking.protocol.AmountMto',
            'sum': 15050.39,
            'currency': {
              '__type': 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
              'currencyCode': 'RUR',
              'name': 'Рубль России',
              'displaySymbol': '₽'
            }
          },
          'operationInfo': {
            '__type': 'ru.vtb24.mobilebanking.protocol.operation.OperationInfoMto',
            'id': '9775',
            'enabled': true,
            'name': 'Между своими счетами / обмен валюты',
            'shortName': 'Перевод между своими счетами',
            'description': 'Переводы между собственными счетами и картами в рублях, валюте, а также обмен валюты. Курс обмена будет отображен сразу после выбора счетов /карт в разной валюте. При совершении операций с мультивалютных карт курсы валют вы можете узнать на сайте банка. Обращаем внимание: при переводе с банковской карты за счет кредитных средств или овердрафта взимается комиссия, которая с 01.10.2015 составляет 5,5% (мин. 300 рублей).',
            'placeholder': null,
            'sortOrder': 0,
            'categoryId': '46'
          },
          'status': null
        },
        'status': {
          '__type': 'ru.vtb24.mobilebanking.protocol.StatusMto',
          'id': 'SUCCESS'
        }
      }
    }

    const assertion = composeReferencedMovement({ movement, relatedMovements })
    const expectation = {
      ...movement,
      apiTransaction: {
        ...movement.apiTransaction,
        incomeTransaction: relatedMovements[1].apiTransaction,
        outcomeTransaction: relatedMovements[3].apiTransaction
      }
    }

    expect(assertion).toEqual(expectation)
  })
})
