import { convertAccount, convertLoan, convertTransaction } from './converters'

describe('convertAccount', () => {
  it('converts account without card', () => {
    expect(convertAccount({
      __type: 'ru.vtb24.mobilebanking.protocol.product.MasterAccountMto',
      amount: {
        __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
        sum: 0,
        currency: {
          __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
          currencyCode: 'USD',
          displaySymbol: '$',
          name: 'Доллар США'
        }
      },
      archived: false,
      cards: [],
      closeDate: null,
      contract: null,
      details: null,
      displayName: 'Мастер счет в долларах США',
      id: 'AA18315EBD4647C990492F812629D493',
      isDefault: true,
      lastOperationDate: null,
      mainCard: null,
      masterAccountCards: [],
      name: 'Мастер счет в долларах США',
      number: '40817850403664002913',
      openDate: new Date('Sat Dec 12 2015 00:00:00 GMT+0300'),
      overdraft: null,
      showOnMainPage: true,
      status: {
        __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
        id: 'OPEN'
      }
    })).toEqual({
      id: 'AA18315EBD4647C990492F812629D493',
      type: 'ru.vtb24.mobilebanking.protocol.product.MasterAccountMto',
      zenAccount: {
        id: 'AA18315EBD4647C990492F812629D493',
        type: 'checking',
        title: 'Мастер счет в долларах США',
        instrument: 'USD',
        balance: 0,
        syncID: [
          '40817850403664002913'
        ]
      }
    })
  })

  it('converts account with a card', () => {
    expect(convertAccount({
      __type: 'ru.vtb24.mobilebanking.protocol.product.MasterAccountMto',
      amount: null,
      archived: false,
      closeDate: null,
      contract: null,
      details: null,
      displayName: 'Мастер счет в рублях',
      id: 'F71710FBFC614CC29030ACF227509AA1',
      isDefault: true,
      lastOperationDate: null,
      mainCard: null,
      cards: [
        {
          archived: false,
          balance: {
            __type: 'ru.vtb24.mobilebanking.protocol.product.CardBalanceMto',
            amountSum: 10000.97,
            allowedSum: 10000.97,
            authorizedSum: 0,
            balanceDate: null
          },
          baseCurrency: {
            __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
            currencyCode: 'RUR',
            name: 'Рубль России',
            displaySymbol: '₽'
          },
          brandName: 'MasterCard',
          cardAccount: null,
          cardHolder: null,
          cardHolderFirstName: null,
          cardHolderLastName: null,
          cardHolderPatronymic: null,
          coBrandName: null,
          details: null,
          displayName: 'Black Edition',
          embossed: null,
          expireDate: new Date('Thu Feb 28 2019 00:00:00 GMT+0300'),
          hasDependantCards: false,
          icon: 'MasterCard_World_Elite',
          id: '4E40E49C08C24A3F85100C31F9BD6B43',
          isAuthenticationalCard: false,
          isEmitedForOwner: true,
          isMain: false,
          issueDate: new Date('Wed Feb 17 2016 00:00:00 GMT+0300'),
          limits: null,
          lockedDate: null,
          logistics: null,
          name: 'Black Edition',
          nameOnCard: null,
          number: '522298XXXXXX6732',
          overdraft: null,
          shortNumber: '522298XXXXXX6732',
          showOnMainPage: true,
          status: {
            __type: 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
            id: 'ACTIVE'
          },
          statusDisplayName: 'Активна',
          __type: 'ru.vtb24.mobilebanking.protocol.product.MasterAccountCardMto'
        }
      ],
      name: 'Мастер счет в рублях',
      number: '40917810003263002256',
      openDate: new Date('Sat Dec 12 2015 00:00:00 GMT+0300'),
      overdraft: null,
      showOnMainPage: true,
      status: {
        __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
        id: 'OPEN'
      }
    })).toEqual({
      id: 'F71710FBFC614CC29030ACF227509AA1',
      type: 'ru.vtb24.mobilebanking.protocol.product.MasterAccountMto',
      zenAccount: {
        id: 'F71710FBFC614CC29030ACF227509AA1',
        type: 'ccard',
        title: 'Black Edition',
        instrument: 'RUB',
        balance: 10000.97,
        syncID: [
          '522298******6732',
          '40917810003263002256'
        ]
      }
    })
  })

  it('converts credit card', () => {
    expect(convertAccount({
      __type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardAccountMto',
      amount: {
        __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
        currency: {
          __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
          currencyCode: 'RUR',
          name: 'Рубль России',
          displaySymbol: '₽'
        },
        sum: 78402.88
      },
      archived: false,
      closeDate: null,
      creditLimit: 97000,
      details: null,
      displayName: 'Standard',
      id: '7D3ABFDFF2024BB79D220FA6B8D4DC77',
      lastOperationDate: null,
      loanInfo: null,
      mainCard: null,
      name: 'Standard',
      number: '524543XXXXXX0038',
      openDate: new Date('Mon Dec 07 2015 00:00:00 GMT+0300'),
      showOnMainPage: true,
      status: {
        __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
        id: 'OPEN'
      },
      cards: [
        {

          __type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardMto',
          archived: false,
          balance: {
            __type: 'ru.vtb24.mobilebanking.protocol.product.CardBalanceMto',
            amountSum: -18597.12,
            allowedSum: 78402.88,
            authorizedSum: 255,
            balanceDate: null
          },
          baseCurrency: {
            __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
            currencyCode: 'RUR',
            name: 'Рубль России',
            displaySymbol: '₽'
          },
          brandName: 'MasterCard',
          cardAccount: null,
          cardHolder: 'Николаев Н.Н.',
          cardHolderFirstName: 'Николай',
          cardHolderLastName: 'Николаев',
          cardHolderPatronymic: 'Николаевич',
          coBrandName: null,
          details: null,
          displayName: 'Standard',
          embossed: null,
          expireDate: new Date('Mon Dec 31 2018 00:00:00 GMT+0300'),
          hasDependantCards: false,
          icon: 'MasterCard_Unembossed_Chip',
          id: 'EE270DFC77F64E39B2EC0445200EB087',
          isAuthenticationalCard: false,
          isEmitedForOwner: true,
          isMain: false,
          issueDate: new Date('Mon Dec 07 2015 00:00:00 GMT+0300'),
          limits: null,
          lockedDate: null,
          logistics: null,
          name: 'Standard',
          nameOnCard: null,
          number: '524543XXXXXX0038',
          shortNumber: '524543XXXXXX0038',
          showOnMainPage: true,
          status: {
            __type: 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
            id: 'ACTIVE'
          },
          statusDisplayName: 'Активна'
        }
      ]
    })).toEqual({
      id: 'EE270DFC77F64E39B2EC0445200EB087',
      type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardMto',
      zenAccount: {
        id: 'EE270DFC77F64E39B2EC0445200EB087',
        type: 'ccard',
        title: 'Standard',
        instrument: 'RUB',
        balance: -18597.12,
        creditLimit: 97000,
        syncID: [
          '524543******0038'
        ]
      }
    })
  })

  it('converts several credit cards for one account', () => {
    expect(convertAccount({
      __type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardAccountMto',
      creditLimit: 300000,
      number: '432250XXXXXX7804',
      id: '586375B9033E4CC1ACE9DBE6D343A0E7',
      name: 'Gold',
      displayName: 'Gold',
      showOnMainPage: true,
      archived: false,
      loanInfo: null,
      mainCard: null,
      status: {
        __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
        id: 'OPEN'
      },
      openDate: new Date('Fri Jun 15 2018 00:00:00 GMT+0300'),
      lastOperationDate: null,
      closeDate: null,
      amount: {
        __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
        sum: 268819.65,
        currency: {
          __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
          currencyCode: 'RUR',
          name: 'Рубль России',
          displaySymbol: '₽'
        }
      },
      logistics: null,
      details: null,
      cards: [
        {
          __type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardMto',
          number: '432250XXXXXX7804',
          brandName: 'Visa',
          embossed: null,
          cardHolder: 'Николаев Н.Н.',
          isAuthenticationalCard: false,
          coBrandName: null,
          isEmitedForOwner: true,
          shortNumber: '427230XXXXXX6911',
          icon: 'Muylticard-VTB',
          cardHolderLastName: 'Николаев',
          cardHolderFirstName: 'Николай',
          cardHolderPatronymic: 'Николаевич',
          nameOnCard: null,
          statusDisplayName: 'Активна',
          isMain: false,
          hasDependantCards: false,
          id: '1334A5E71E3249AB9E8ECCE8C6627144',
          name: 'Gold',
          displayName: 'ru_step',
          showOnMainPage: true,
          archived: false,
          issueDate: new Date('Fri Jun 15 2017 00:00:00 GMT+0300'),
          expireDate: new Date('Wed Jun 30 2022 00:00:00 GMT+0300'),
          baseCurrency: {
            __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
            currencyCode: 'RUR',
            name: 'Рубль России',
            displaySymbol: '₽'
          },
          limits: null,
          balance: {
            __type: 'ru.vtb24.mobilebanking.protocol.product.CardBalanceMto',
            amountSum: -31180.35,
            allowedSum: 268819.65,
            authorizedSum: 2129.7,
            balanceDate: null
          },
          lockedDate: null,
          status: {
            __type: 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
            id: 'ACTIVE'
          },
          cardAccount: null,
          logistics: null,
          details: null
        },
        {
          __type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardMto',
          number: '432250XXXXXX2289',
          brandName: 'Visa',
          embossed: null,
          cardHolder: 'Николаева Н.Н.',
          isAuthenticationalCard: false,
          coBrandName: null,
          isEmitedForOwner: false,
          shortNumber: '427230XXXXXX4688',
          icon: 'Muylticard-VTB',
          cardHolderLastName: 'Николаева',
          cardHolderFirstName: 'Нина',
          cardHolderPatronymic: 'Наумовна',
          nameOnCard: null,
          statusDisplayName: 'Активна',
          isMain: false,
          hasDependantCards: false,
          id: '3041EB1B9E47400E9833D2171B640EC1',
          name: 'Gold',
          displayName: 'ru_pip',
          showOnMainPage: false,
          archived: false,
          issueDate: new Date('Sat Jun 23 2017 00:00:00 GMT+0300'),
          expireDate: new Date('Wed Jun 30 2022 00:00:00 GMT+0300'),
          baseCurrency: {
            __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
            currencyCode: 'RUR',
            name: 'Рубль России',
            displaySymbol: '₽' },
          limits: null,
          balance: {
            __type: 'ru.vtb24.mobilebanking.protocol.product.CardBalanceMto',
            amountSum: -31180.35,
            allowedSum: 268819.65,
            authorizedSum: 2129.7,
            balanceDate: null },
          lockedDate: null,
          status: {
            __type: 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
            id: 'ACTIVE'
          },
          cardAccount: null,
          logistics: null,
          details: null
        }
      ]
    })).toEqual([
      {
        id: '1334A5E71E3249AB9E8ECCE8C6627144',
        type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardMto',
        zenAccount: {
          id: '1334A5E71E3249AB9E8ECCE8C6627144',
          type: 'ccard',
          title: 'Gold',
          instrument: 'RUB',
          balance: -31180.35,
          creditLimit: 300000,
          syncID: [
            '432250******7804',
            '432250******2289'
          ]
        }
      },
      {
        id: '3041EB1B9E47400E9833D2171B640EC1',
        type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardMto',
        zenAccount: {
          id: '1334A5E71E3249AB9E8ECCE8C6627144',
          type: 'ccard',
          title: 'Gold',
          instrument: 'RUB',
          balance: -31180.35,
          creditLimit: 300000,
          syncID: [
            '432250******7804',
            '432250******2289'
          ]
        }
      }
    ])
  })

  it('converts savings account', () => {
    expect(convertAccount({
      __type: 'ru.vtb24.mobilebanking.protocol.product.SavingsAccountMto',
      amount: {
        currency: {
          __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
          currencyCode: 'RUR',
          name: 'Рубль России',
          displaySymbol: '₽'
        },
        sum: 0.26,
        __type: 'ru.vtb24.mobilebanking.protocol.AmountMto'
      },
      archived: false,
      closeDate: null,
      details: null,
      displayName: 'Накопительный счет',
      hideTariffsInfo: false,
      id: 'F1ABB1311A944485B984BD2EE933E4A1',
      lastOperationDate: null,
      name: 'Накопительный счет',
      number: '42817110331354007284',
      openDate: new Date('Fri Feb 12 2016 00:00:00 GMT+0300'),
      showOnMainPage: true,
      status: {
        __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
        id: 'OPEN'
      }
    })).toEqual({
      id: 'F1ABB1311A944485B984BD2EE933E4A1',
      type: 'ru.vtb24.mobilebanking.protocol.product.SavingsAccountMto',
      zenAccount: {
        id: 'F1ABB1311A944485B984BD2EE933E4A1',
        type: 'checking',
        title: 'Накопительный счет',
        instrument: 'RUB',
        balance: 0.26,
        savings: true,
        syncID: [
          '42817110331354007284'
        ]
      }
    })
  })

  it('converts adjusted credit line', () => {
    expect(convertAccount({
      __type: 'ru.vtb24.mobilebanking.protocol.product.LoanAccountMto',
      amount: {
        __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
        sum: 0,
        currency: {
          __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
          currencyCode: 'RUR',
          displaySymbol: '₽',
          name: 'Рубль России'
        }
      },
      archived: false,
      closeDate: new Date('Wed Feb 28 2046 00:00:00 GMT+0300'),
      contract: {
        __type: 'ru.vtb24.mobilebanking.protocol.product.RevolvingCreditLineMto',
        account: null,
        archived: false,
        closeDate: null,
        contractPeriod: null,
        creditSum: {
          __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
          sum: 0,
          currency: {
            __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
            currencyCode: 'RUR',
            displaySymbol: '₽',
            name: 'Рубль России'
          }
        },
        details: null,
        displayName: 'Кредитная линия',
        endDate: new Date('Wed Feb 28 2046 00:00:00 GMT+0300'),
        id: '92B38AA965C84BB7A53C00F28F9AD9D5',
        issueDate: new Date('Fri Feb 12 2016 00:00:00 GMT+0300'),
        loan: null,
        name: 'Кредитная линия',
        number: 'Кредитная линия №492321XXXXXX3634',
        openDate: new Date('Fri Feb 12 2016 00:00:00 GMT+0300'),
        showOnMainPage: true,
        status: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.ContractStatusMto',
          id: 'OPEN'
        }
      },
      details: null,
      displayName: 'Кредитная линия',
      id: '5EB0EB482E6D4CF78EF60A5D4425545F',
      lastOperationDate: null,
      name: 'Кредитная линия',
      number: '4923213012683634',
      openDate: new Date('Fri Feb 12 2016 00:00:00 GMT+0300'),
      showOnMainPage: true,
      status: {
        __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
        id: 'OPEN'
      }
    })).toEqual({
      id: '92B38AA965C84BB7A53C00F28F9AD9D5',
      type: 'ru.vtb24.mobilebanking.protocol.product.RevolvingCreditLineMto',
      zenAccount: {
        id: '92B38AA965C84BB7A53C00F28F9AD9D5',
        type: 'checking',
        title: 'Кредитная линия',
        instrument: 'RUB',
        balance: 0,
        syncID: [
          '4923213012683634'
        ]
      }
    })
  })
})

