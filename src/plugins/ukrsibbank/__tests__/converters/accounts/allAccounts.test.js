import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      {
        __type: 'com.ukrsibbank.client.protocol.product.ProductsResponse',
        accounts:
          [
            {
              __type: 'com.ukrsibbank.client.protocol.product.account.AccountMto',
              number: 'UA96 3510 0500 0002 6208 8086 2789 5',
              balanceInterestRate: null,
              tariffPlanId: '7522295380',
              id: '7522295380',
              name: 'ЗП AI De Luxe картковий',
              alias: 'ЗП AI De Luxe картковий',
              reminder: null,
              warning: null,
              type:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.account.AccountTypeMto',
                  name: 'CARD_ACCOUNT'
                },
              balance:
                {
                  __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                  sum: 2164.32,
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
                  sum: 2164.32,
                  currency:
                    {
                      __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                      name: 'UAH'
                    }
                },
              overdraft: null,
              paymentAmountToEnableGracePeriod: null,
              paymentDateToEnableGracePeriod: null,
              tariffPlanResource: null,
              category:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                  name: 'ACCOUNT'
                }
            },
            {
              __type: 'com.ukrsibbank.client.protocol.product.account.AccountMto',
              number: 'UA17 3510 0500 0002 6207 8086 2789 6',
              balanceInterestRate: 1.5,
              tariffPlanId: '7587065806',
              id: '7587065806',
              name: 'ЗП De Luxe накопичувальний',
              alias: 'ЗП De Luxe накопичувальний',
              reminder: null,
              warning: null,
              type:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.account.AccountTypeMto',
                  name: 'SAVINGS_ACCOUNT'
                },
              balance:
                {
                  __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                  sum: 16500,
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
                  sum: 16500,
                  currency:
                    {
                      __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                      name: 'UAH'
                    }
                },
              overdraft: null,
              paymentAmountToEnableGracePeriod: null,
              paymentDateToEnableGracePeriod: null,
              tariffPlanResource: null,
              category:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                  name: 'ACCOUNT'
                }
            },
            {
              __type: 'com.ukrsibbank.client.protocol.product.account.AccountMto',
              number: 'UA25 3510 0500 0002 6205 8090 9361 4',
              balanceInterestRate: null,
              tariffPlanId: null,
              id: '13679099983',
              name: 'Dreams',
              alias: 'Dreams',
              reminder: null,
              warning: null,
              type:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.account.AccountTypeMto',
                  name: 'DREAMS_ACCOUNT'
                },
              balance:
                {
                  __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                  sum: 3240,
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
                  sum: 3240,
                  currency:
                    {
                      __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                      name: 'UAH'
                    }
                },
              overdraft: null,
              paymentAmountToEnableGracePeriod: null,
              paymentDateToEnableGracePeriod: null,
              tariffPlanResource: null,
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
              accountId: '7522295380',
              number: '5351 2901 0240 8896',
              holderName: '<string[13]>',
              statusText: null,
              lightImage: false,
              canTransferFrom: true,
              canTransferTo: true,
              canBlock: true,
              canUnblock: false,
              canUpdateSmsService: true,
              cardLimitsAvailable: true,
              canUpdatePinCode: true,
              canEditSecretWord: true,
              canActivate: false,
              canAddToApplePay: true,
              canAddToGooglePay: true,
              canShowCvv: true,
              id: '7522295438',
              name: 'MasterCard Platinum Contactless',
              alias: 'MC PLATINUM',
              reminder: null,
              warning: null,
              status:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.card.CardStatusMto',
                  name: 'ACTIVE'
                },
              expirationDate: new Date('Mon Jul 31 2023 00:00:00 GMT+0300 (EEST)'),
              smallImage:
                {
                  __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                  id: 'c756da5f-59ec-4222-9585-b2f76d0a9999',
                  contentTimestamp: new Date('Thu Jul 23 2020 11:04:36 GMT+0300')
                },
              largeImage:
                {
                  __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                  id: '54d248cd-9933-4b8e-baee-70251eb2f6ec',
                  contentTimestamp: new Date('Thu Jul 09 2020 13:42:50 GMT+0300')
                },
              googlePayTokens:
                [
                  {
                    __type: 'com.ukrsibbank.client.protocol.product.card.CardTokenInfoMto',
                    tokenId: 'DSHRMC000014638748155419d28a49e1ba34eb505a6b6906',
                    tokenServiceProvider:
                      {
                        __type: 'com.ukrsibbank.client.protocol.product.card.TokenServiceProviderMto',
                        name: 'MASTERCARD'
                      }
                  }
                ],
              mrs:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.card.MrsMto',
                  points: 0,
                  status: 'CAN_INVOLVE',
                  firstConnect: true
                },
              category:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                  name: 'CARD'
                }
            }
          ],
        deposits: [],
        loans: [],
        foreignCards:
          [
            {
              __type: 'com.ukrsibbank.client.protocol.product.card.ForeignCardMto',
              number: '5168 74** **** 8922',
              issuer: null,
              expired: false,
              canTransferFrom: true,
              canTransferTo: true,
              id: '8335484953',
              name: 'NIKOLAY NIKOLAEV (садик)',
              alias: 'NIKOLAY NIKOLAEV (садик)',
              reminder: null,
              warning: null,
              expiration: null,
              paymentSystem:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.PaymentSystemMto',
                  name: 'MASTERCARD'
                },
              category:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                  name: 'FOREIGN_CARD'
                }
            },
            {
              __type: 'com.ukrsibbank.client.protocol.product.card.ForeignCardMto',
              number: '5168 75** **** 8503',
              issuer: null,
              expired: false,
              canTransferFrom: true,
              canTransferTo: true,
              id: '7586636065',
              name: 'Універсальна',
              alias: 'Універсальна',
              reminder: null,
              warning: null,
              expiration: null,
              paymentSystem:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.PaymentSystemMto',
                  name: 'MASTERCARD'
                },
              category:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                  name: 'FOREIGN_CARD'
                }
            },
            {
              __type: 'com.ukrsibbank.client.protocol.product.card.ForeignCardMto',
              number: '4149 43** **** 0694',
              issuer: null,
              expired: false,
              canTransferFrom: true,
              canTransferTo: true,
              id: '9257363010',
              name: 'NIKOLAY NIKOLAEV',
              alias: 'NIKOLAY NIKOLAEV',
              reminder: null,
              warning: null,
              expiration: null,
              paymentSystem:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.PaymentSystemMto',
                  name: 'VISA'
                },
              category:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                  name: 'FOREIGN_CARD'
                }
            },
            {
              __type: 'com.ukrsibbank.client.protocol.product.card.ForeignCardMto',
              number: '5168 74** **** 6459',
              issuer: null,
              expired: false,
              canTransferFrom: true,
              canTransferTo: true,
              id: '9069691023',
              name: 'Глеб',
              alias: 'Глеб',
              reminder: null,
              warning: null,
              expiration: null,
              paymentSystem:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.PaymentSystemMto',
                  name: 'MASTERCARD'
                },
              category:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                  name: 'FOREIGN_CARD'
                }
            }
          ]
      },
      [
        {
          product: {
            id: '7522295380',
            category: { __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto', name: 'ACCOUNT' }
          },
          account: {
            balance: 2164.32,
            id: '7522295380',
            instrument: 'UAH',
            syncID: [
              '5351290102408896',
              'UA963510050000026208808627895'
            ],
            title: 'ЗП AI De Luxe картковий',
            type: 'ccard'
          }
        },
        {
          product: {
            id: '7587065806',
            category: { __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto', name: 'ACCOUNT' }
          },
          account: {
            balance: 16500,
            id: '7587065806',
            instrument: 'UAH',
            savings: true,
            syncID: [
              'UA173510050000026207808627896'
            ],
            title: 'ЗП De Luxe накопичувальний',
            type: 'checking'
          }
        },
        {
          product: {
            id: '13679099983',
            category: { __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto', name: 'ACCOUNT' }
          },
          account: {
            balance: 3240,
            id: '13679099983',
            instrument: 'UAH',
            syncID: [
              'UA253510050000026205809093614'
            ],
            title: 'Dreams',
            type: 'checking'
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
              number: 'UA50 3510 0500 0002 6203 8066 2710 4',
              balanceInterestRate: null,
              tariffPlanId: '1339217120',
              id: '1339217120',
              name: 'ЗП Black edition картковий',
              alias: 'ЗП Black edition картковий',
              reminder: null,
              warning: null,
              type:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.account.AccountTypeMto',
                  name: 'CARD_ACCOUNT'
                },
              balance:
                {
                  __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                  sum: 722.17,
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
                  sum: 722.17,
                  currency:
                    {
                      __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                      name: 'UAH'
                    }
                },
              overdraft: null,
              paymentAmountToEnableGracePeriod: null,
              paymentDateToEnableGracePeriod: null,
              tariffPlanResource: null,
              category:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                  name: 'ACCOUNT'
                }
            },
            {
              __type: 'com.ukrsibbank.client.protocol.product.account.AccountMto',
              number: 'UA51 3510 0500 0002 6208 8066 2711 0',
              balanceInterestRate: null,
              tariffPlanId: '1339217122',
              id: '1339217122',
              name: 'Black edition картковий валюта',
              alias: 'Black edition картковий валюта',
              reminder: null,
              warning: null,
              type:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.account.AccountTypeMto',
                  name: 'CARD_ACCOUNT'
                },
              balance:
                {
                  __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                  sum: 4887.72,
                  currency:
                    {
                      __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                      name: 'USD'
                    }
                },
              interestRates: [],
              minimalBalance: null,
              totalAvailableAmount:
                {
                  __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                  sum: 4887.72,
                  currency:
                    {
                      __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                      name: 'USD'
                    }
                },
              overdraft: null,
              paymentAmountToEnableGracePeriod: null,
              paymentDateToEnableGracePeriod: null,
              tariffPlanResource: null,
              category:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                  name: 'ACCOUNT'
                }
            },
            {
              __type: 'com.ukrsibbank.client.protocol.product.account.AccountMto',
              number: 'UA26 3510 0500 0002 6206 6127 7080 0',
              balanceInterestRate: 1.5,
              tariffPlanId: null,
              id: '67636824',
              name: 'Black edition накопичувальний',
              alias: 'Black edition накопичувальний',
              reminder: null,
              warning: null,
              type:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.account.AccountTypeMto',
                  name: 'SAVINGS_ACCOUNT'
                },
              balance:
                {
                  __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                  sum: 0,
                  currency:
                    {
                      __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                      name: 'UAH'
                    }
                },
              interestRates: [],
              minimalBalance: null,
              totalAvailableAmount: null,
              overdraft: null,
              paymentAmountToEnableGracePeriod: null,
              paymentDateToEnableGracePeriod: null,
              tariffPlanResource: null,
              category:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                  name: 'ACCOUNT'
                }
            },
            {
              __type: 'com.ukrsibbank.client.protocol.product.account.AccountMto',
              number: 'UA13 3510 0500 0002 6201 8080 7216 8',
              balanceInterestRate: 0.01,
              tariffPlanId: null,
              id: '2935435031',
              name: 'Black edition накопичувальний',
              alias: 'Black edition накопичувальний',
              reminder: null,
              warning: null,
              type:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.account.AccountTypeMto',
                  name: 'SAVINGS_ACCOUNT'
                },
              balance:
                {
                  __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                  sum: 1300,
                  currency:
                    {
                      __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                      name: 'USD'
                    }
                },
              interestRates: [],
              minimalBalance: null,
              totalAvailableAmount:
                {
                  __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                  sum: 1300,
                  currency:
                    {
                      __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                      name: 'USD'
                    }
                },
              overdraft: null,
              paymentAmountToEnableGracePeriod: null,
              paymentDateToEnableGracePeriod: null,
              tariffPlanResource: null,
              category:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                  name: 'ACCOUNT'
                }
            },
            {
              __type: 'com.ukrsibbank.client.protocol.product.account.AccountMto',
              number: 'UA31 3510 0500 0002 6202 9673 3261 8',
              balanceInterestRate: null,
              tariffPlanId: '16162766038',
              id: '16162766038',
              name: 'КАРТКА З ЛІМІТОМ',
              alias: 'КАРТКА З ЛІМІТОМ',
              reminder: null,
              warning: null,
              type:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.account.AccountTypeMto',
                  name: 'CREDIT_ACCOUNT'
                },
              balance:
                {
                  __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                  sum: 200000,
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
                  sum: 200000,
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
                  overdraftCashUsageRate: 44.99,
                  overdraftCashlessUsageRate: 44.99,
                  overdueOverdraftRate: 0,
                  installmentPaymentEnabled: false,
                  availableOverdraft:
                    {
                      __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                      sum: 200000,
                      currency:
                        {
                          __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                          name: 'UAH'
                        }
                    },
                  overdraftLimit:
                    {
                      __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
                      sum: 200000,
                      currency:
                        {
                          __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                          name: 'UAH'
                        }
                    },
                  overdraftEndDate: new Date('Wed Sep 20 2023 00:00:00 GMT+0300 (EEST)'),
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
                      repaymentType:
                        {
                          __type: 'com.ukrsibbank.client.protocol.product.account.OverdraftRepaymentTypeMto',
                          name: 'REPAID_AND_OPEN_GRACE_PERIOD'
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
                      plannedPaymentDate: new Date('Mon Sep 20 2021 00:00:00 GMT+0300 (EEST)'),
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
              tariffPlanResource: null,
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
              accountId: '1339217120',
              number: '5215 67** **** 6334',
              holderName: '<string[16]>',
              statusText: null,
              lightImage: false,
              canTransferFrom: false,
              canTransferTo: false,
              canBlock: false,
              canUnblock: true,
              canUpdateSmsService: true,
              cardLimitsAvailable: true,
              canUpdatePinCode: false,
              canEditSecretWord: false,
              canActivate: false,
              canAddToApplePay: false,
              canAddToGooglePay: false,
              canShowCvv: false,
              id: '2941067025',
              name: 'MasterCard World Black Edition',
              alias: 'MC BLACK EDITION',
              reminder: null,
              warning: null,
              status:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.card.CardStatusMto',
                  name: 'BLOCKED'
                },
              expirationDate: new Date('Sun Jul 31 2022 00:00:00 GMT+0300 (EEST)'),
              smallImage:
                {
                  __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                  id: '940c55f1-6aa1-4a9d-8026-5f29af18f5e6',
                  contentTimestamp: new Date('Thu Jul 23 2020 11:01:14 GMT+0300 (EEST)'),
                  largeImage:
                    {
                      __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                      id: '54d248cd-9933-4b8e-baee-70251eb2f6ec',
                      contentTimestamp: new Date('Thu Jul 09 2020 13:42:50 GMT+0300 (EEST)'),
                      googlePayTokens: [],
                      mrs:
                        {
                          __type: 'com.ukrsibbank.client.protocol.product.card.MrsMto',
                          points: 0,
                          status: 'NOT_INVOLVE',
                          firstConnect: true
                        },
                      category:
                        {
                          __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                          name: 'CARD'
                        }
                    }
                }
            },
            {
              __type: 'com.ukrsibbank.client.protocol.product.card.CardMto',
              accountId: '1339217120',
              number: '5215 6710 0041 6329',
              holderName: '<string[16]>',
              statusText: null,
              lightImage: false,
              canTransferFrom: true,
              canTransferTo: true,
              canBlock: true,
              canUnblock: false,
              canUpdateSmsService: true,
              cardLimitsAvailable: true,
              canUpdatePinCode: true,
              canEditSecretWord: true,
              canActivate: false,
              canAddToApplePay: true,
              canAddToGooglePay: true,
              canShowCvv: true,
              id: '5580458613',
              name: 'MasterCard World Black Edition',
              alias: 'MC BLACK EDITION',
              reminder: null,
              warning: null,
              status:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.card.CardStatusMto',
                  name: 'ACTIVE'
                },
              expirationDate: new Date('Fri Mar 31 2023 00:00:00 GMT+0300 (EEST)'),
              smallImage:
                {
                  __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                  id: '940c55f1-6aa1-4a9d-8026-5f29af18f5e6',
                  contentTimestamp: new Date('Thu Jul 23 2020 11:01:14 GMT+0300 (EEST)'),
                  largeImage:
                    {
                      __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                      id: '54d248cd-9933-4b8e-baee-70251eb2f6ec',
                      contentTimestamp: new Date('Thu Jul 09 2020 13:42:50 GMT+0300 (EEST)'),
                      googlePayTokens:
                        [
                          {
                            __type: 'com.ukrsibbank.client.protocol.product.card.CardTokenInfoMto',
                            tokenId: 'DAPLMC000014638720978b488a9f4be3b08ddc4ec9b1cf22',
                            tokenServiceProvider:
                              {
                                __type: 'com.ukrsibbank.client.protocol.product.card.TokenServiceProviderMto',
                                name: 'MASTERCARD'
                              }
                          }
                        ],
                      mrs:
                        {
                          __type: 'com.ukrsibbank.client.protocol.product.card.MrsMto',
                          points: 0,
                          status: 'CAN_INVOLVE',
                          firstConnect: true
                        },
                      category:
                        {
                          __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                          name: 'CARD'
                        }
                    }
                }
            },
            {
              __type: 'com.ukrsibbank.client.protocol.product.card.CardMto',
              accountId: '1339217122',
              number: '5215 6710 0028 6326',
              holderName: '<string[16]>',
              statusText: null,
              lightImage: false,
              canTransferFrom: false,
              canTransferTo: false,
              canBlock: true,
              canUnblock: false,
              canUpdateSmsService: true,
              cardLimitsAvailable: true,
              canUpdatePinCode: true,
              canEditSecretWord: true,
              canActivate: false,
              canAddToApplePay: true,
              canAddToGooglePay: true,
              canShowCvv: true,
              id: '2941067027',
              name: 'MasterCard World Black Edition',
              alias: 'MC BLACK EDITION',
              reminder: null,
              warning: null,
              status:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.card.CardStatusMto',
                  name: 'ACTIVE'
                },
              expirationDate: new Date('Sun Jul 31 2022 00:00:00 GMT+0300 (EEST)'),
              smallImage:
                {
                  __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                  id: '940c55f1-6aa1-4a9d-8026-5f29af18f5e6',
                  contentTimestamp: new Date('Thu Jul 23 2020 11:01:14 GMT+0300 (EEST)'),
                  largeImage:
                    {
                      __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                      id: '54d248cd-9933-4b8e-baee-70251eb2f6ec',
                      contentTimestamp: new Date('Thu Jul 09 2020 13:42:50 GMT+0300 (EEST)'),
                      googlePayTokens:
                        [
                          {
                            __type: 'com.ukrsibbank.client.protocol.product.card.CardTokenInfoMto',
                            tokenId: 'DSHRMC00001463878ed4aaf1408e41aeb5dcbc3b00b23513',
                            tokenServiceProvider:
                              {
                                __type: 'com.ukrsibbank.client.protocol.product.card.TokenServiceProviderMto',
                                name: 'MASTERCARD'
                              }
                          }
                        ],
                      mrs:
                        {
                          __type: 'com.ukrsibbank.client.protocol.product.card.MrsMto',
                          points: 0,
                          status: 'NOT_INVOLVE',
                          firstConnect: true
                        },
                      category:
                        {
                          __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                          name: 'CARD'
                        }
                    }
                }
            },
            {
              __type: 'com.ukrsibbank.client.protocol.product.card.CardMto',
              accountId: '16162766038',
              number: '5341 4701 2421 8464',
              holderName: '<string[16]>',
              statusText: null,
              lightImage: false,
              canTransferFrom: true,
              canTransferTo: true,
              canBlock: true,
              canUnblock: false,
              canUpdateSmsService: true,
              cardLimitsAvailable: true,
              canUpdatePinCode: true,
              canEditSecretWord: true,
              canActivate: false,
              canAddToApplePay: true,
              canAddToGooglePay: true,
              canShowCvv: true,
              id: '16162766082',
              name: 'MasterCard World RCC PayPass',
              alias: 'MC World RCC PayPass',
              reminder: null,
              warning: null,
              status:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.card.CardStatusMto',
                  name: 'ACTIVE'
                },
              expirationDate: new Date('Sat Aug 31 2024 00:00:00 GMT+0300 (EEST)'),
              smallImage:
                {
                  __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                  id: 'c756da5f-59ec-4222-9585-b2f76d0a9999',
                  contentTimestamp: new Date('Thu Jul 23 2020 11:04:36 GMT+0300 (EEST)'),
                  largeImage:
                    {
                      __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                      id: '54d248cd-9933-4b8e-baee-70251eb2f6ec',
                      contentTimestamp: new Date('Thu Jul 09 2020 13:42:50 GMT+0300 (EEST)'),
                      googlePayTokens:
                        [
                          {
                            __type: 'com.ukrsibbank.client.protocol.product.card.CardTokenInfoMto',
                            tokenId: 'DAPLMC0000146387154954c86b1c43febd56895130107284',
                            tokenServiceProvider:
                              {
                                __type: 'com.ukrsibbank.client.protocol.product.card.TokenServiceProviderMto',
                                name: 'MASTERCARD'
                              }
                          }
                        ],
                      mrs:
                        {
                          __type: 'com.ukrsibbank.client.protocol.product.card.MrsMto',
                          points: 0,
                          status: 'NOT_INVOLVE',
                          firstConnect: true
                        },
                      category:
                        {
                          __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                          name: 'CARD'
                        }
                    }
                }
            }
          ],
        deposits: [],
        loans: [],
        foreignCards:
          [
            {
              __type: 'com.ukrsibbank.client.protocol.product.card.ForeignCardMto',
              number: '5168 75** **** 8804',
              issuer: null,
              expired: false,
              canTransferFrom: true,
              canTransferTo: true,
              id: '871051774',
              name: 'NIKOLAY NIKOLAEV',
              alias: 'NIKOLAY NIKOLAEV',
              reminder: null,
              warning: null,
              expiration: null,
              paymentSystem:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.PaymentSystemMto',
                  name: 'MASTERCARD'
                },
              category:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                  name: 'FOREIGN_CARD'
                }
            },
            {
              __type: 'com.ukrsibbank.client.protocol.product.card.ForeignCardMto',
              number: '5351 29** **** 0561',
              issuer: null,
              expired: false,
              canTransferFrom: true,
              canTransferTo: true,
              id: '2417430580',
              name: 'Кум',
              alias: 'Кум',
              reminder: null,
              warning: null,
              expiration: null,
              paymentSystem:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.PaymentSystemMto',
                  name: 'MASTERCARD'
                },
              category:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                  name: 'FOREIGN_CARD'
                }
            },
            {
              __type: 'com.ukrsibbank.client.protocol.product.card.ForeignCardMto',
              number: '4149 62** **** 0913',
              issuer: null,
              expired: false,
              canTransferFrom: true,
              canTransferTo: true,
              id: '2317808412',
              name: 'NIKOLAY NIKOLAEV',
              alias: 'NIKOLAY NIKOLAEV',
              reminder: null,
              warning: null,
              expiration: null,
              paymentSystem:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.PaymentSystemMto',
                  name: 'VISA'
                },
              category:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                  name: 'FOREIGN_CARD'
                }
            },
            {
              __type: 'com.ukrsibbank.client.protocol.product.card.ForeignCardMto',
              number: '5375 41** **** 3902',
              issuer: null,
              expired: false,
              canTransferFrom: true,
              canTransferTo: true,
              id: '3051260524',
              name: 'my mono',
              alias: 'my mono',
              reminder: null,
              warning: null,
              expiration: null,
              paymentSystem:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.PaymentSystemMto',
                  name: 'MASTERCARD'
                },
              category:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                  name: 'FOREIGN_CARD'
                }
            },
            {
              __type: 'com.ukrsibbank.client.protocol.product.card.ForeignCardMto',
              number: '5169 30** **** 7100',
              issuer: null,
              expired: false,
              canTransferFrom: true,
              canTransferTo: true,
              id: '2771938828',
              name: 'NIKOLAY NIKOLAEV',
              alias: 'NIKOLAY NIKOLAEV',
              reminder: null,
              warning: null,
              expiration: null,
              paymentSystem:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.PaymentSystemMto',
                  name: 'MASTERCARD'
                },
              category:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                  name: 'FOREIGN_CARD'
                }
            },
            {
              __type: 'com.ukrsibbank.client.protocol.product.card.ForeignCardMto',
              number: '5375 41** **** 0545',
              issuer: null,
              expired: false,
              canTransferFrom: true,
              canTransferTo: true,
              id: '3944489048',
              name: 'NIKOLAY NIKOLAEV',
              alias: 'NIKOLAY NIKOLAEV',
              reminder: null,
              warning: null,
              expiration: null,
              paymentSystem:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.PaymentSystemMto',
                  name: 'MASTERCARD'
                },
              category:
                {
                  __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
                  name: 'FOREIGN_CARD'
                }
            }
          ]
      },
      [
        {
          product: {
            id: '1339217120',
            category: { __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto', name: 'ACCOUNT' }
          },
          account: {
            balance: 722.17,
            id: '1339217120',
            instrument: 'UAH',
            syncID: ['521567******6334', '5215671000416329', 'UA503510050000026203806627104'],
            title: 'ЗП Black edition картковий',
            type: 'ccard'
          }
        },
        {
          product: {
            id: '1339217122',
            category: { __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto', name: 'ACCOUNT' }
          },
          account: {
            balance: 4887.72,
            id: '1339217122',
            instrument: 'USD',
            syncID: ['5215671000286326', 'UA513510050000026208806627110'],
            title: 'Black edition картковий валюта',
            type: 'ccard'
          }
        },
        {
          product: {
            id: '67636824',
            category: { __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto', name: 'ACCOUNT' }
          },
          account: {
            balance: 0,
            id: '67636824',
            instrument: 'UAH',
            savings: true,
            syncID: ['UA263510050000026206612770800'],
            title: 'Black edition накопичувальний',
            type: 'checking'
          }
        },
        {
          product: {
            id: '2935435031',
            category: { __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto', name: 'ACCOUNT' }
          },
          account: {
            balance: 1300,
            id: '2935435031',
            instrument: 'USD',
            savings: true,
            syncID: ['UA133510050000026201808072168'],
            title: 'Black edition накопичувальний',
            type: 'checking'
          }
        },
        {
          product: {
            id: '16162766038',
            category: { __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto', name: 'ACCOUNT' }
          },
          account: {
            balance: 0,
            creditLimit: 200000,
            id: '16162766038',
            instrument: 'UAH',
            syncID: ['5341470124218464', 'UA313510050000026202967332618'],
            title: 'КАРТКА З ЛІМІТОМ',
            type: 'ccard'
          }
        }
      ]
    ]
  ])('converts credit card', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
