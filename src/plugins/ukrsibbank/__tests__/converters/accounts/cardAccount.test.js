import { convertAccount, convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      {
        __type: 'com.ukrsibbank.client.protocol.product.ProductsResponse',
        accounts:
          [
            {
              __type: 'com.ukrsibbank.client.protocol.product.account.AccountMto',
              number: 'UA96 3510 0500 0002 6202 9662 7831 9',
              balanceInterestRate: null,
              tariffPlanId: null,
              id: '2909929648',
              name: 'Шоппінг картка',
              alias: 'Шоппінг картка',
              reminder: null,
              warning: null,
              type:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.account.AccountTypeMto',
                  name: 'REVOLVING_ACCOUNT'
                },
              balance:
                {
                  __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                  sum: 1000.53,
                  currency:
                    {
                      __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                      name: 'UAH'
                    }
                },
              interestRates: [],
              minimalBalance: null,
              totalAvailableAmount:
                {
                  __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                  sum: 1000.53,
                  currency:
                    {
                      __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                      name: 'UAH'
                    }
                },
              overdraft:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.account.OverdraftDetailsMto',
                  overdraftUsageRate: null,
                  overdraftCashUsageRate: 55,
                  overdraftCashlessUsageRate: 55,
                  overdueOverdraftRate: 0,
                  installmentPaymentEnabled: true,
                  availableOverdraft:
                    {
                      __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                      sum: 1000.53,
                      currency:
                        {
                          __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                          name: 'UAH'
                        }
                    },
                  overdraftLimit:
                    {
                      __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                      sum: 40000,
                      currency:
                        {
                          __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                          name: 'UAH'
                        }
                    },
                  overdraftEndDate: new Date('Sat Jul 10 2021 00:00:00 GMT+0300 (EEST)'),
                  overdueDebtCommission: null,
                  minimalOverdraftPayment: null,
                  overdraftDebt: null,
                  feeDebt: null,
                  overdueOverdraftDebt: null,
                  totalDebt:
                    {
                      __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                      sum: 38999.47,
                      currency:
                        {
                          __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                          name: 'UAH'
                        }
                    },
                  totalDebtDetails:
                    [
                      {
                        __type: 'com.ukrsibbank.client.protocol.amount.NamedAmountMto',
                        name: 'Основний борг за операціями отримання готівки',
                        amount:
                          {
                            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                            sum: 17635.11,
                            currency:
                              {
                                __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                                name: 'UAH'
                              }
                          }
                      },
                      {
                        __type: 'com.ukrsibbank.client.protocol.amount.NamedAmountMto',
                        name: 'Основний борг за операціями оплати товарів',
                        amount:
                          {
                            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                            sum: 21364.36,
                            currency:
                              {
                                __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                                name: 'UAH'
                              }
                          }
                      }
                    ],
                  paymentDebtDate: null,
                  repaymentDetails:
                    {
                      __type: 'com.ukrsibbank.client.protocol.product.account.OverdraftRepaymentDetailsMto',
                      overdraftRepaymentToPayText: 'You have already paid the planned payment for this month.',
                      repaymentType:
                        {
                          __type: 'com.ukrsibbank.client.protocol.product.account.OverdraftRepaymentTypeMto',
                          name: 'REPAID'
                        },
                      totalAmount:
                        {
                          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                          sum: 0,
                          currency:
                            {
                              __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                              name: 'UAH'
                            }
                        },
                      plannedPaymentDate: new Date('Mon Jul 13 2020 00:00:00 GMT+0300 (EEST)'),
                      plannedPaymentAmount:
                        {
                          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                          sum: 0,
                          currency:
                            {
                              __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                              name: 'UAH'
                            }
                        },
                      plannedPaymentAmountDetails: [],
                      overdueDebtAmount:
                        {
                          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                          sum: 0,
                          currency:
                            {
                              __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                              name: 'UAH'
                            }
                        },
                      overdueDebtAmountDetails: []
                    }
                },
              paymentAmountToEnableGracePeriod: null,
              paymentDateToEnableGracePeriod: null,
              tariffPlanResource:
                {
                  __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                  id: 'ab2a2dd2-5b47-41cf-bae1-5b14e6ddbe05',
                  contentTimestamp: new Date('Fri Feb 07 2020 14:42:32 GMT+0200 (EET)')
                },
              category:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                  name: 'ACCOUNT'
                }
            }
          ],
        cards:
          [
            {
              __type: 'com.ukrsibbank.client.protocol.product.card.CardMto',
              accountId: '2909929648',
              number: '5116 9524 6327 2593',
              holderName: '<string[17]>',
              statusText: null,
              lightImage: true,
              canTransferFrom: false,
              canTransferTo: true,
              canBlock: false,
              canUnblock: false,
              canUpdateSmsService: false,
              cardLimitsAvailable: false,
              canUpdatePinCode: true,
              canEditSecretWord: false,
              canActivate: false,
              canAddToApplePay: true,
              canAddToGooglePay: true,
              canShowCvv: null,
              id: '2915161797',
              name: 'MasterCard Standard Credit Shopping Сard',
              alias: 'MC Standard Credit',
              reminder: null,
              warning: null,
              status:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.card.CardStatusMto',
                  name: 'ACTIVE'
                },
              expirationDate: new Date('Wed Jul 31 2024 00:00:00 GMT+0300 (EEST)'),
              smallImage:
                {
                  __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                  id: '668ed886-4e91-46e3-958a-0d61dd8f4d60',
                  contentTimestamp: new Date('Thu Jul 09 2020 13:42:49 GMT+0300 (EEST)')
                },
              largeImage:
                {
                  __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                  id: '04d1aec7-2155-46d7-b570-3826cf8f9156',
                  contentTimestamp: new Date('Thu Jul 09 2020 13:42:49 GMT+0300 (EEST)')
                },
              googlePayTokens: [],
              category:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                  name: 'CARD'
                }
            }
          ],
        deposits: [],
        loans: [],
        foreignCards: []
      },
      [
        {
          product: {
            id: '2909929648',
            category: {
              __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
              name: 'ACCOUNT'
            }
          },
          account: {
            id: '2909929648',
            type: 'ccard',
            title: 'Шоппінг картка',
            instrument: 'UAH',
            syncID: [
              '5116952463272593',
              'UA963510050000026202966278319'
            ],
            balance: -38999.47,
            creditLimit: 40000
          }
        }
      ]
    ],
    [
      {
        __type: 'com.ukrsibbank.client.protocol.product.ProductsResponse',
        accounts:
          [
            {
              __type: 'com.ukrsibbank.client.protocol.product.account.AccountMto',
              number: 'UA81 3510 0500 0002 6201 9669 7954 5',
              balanceInterestRate: null,
              tariffPlanId: null,
              id: '11137691537',
              name: null,
              alias: 'unknown',
              reminder: null,
              warning: null,
              type:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.account.AccountTypeMto',
                  name: 'REVOLVING_ACCOUNT'
                },
              balance:
                {
                  __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                  sum: 99000.16,
                  currency:
                    {
                      __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                      name: 'UAH'
                    }
                },
              interestRates: [],
              minimalBalance: null,
              totalAvailableAmount:
                {
                  __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                  sum: 99000.16,
                  currency:
                    {
                      __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                      name: 'UAH'
                    }
                },
              overdraft:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.account.OverdraftDetailsMto',
                  overdraftUsageRate: null,
                  overdraftCashUsageRate: 55,
                  overdraftCashlessUsageRate: 55,
                  overdueOverdraftRate: 7,
                  installmentPaymentEnabled: true,
                  availableOverdraft:
                    {
                      __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                      sum: 99000,
                      currency:
                        {
                          __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                          name: 'UAH'
                        }
                    },
                  overdraftLimit:
                    {
                      __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                      sum: 99000,
                      currency:
                        {
                          __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                          name: 'UAH'
                        }
                    },
                  overdraftEndDate: new Date('Mon Feb 20 2023 00:00:00 GMT+0200 (EET)'),
                  overdueDebtCommission: null,
                  minimalOverdraftPayment: null,
                  overdraftDebt: null,
                  feeDebt: null,
                  overdueOverdraftDebt: null,
                  totalDebt: null,
                  totalDebtDetails: [],
                  paymentDebtDate: null,
                  repaymentDetails:
                    {
                      __type: 'com.ukrsibbank.client.protocol.product.account.OverdraftRepaymentDetailsMto',
                      overdraftRepaymentToPayText: null,
                      repaymentType: null,
                      totalAmount:
                        {
                          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                          sum: 0,
                          currency:
                            {
                              __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                              name: 'UAH'
                            }
                        },
                      plannedPaymentDate: new Date('Mon Dec 20 2021 00:00:00 GMT+0200 (EET)'),
                      plannedPaymentAmount:
                        {
                          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                          sum: 0,
                          currency:
                            {
                              __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                              name: 'UAH'
                            }
                        },
                      plannedPaymentAmountDetails: [],
                      overdueDebtAmount:
                        {
                          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                          sum: 0,
                          currency:
                            {
                              __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                              name: 'UAH'
                            }
                        },
                      overdueDebtAmountDetails: []
                    }
                },
              paymentAmountToEnableGracePeriod: null,
              paymentDateToEnableGracePeriod: null,
              tariffPlanResource:
                {
                  __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                  id: 'f3ec751b-5d42-4f84-91b6-595d5ac49006',
                  contentTimestamp: new Date('Thu Dec 16 2021 16:14:37 GMT+0200 (EET)')
                },
              category:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                  name: 'ACCOUNT'
                }
            }
          ],
        cards:
          [
            {
              __type: 'com.ukrsibbank.client.protocol.product.card.CardMto',
              accountId: '11137691537',
              number: '5220 1902 1576 3774',
              holderName: '<string[12]>',
              statusText: null,
              lightImage: false,
              canTransferFrom: true,
              canTransferTo: true,
              canBlock: false,
              canUnblock: false,
              canUpdateSmsService: false,
              cardLimitsAvailable: false,
              canUpdatePinCode: true,
              canEditSecretWord: false,
              canActivate: false,
              canAddToApplePay: true,
              canAddToGooglePay: true,
              canShowCvv: true,
              id: '11137691698',
              name: 'MasterCard Platinum Credit',
              alias: 'MC Standard Credit',
              reminder: null,
              warning: null,
              status:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.card.CardStatusMto',
                  name: 'ACTIVE'
                },
              expirationDate: new Date('Wed Jan 31 2024 00:00:00 GMT+0200 (EET)'),
              smallImage:
                {
                  __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                  id: 'c756da5f-59ec-4222-9585-b2f76d0a9999',
                  contentTimestamp: new Date('Thu Jul 23 2020 11:04:36 GMT+0300 (EEST)')
                },
              largeImage:
                {
                  __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                  id: '54d248cd-9933-4b8e-baee-70251eb2f6ec',
                  contentTimestamp: new Date('Thu Jul 09 2020 13:42:50 GMT+0300 (EEST)')
                },
              googlePayTokens: [],
              mrs: null,
              category:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                  name: 'CARD'
                }
            }
          ],
        deposits: [],
        loans: [],
        foreignCards: []
      },
      [
        {
          account: {
            balance: 0.16000000000349246,
            creditLimit: 99000,
            id: '11137691537',
            instrument: 'UAH',
            syncID: ['5220190215763774', 'UA813510050000026201966979545'],
            title: 'MasterCard Platinum Credit',
            type: 'ccard'
          },
          product: { category: { __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto', name: 'ACCOUNT' }, id: '11137691537' }
        }
      ]
    ]
  ])('converts credit card', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})

