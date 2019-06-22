import { convertAccounts, convertCardAccount } from '../../../converters'

describe('convertAccount', () => {
  it('converts credit card', () => {
    const apiAccount = {
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
    }
    expect(convertCardAccount(apiAccount)).toEqual({
      mainProduct: {
        id: 'EE270DFC77F64E39B2EC0445200EB087',
        type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardMto'
      },
      products: [],
      zenAccount: {
        id: '7D3ABFDFF2024BB79D220FA6B8D4DC77',
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
    const apiAccount = {
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
        }
      ]
    }
    expect(convertCardAccount(apiAccount)).toEqual(
      {
        mainProduct: {
          id: '1334A5E71E3249AB9E8ECCE8C6627144',
          type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardMto'
        },
        products: [
          {
            id: '3041EB1B9E47400E9833D2171B640EC1',
            type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardMto'
          }
        ],
        zenAccount: {
          id: '586375B9033E4CC1ACE9DBE6D343A0E7',
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
    )
  })

  it('converts credit card account with archive card', () => {
    const product = {
      __type: 'ru.vtb24.mobilebanking.protocol.product.ProductGroupMto',
      type: 'CREDIT_CARD_ACCOUNT',
      mainProduct: {
        __type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardMto',
        number: '427230******5132',
        brandName: 'Visa',
        embossed: 'N NIKOLAEV',
        cardHolder: 'Николаев Н.Н.',
        isAuthenticationalCard: false,
        coBrandName: null,
        isEmitedForOwner: true,
        shortNumber: '427230******5132',
        icon: null,
        cardHolderLastName: 'Николаев',
        cardHolderFirstName: 'Николай',
        cardHolderPatronymic: 'Николаевич',
        nameOnCard: null,
        statusDisplayName: 'Карта заблокирована',
        statusToolTip: null,
        isMain: false,
        hasDependantCards: false,
        name: 'Gold',
        displayName: 'Gold',
        showOnMainPage: true,
        archived: false,
        detailLevel: 'List',
        id: '6366B67FCC77431D9AAD9FF74CFE0D65',
        stub: null,
        ver: 2673603493782812,
        issueDate: new Date('Mon Jan 01 1900 00:00:00 GMT+0300 (MSK)'),
        expireDate: new Date('Tue May 31 2022 00:00:00 GMT+0300 (MSK)'),
        baseCurrency: {
          __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
          currencyCode: 'RUR',
          name: 'Рубль России',
          displaySymbol: '₽'
        },
        limits: null,
        balance: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.CardBalanceMto',
          amountSum: -13975.18,
          allowedSum: 16024.82,
          authorizedSum: 329.54,
          availableOwnBalance: 0,
          balanceDate: null
        },
        lockedDate: new Date('Sat May 18 2019 00:00:00 GMT+0300 (MSK)'),
        status: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
          id: 'Locked'
        },
        cardAccount: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardAccountMto',
          creditLimit: 30000,
          number: '427230******5132',
          name: 'Gold',
          displayName: 'Gold',
          showOnMainPage: true,
          archived: false,
          detailLevel: 'List',
          id: 'AC25ABEA9D7A4D76B326E5807119EBB7',
          stub: null,
          ver: 2673603493782895,
          loanInfo: null,
          cards: [
            '',
            {
              __type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardMto',
              number: '535082******6235',
              brandName: 'MasterCard',
              embossed: ' CARDHOLDER',
              cardHolder: 'Николаев Н.Н.',
              isAuthenticationalCard: false,
              coBrandName: null,
              isEmitedForOwner: true,
              shortNumber: '535082******6235',
              icon: 'Muylticard-VTB-NEW',
              cardHolderLastName: 'Николаев',
              cardHolderFirstName: 'Николай',
              cardHolderPatronymic: 'Николаевич',
              nameOnCard: null,
              statusDisplayName: 'Активна',
              statusToolTip: null,
              isMain: false,
              hasDependantCards: false,
              name: 'Instant Issue',
              displayName: 'Instant Issue',
              showOnMainPage: true,
              archived: false,
              detailLevel: 'List',
              id: '1054838DA6524B8E98EED62267800942',
              stub: null,
              ver: 2673603493782811,
              issueDate: new Date('Wed Apr 24 2019 00:00:00 GMT+0300 (MSK)'),
              expireDate: new Date('Tue Apr 30 2024 00:00:00 GMT+0300 (MSK)'),
              baseCurrency: {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              },
              limits: null,
              balance: {
                __type: 'ru.vtb24.mobilebanking.protocol.product.CardBalanceMto',
                amountSum: -13975.18,
                allowedSum: 16024.82,
                authorizedSum: 329.54,
                availableOwnBalance: 0,
                balanceDate: null
              },
              lockedDate: null,
              status: {
                __type: 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
                id: 'Active'
              },
              cardAccount: '',
              logistics: null,
              bonusProgram: {
                __type: 'ru.vtb24.mobilebanking.protocol.ObjectIdentityMto',
                type: 'ru.vtb24.mobilebanking.protocol.product.BonusProgramMto',
                id: 'MULTICARTA'
              },
              paymentSystemBinding: null,
              details: null
            }
          ],
          mainCard: '',
          status: '',
          openDate: new Date('Mon Jan 01 1900 00:00:00 GMT+0300 (MSK)'),
          lastOperationDate: null,
          closeDate: null,
          amount: {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 16024.82,
            currency: {
              __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
              currencyCode: 'RUR',
              name: 'Рубль России',
              displaySymbol: '₽'
            }
          },
          paymentSystemBinding: null,
          details: null
        },
        logistics: null,
        bonusProgram: null,
        paymentSystemBinding: null,
        details: null
      },
      products: ['']
    }
    product.products = [product.mainProduct]
    product.mainProduct.cardAccount.cards[0] = product.mainProduct
    product.mainProduct.cardAccount.mainCard = product.mainProduct
    expect(convertAccounts([
      {
        id: 'CARDS',
        productGroups: [product]
      }
    ])).toEqual([
      {
        mainProduct: {
          id: '1054838DA6524B8E98EED62267800942',
          type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardMto'
        },
        products: [],
        zenAccount: {
          id: 'AC25ABEA9D7A4D76B326E5807119EBB7',
          type: 'ccard',
          title: 'Instant Issue',
          instrument: 'RUB',
          balance: -13975.18,
          creditLimit: 30000,
          syncID: [
            '535082******6235',
            '427230******5132'
          ]
        }
      }
    ])
  })
})