describe('convertLoan', () => {
  it('converts loan', () => {
    expect(convertLoan({
      __type: 'ru.vtb24.mobilebanking.protocol.product.LoanContractMto',
      number: '634/5010-0004540',
      id: '5D1AB7F045F24C8F823CB785CFDC4ADE',
      name: 'Ипотека',
      displayName: 'Ипотека',
      showOnMainPage: true,
      archived: false,
      issueDate: new Date('Mon Aug 07 2017 00:00:00 GMT+0300'),
      creditSum: {
        __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
        sum: 1608000,
        currency: {
          __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
          currencyCode: 'RUR',
          name: 'Рубль России',
          displaySymbol: '₽'
        }
      },
      loan: null,
      account: {
        __type: 'ru.vtb24.mobilebanking.protocol.product.LoanAccountMto',
        number: '634/5010-0004540',
        id: 'E7DCC89E89EC47DDA57EB2925D2ECCC1',
        name: 'Ипотека',
        displayName: 'Ипотека',
        showOnMainPage: true,
        archived: false,
        contract: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.LoanContractMto',
          number: '634/5010-0004540',
          id: '5D1AB7F045F24C8F823CB785CFDC4ADE',
          name: 'Ипотека',
          displayName: 'Ипотека',
          showOnMainPage: true,
          archived: false,
          issueDate: new Date('Mon Aug 07 2017 00:00:00 GMT+0300'),
          creditSum: null,
          loan: null,
          account: null,
          status: {
            __type: 'ru.vtb24.mobilebanking.protocol.product.ContractStatusMto',
            id: 'OPEN'
          },
          openDate: new Date('Mon Aug 07 2017 00:00:00 GMT+0300'),
          endDate: new Date('Thu Oct 07 2032 00:00:00 GMT+0300'),
          closeDate: null,
          contractPeriod: {
            __type: 'ru.vtb24.mobilebanking.protocol.DurationMto',
            value: 182,
            unit: {
              __type: 'ru.vtb24.mobilebanking.protocol.DurationUnitMto',
              id: 'MONTH'
            }
          },
          details: null
        },
        status: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
          id: 'OPEN'
        },
        openDate: new Date('Mon Aug 07 2017 00:00:00 GMT+0300'),
        lastOperationDate: null,
        closeDate: null,
        amount: {
          __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
          sum: 1556772.29,
          currency: {
            __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
            currencyCode: 'RUR',
            name: 'Рубль России',
            displaySymbol: '₽'
          }
        },
        details: null
      },
      status: {
        __type: 'ru.vtb24.mobilebanking.protocol.product.ContractStatusMto',
        id: 'OPEN'
      },
      openDate: new Date('Mon Aug 07 2017 00:00:00 GMT+0300'),
      endDate: new Date('Thu Oct 07 2032 00:00:00 GMT+0300'),
      closeDate: null,
      contractPeriod: null,
      details: null
    })).toEqual({
      id: '5D1AB7F045F24C8F823CB785CFDC4ADE',
      type: 'ru.vtb24.mobilebanking.protocol.product.LoanContractMto',
      zenAccount: {
        id: '5D1AB7F045F24C8F823CB785CFDC4ADE',
        type: 'loan',
        title: 'Ипотека',
        instrument: 'RUB',
        startDate: new Date('2017-08-07T00:00:00+03:00'),
        startBalance: 1608000,
        balance: -1556772.29,
        percent: 1,
        capitalization: true,
        endDateOffsetInterval: 'month',
        endDateOffset: 182,
        payoffInterval: 'month',
        payoffStep: 1,
        syncID: [
          '63450100004540'
        ]
      }
    })
  })
})

