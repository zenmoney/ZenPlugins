import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          id: 'CARDS',
          productGroups: [
            {
              __type: 'ru.vtb24.mobilebanking.protocol.product.ProductGroupMto',
              type: 'SETTLEMENT_CARD_ACCOUNT',
              mainProduct:
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.product.SettlementCardAccountMto',
                  isDefault: false,
                  number: '40817810621134098242',
                  statusDescription: null,
                  name: 'Текущий счет',
                  displayName: 'Текущий счет',
                  showOnMainPage: true,
                  archived: false,
                  detailLevel: 'List',
                  id: '2434667C7D104E0285E251B890F7B415',
                  stub: null,
                  ver: null,
                  __id: 26,
                  cards:
                    [
                      {
                        __type: 'ru.vtb24.mobilebanking.protocol.product.DebitCardMto',
                        number: '220024******7924',
                        brandName: 'МИР Классическая',
                        embossed: 'IGOR DUBROVIN',
                        cardHolder: 'Николаев Николай Николаевич',
                        isAuthenticationalCard: false,
                        coBrandName: null,
                        isEmitedForOwner: true,
                        shortNumber: '220024******7924',
                        icon: 'Muylticard-VTB-NEW',
                        cardHolderLastName: null,
                        cardHolderFirstName: null,
                        cardHolderPatronymic: null,
                        nameOnCard: null,
                        statusDisplayName: 'Активна',
                        statusToolTip: null,
                        isMain: false,
                        hasDependantCards: false,
                        isSalaryProduct: false,
                        name: 'Мультикарта',
                        displayName: 'Мультикарта',
                        showOnMainPage: true,
                        archived: false,
                        detailLevel: 'List',
                        id: 'E975DA368E524E67BACFAA6C7CAA3CEA',
                        stub: null,
                        ver: null,
                        overdraft: null,
                        issueDate: new Date('Tue Nov 05 2019 05:00:00 GMT+0800 (+08)'),
                        expireDate: new Date('Mon Oct 31 2022 05:00:00 GMT+0800 (+08)'),
                        baseCurrency: {
                          __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                          currencyCode: 'RUR',
                          name: 'Рубль России',
                          displaySymbol: '₽',
                          codeIso: '810',
                          detailLevel: 'Full',
                          id: 'RUR',
                          stub: null,
                          ver: null,
                          __id: 8
                        },
                        limits: '<ref[9]>',
                        balance:
                          {
                            __type: 'ru.vtb24.mobilebanking.protocol.product.CardBalanceMto',
                            amountSum: 42396.49,
                            allowedSum: 42396.49,
                            authorizedSum: 0,
                            availableOwnBalance: 42396.49,
                            balanceDate: null
                          },
                        lockedDate: null,
                        status: {
                          __type: 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
                          id: 'Active',
                          __id: 14
                        },
                        cardAccount: '<ref[26]>',
                        logistics: null,
                        bonusProgram: null,
                        paymentSystemBinding: null,
                        details: null,
                        __id: 28
                      }
                    ],
                  mainCard: null,
                  status: '<ref[22]>',
                  openDate: new Date('Thu Oct 31 2019 05:00:00 GMT+0800 (+08)'),
                  lastOperationDate: null,
                  closeDate: null,
                  amount:
                    {
                      __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
                      sum: 42396.49,
                      currency: {
                        __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                        currencyCode: 'RUR',
                        name: 'Рубль России',
                        displaySymbol: '₽',
                        codeIso: '810',
                        detailLevel: 'Full',
                        id: 'RUR',
                        stub: null,
                        ver: null,
                        __id: 8
                      }
                    },
                  paymentSystemBinding: null,
                  details: null
                },
              products: ['<ref[28]>']
            }
          ],
          balancesAmount:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
              sum: 42397.49,
              currency:
                {
                  __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                  currencyCode: 'RUR',
                  name: 'Российский рубль',
                  displaySymbol: '₽',
                  codeIso: '810',
                  detailLevel: null,
                  id: null,
                  stub: null,
                  ver: null,
                  __id: 33
                }
            }
        }
      ],
      [
        {
          mainProduct: {
            id: '2434667C7D104E0285E251B890F7B415',
            type: 'ru.vtb24.mobilebanking.protocol.product.SettlementCardAccountMto'
          },
          products: [
            {
              id: 'E975DA368E524E67BACFAA6C7CAA3CEA',
              type: 'ru.vtb24.mobilebanking.protocol.product.DebitCardMto'
            }
          ],
          zenAccount: {
            id: '2434667C7D104E0285E251B890F7B415',
            type: 'ccard',
            title: 'Мультикарта',
            instrument: 'RUB',
            balance: 42396.49,
            syncID: [
              '220024******7924',
              '40817810621134098242'
            ]
          }
        }
      ]
    ]
  ])('converts settlement card account with cards', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