const apiAccount = {
  __type: 'com.ukrsibbank.client.protocol.product.account.AccountMto',
  number: 'UA07 3510 0500 0002 6206 8073 2301 2',
  balanceInterestRate: null,
  tariffPlanId: '0123456789',
  id: '0123456789',
  name: 'Welcome card',
  alias: 'Welcome card',
  reminder: null,
  warning: null,
  type: { __type: 'com.ukrsibbank.client.protocol.product.account.AccountTypeMto', name: 'CARD_ACCOUNT' },
  balance: {
    __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
    sum: 12.34,
    currency: { __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto', name: 'UAH' }
  },
  interestRates: [],
  minimalBalance: null,
  totalAvailableAmount: {
    __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
    sum: 12.34,
    currency: { __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto', name: 'UAH' }
  },
  overdraft: null,
  paymentAmountToEnableGracePeriod: null,
  paymentDateToEnableGracePeriod: null,
  tariffPlanResource: null,
  category: { __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto', name: 'ACCOUNT' }
}

const apiCards = [
  {
    __type: 'com.ukrsibbank.client.protocol.product.card.CardMto',
    accountId: '0123456789',
    number: '5169 00** **** 4321',
    holderName: 'MR CARDHOLDER',
    statusText: null,
    lightImage: false,
    canTransferFrom: true,
    canTransferTo: true,
    canBlock: true,
    canUnblock: false,
    canUpdateSmsService: true,
    cardLimitsAvailable: true,
    canAddToGooglePay: true,
    id: '1234567890',
    name: 'MasterCard Debit Welcome Card',
    alias: 'MC DEBIT EUROSAFE НПК',
    reminder: null,
    warning: null,
    status: { __type: 'com.ukrsibbank.client.protocol.product.card.CardStatusMto', name: 'ACTIVE' },
    expirationDate: '2022-09-29T21:00:00.000Z',
    smallImage: {
      __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
      id: '6ccfe2cf-5d9f-46c2-a4d5-19e6ec6a619d',
      contentTimestamp: '2016-08-03T01:09:44.000Z'
    },
    largeImage: {
      __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
      id: '55f5ae3c-4794-4560-a6a2-37fd86c54af9',
      contentTimestamp: '2018-08-15T12:31:32.000Z'
    },
    googlePayTokens: [],
    category: { __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto', name: 'CARD' }
  }
]

describe('convertAccount', () => {
  it('converts account with 2+ cards', () => {
    expect(convertAccount(apiAccount, [
      ...apiCards,
      {
        accountId: '0123456789',
        number: '5169 00** **** 6543',
        id: '1234567890'
      }
    ])).toEqual({
      product: {
        id: '0123456789',
        category: { __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto', name: 'ACCOUNT' }
      },
      account: {
        id: '0123456789',
        type: 'ccard',
        title: 'Welcome card',
        instrument: 'UAH',
        balance: 12.34,
        syncID: [
          '516900******4321',
          '516900******6543',
          'UA073510050000026206807323012'
        ]
      }
    })
  })

  it('converts account with one card', () => {
    expect(convertAccount(apiAccount, apiCards)).toEqual({
      product: {
        id: '0123456789',
        category: { __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto', name: 'ACCOUNT' }
      },
      account: {
        id: '0123456789',
        type: 'ccard',
        title: 'Welcome card',
        instrument: 'UAH',
        balance: 12.34,
        syncID: [
          '516900******4321',
          'UA073510050000026206807323012'
        ]
      }
    })
  })
})