describe('convertTransaction', () => {
  it('converts transfer', () => {
    expect(convertTransaction({
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
    }, {
      zenAccount: {
        id: 'account'
      }
    })).toEqual({
      date: new Date('2018-06-27T11:45:04+03:00'),
      hold: true,
      income: 0,
      incomeAccount: 'account',
      outcome: 59585,
      outcomeAccount: 'account',
      _transferType: 'income',
      _transferId: 1530089104000
    })
  })

  it('converts common transaction', () => {
    expect(convertTransaction({
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
    }, {
      zenAccount: {
        id: 'account'
      }
    })).toEqual({
      date: new Date('2018-06-18T19:16:42+03:00'),
      hold: false,
      income: 0,
      incomeAccount: 'account',
      outcome: 5400,
      outcomeAccount: 'account',
      payee: 'MOTEL KIROVSKIE DACHI'
    })
  })

  it('skips transaction from additional card', () => {
    expect(convertTransaction({
      __type: 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto',
      id: '39debc46-36e0-4ac9-9aba-edcfaf6de06c',
      details: 'Карта *2289 MAGNOLIYA',
      isHold: true,
      statusName: 'В обработке',
      transactionAmountInAccountCurrency: {
        __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
        sum: -239.7,
        currency: {
          __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
          currencyCode: 'RUR',
          name: 'Рубль России',
          displaySymbol: '₽'
        }
      },
      debet: {
        __type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardMto',
        number: '432250XXXXXX2289',
        brandName: 'Visa',
        embossed: null,
        cardHolder: 'Николаева Н.Н.',
        isAuthenticationalCard: false,
        coBrandName: null,
        isEmitedForOwner: false,
        shortNumber: '427230XXXXXX4688',
        icon: 'Muylticard-VTB',
        cardHolderLastName: 'Николаева',
        cardHolderFirstName: 'Нина',
        cardHolderPatronymic: 'Наумовна',
        nameOnCard: null,
        statusDisplayName: 'Активна',
        isMain: false,
        hasDependantCards: false,
        id: '3041EB1B9E47400E9833D2171B640EC1',
        name: 'Gold',
        displayName: 'ru_pip',
        showOnMainPage: false,
        archived: false,
        issueDate: new Date('Sat Jun 23 2017 00:00:00 GMT+0300'),
        expireDate: new Date('Wed Jun 30 2022 00:00:00 GMT+0300'),
        baseCurrency: {
          __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
          currencyCode: 'RUR',
          name: 'Рубль России',
          displaySymbol: '₽' },
        limits: null,
        balance: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.CardBalanceMto',
          amountSum: -31180.35,
          allowedSum: 268819.65,
          authorizedSum: 2129.7,
          balanceDate: null },
        lockedDate: null,
        status: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
          id: 'ACTIVE'
        },
        cardAccount: null,
        logistics: null,
        details: null
      },
      transactionDate: new Date('Tue Jul 10 2018 18:22:32 GMT+0300'),
      processedDate: null,
      transactionAmount: {
        __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
        sum: -239.7,
        currency: {
          __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
          currencyCode: 'RUR',
          name: 'Рубль России',
          displaySymbol: '₽'
        }
      },
      feeAmount: {
        __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
        sum: 0,
        currency: {
          __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
          currencyCode: 'RUR',
          name: 'Рубль России',
          displaySymbol: '₽'
        }
      },
      order: null,
      status: {
        __type: 'ru.vtb24.mobilebanking.protocol.StatusMto',
        id: 'IN_PROGRESS'
      }
    }, {
      id: '1334A5E71E3249AB9E8ECCE8C6627144'
    })).toBeNull()
  })
})
