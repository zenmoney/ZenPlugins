import { convertCardAccount } from '../../../converters'

describe('convertAccount', () => {
  it('converts master account without card', () => {
    const apiAccount = {
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
    }
    expect(convertCardAccount(apiAccount)).toEqual({
      id: 'AA18315EBD4647C990492F812629D493',
      type: 'ru.vtb24.mobilebanking.protocol.product.MasterAccountMto',
      products: [
        {
          id: 'AA18315EBD4647C990492F812629D493',
          type: 'ru.vtb24.mobilebanking.protocol.product.MasterAccountMto',
          apiAccount
        }
      ],
      cards: [],
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

  it('converts master account with a card', () => {
    const apiAccount = {
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
    }
    expect(convertCardAccount(apiAccount)).toEqual({
      id: 'F71710FBFC614CC29030ACF227509AA1',
      type: 'ru.vtb24.mobilebanking.protocol.product.MasterAccountMto',
      products: [
        {
          id: 'F71710FBFC614CC29030ACF227509AA1',
          type: 'ru.vtb24.mobilebanking.protocol.product.MasterAccountMto',
          apiAccount
        },
        {
          id: '4E40E49C08C24A3F85100C31F9BD6B43',
          type: 'ru.vtb24.mobilebanking.protocol.product.MasterAccountCardMto',
          apiAccount: apiAccount.cards[0]
        }
      ],
      cards: [
        {
          id: '4E40E49C08C24A3F85100C31F9BD6B43',
          type: 'ru.vtb24.mobilebanking.protocol.product.MasterAccountCardMto'
        }
      ],
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
})
