import { convertCardAccount } from '../../../converters'

describe('convertCardAccount', () => {
  it('converts moscow citizen debet card account', () => {
    const apiAccount = {
      __type: 'ru.vtb24.mobilebanking.protocol.product.DebitCardAccountMto',
      number: '534526******1234',
      id: 'DB799928F58E47ECB12F3F64AF506A67',
      name: 'Социальная карта москвича',
      displayName: 'Социальная карта москвича',
      showOnMainPage: true,
      archived: false,
      cards: [
        {
          __type: 'ru.vtb24.mobilebanking.protocol.product.DebitCardMto',
          number: '534526******1234',
          brandName: 'MasterCard',
          embossed: 'CARDHOLDER NAME',
          cardHolder: 'Фамильев Имь Отчевич',
          isAuthenticationalCard: false,
          coBrandName: null,
          isEmitedForOwner: true,
          shortNumber: '534526******1234',
          icon: 'MBank_Card',
          cardHolderLastName: null,
          cardHolderFirstName: null,
          cardHolderPatronymic: null,
          nameOnCard: null,
          statusDisplayName: 'Активна',
          isMain: false,
          hasDependantCards: false,
          id: 'B472EA16FA154C5080560D2C7A1285BA',
          name: 'Социальная карта москвича',
          displayName: 'Социальная карта москвича',
          showOnMainPage: false,
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
          issueDate: new Date('Wed Oct 19 2016 00:00:00 GMT+0300 (MSK)'),
          expireDate: new Date('Sun Oct 31 2021 00:00:00 GMT+0300 (MSK)'),
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
              authorizedSum: 0,
              balanceDate: null
            },
          lockedDate: null,
          status:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
              id: 'ACTIVE'
            },
          __id: 50,
          cardAccount:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.product.DebitCardAccountMto',
              number: '534526******1234',
              id: 'DB799928F58E47ECB12F3F64AF506A67',
              name: 'Социальная карта москвича',
              displayName: 'Социальная карта москвича',
              showOnMainPage: true,
              archived: false,
              cards: ['<ref[50]>'],
              mainCard: '<ref[50]>',
              status:
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
                  id: 'OPEN'
                },
              openDate: new Date('Wed Oct 19 2016 00:00:00 GMT+0300 (MSK)'),
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
              details: null
            },
          logistics: null,
          details: null
        }
      ],
      mainCard: {
        __type: 'ru.vtb24.mobilebanking.protocol.product.DebitCardMto',
        number: '534526******1234',
        brandName: 'MasterCard',
        embossed: 'CARDHOLDER NAME',
        cardHolder: 'Фамильев Имь Отчевич',
        isAuthenticationalCard: false,
        coBrandName: null,
        isEmitedForOwner: true,
        shortNumber: '534526******1234',
        icon: 'MBank_Card',
        cardHolderLastName: null,
        cardHolderFirstName: null,
        cardHolderPatronymic: null,
        nameOnCard: null,
        statusDisplayName: 'Активна',
        isMain: false,
        hasDependantCards: false,
        id: 'B472EA16FA154C5080560D2C7A1285BA',
        name: 'Социальная карта москвича',
        displayName: 'Социальная карта москвича',
        showOnMainPage: false,
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
        issueDate: new Date('Wed Oct 19 2016 00:00:00 GMT+0300 (MSK)'),
        expireDate: new Date('Sun Oct 31 2021 00:00:00 GMT+0300 (MSK)'),
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
            authorizedSum: 0,
            balanceDate: null
          },
        lockedDate: null,
        status:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
            id: 'ACTIVE'
          },
        __id: 50,
        cardAccount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.product.DebitCardAccountMto',
            number: '534526******1234',
            id: 'DB799928F58E47ECB12F3F64AF506A67',
            name: 'Социальная карта москвича',
            displayName: 'Социальная карта москвича',
            showOnMainPage: true,
            archived: false,
            cards: ['<ref[50]>'],
            mainCard: '<ref[50]>',
            status:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
                id: 'OPEN'
              },
            openDate: new Date('Wed Oct 19 2016 00:00:00 GMT+0300 (MSK)'),
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
            details: null
          },
        logistics: null,
        details: null
      },
      status:
        {
          __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
          id: 'OPEN'
        },
      openDate: new Date('Wed Oct 19 2016 00:00:00 GMT+0300 (MSK)'),
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
      details: null
    }

    expect(convertCardAccount(apiAccount)).toEqual({
      mainProduct: {
        id: 'DB799928F58E47ECB12F3F64AF506A67',
        type: 'ru.vtb24.mobilebanking.protocol.product.DebitCardAccountMto'
      },
      products: [
        {
          id: 'B472EA16FA154C5080560D2C7A1285BA',
          type: 'ru.vtb24.mobilebanking.protocol.product.DebitCardMto'
        }
      ],
      zenAccount: {
        id: 'DB799928F58E47ECB12F3F64AF506A67',
        type: 'ccard',
        title: 'Социальная карта москвича',
        instrument: 'RUB',
        balance: 0,
        syncID: [
          '534526******1234'
        ]
      }
    })
  })
})
