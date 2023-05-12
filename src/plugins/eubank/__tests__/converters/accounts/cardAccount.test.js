import { convertAccounts } from '../../../converters'

describe('convertAccount', () => {
  it.each([
    [
      [
        {
          account: {
            currency: 'KZT',
            number: 'KZ799480008A02824084',
            priority: 0,
            title: 'Карточный счёт',
            type: 'CARD',
            status: 'ACTIVE',
            multiCurrency: false
          },
          details: {
            actions: [
              'BCRD',
              'CRCR',
              'CRED',
              'CRIR',
              'DEOP',
              'FREF',
              'INPS',
              'OUPS',
              'PAYM',
              'SMTI',
              'STMT',
              'TLCC',
              'TLOC',
              'TOUC',
              'TOUT',
              'TSLF',
              'BCRD',
              'CRCR',
              'CRED',
              'CRIR',
              'DEOP',
              'FREF',
              'INPS',
              'OUPS',
              'PAYM',
              'SMTI',
              'STMT',
              'TLCC',
              'TLOC',
              'TOUC',
              'TOUT',
              'TSLF',
              'BCRD',
              'CRCR',
              'CRED',
              'CRIR',
              'DEOP',
              'FREF',
              'INPS',
              'OUPS',
              'PAYM',
              'SMTI',
              'STMT',
              'TLCC',
              'TLOC',
              'TOUC',
              'TOUT',
              'TSLF'
            ],
            currency: 'KZT',
            number: 'KZ799480008A02824084',
            priority: 0,
            title: 'Eurasian Gold',
            type: 'CARD',
            actualBalance: 2371.41,
            status: 'ACTIVE',
            balance: 3366.41,
            blockedSum: 995,
            hasStandingOrders: false,
            multiCurrency: false,
            branchTitle: 'Филиал №7 г.Костанай',
            dateClosed: 0,
            dateOpened: 1543860000000,
            interestRate: 0,
            limits: {
              currency: 'KZT',
              dayLimit: 5000000.0000,
              monthLimit: 0.0000,
              operationLimit: 2000000.0000,
              weekLimit: 0.0000
            },
            minBalance: 0,
            cards: [
              {
                id: 2812298,
                nameEmbossed: 'NIKOLAY NIKOLAEV',
                number: '526994******0417',
                status: 'ACTIVE',
                priority: 1,
                cardLimits: [],
                expiration: 1703959200000,
                cardTransactionStatus: 'ALLT',
                isPINSet: true,
                isIVR: true,
                hash: '1DB90E231ED55F8A1330E905108A9A439871F332',
                type: 'MC_GOLD_PAY_PASS',
                allowWebTransactions: true
              }
            ],
            overdraft: 0,
            ownFunds: 3366.41,
            currentInterest: 0,
            lastMonthInterest: 0,
            allPeriodInterest: 0,
            cashbackForPeriod: 0,
            periodOfCashBack: 0,
            totalCashback: 0,
            subAccountBalances: [],
            subAccountAvailableBalances: [],
            subAccountActionKZT: [],
            subAccountActionUSD: [],
            subAccountActionEUR: [],
            installmentAccount: false,
            activeInstallments: false,
            accountGraceInfo: {
              unusedCreditLimit: null,
              totalLoan: null,
              minimalPayment: null,
              nextBillingDate: null,
              nextDueDate: null,
              own: null,
              overdue: null,
              overlimit: null,
              penalty: null,
              creditLimit: null,
              graceFailedFee: null,
              gracePaymentAmount: null
            },
            finBlocking: 0,
            isGrace: false,
            fullDebtAmount: 0,
            showBalance: true,
            allowTransfer: true
          }
        }
      ],
      {
        accounts: [
          {
            mainProduct: {
              number: 'KZ799480008A02824084',
              type: 'card'
            },
            account: {
              id: '2824084',
              type: 'ccard',
              title: '*0417',
              instrument: 'KZT',
              syncID: [
                'KZ799480008A02824084',
                '526994******0417'
              ],
              balance: 2371.41
            }
          }
        ],
        accountsByNumber: {
          KZ799480008A02824084: {
            id: '2824084',
            type: 'ccard',
            title: '*0417',
            instrument: 'KZT',
            syncID: [
              'KZ799480008A02824084',
              '526994******0417'
            ],
            balance: 2371.41
          }
        }
      }
    ],
    [
      [
        {
          account: {
            currency: 'KZT',
            number: 'KZ899480005A02924349',
            priority: 1,
            title: 'Black картсчет',
            type: 'CARD',
            status: 'ACTIVE',
            multiCurrency: true
          },
          details: {
            actions: [
              'BCRD',
              'CRCR',
              'CRED',
              'CRIR',
              'DEOP',
              'FREF',
              'INPS',
              'OUPS',
              'PAYM',
              'SMTI',
              'STMT',
              'TINT',
              'TLCC',
              'TLOC',
              'TOUC',
              'TOUT',
              'TSLF',
              'BCRD',
              'CRCR',
              'CRED',
              'CRIR',
              'DEOP',
              'FREF',
              'INPS',
              'OUPS',
              'PAYM',
              'SMTI',
              'STMT',
              'TINT',
              'TLCC',
              'TLOC',
              'TOUC',
              'TOUT',
              'TSLF'
            ],
            currency: 'KZT',
            number: 'KZ899480005A02924349',
            priority: 1,
            title: 'Black картсчет',
            type: 'CARD',
            actualBalance: 1058768.37,
            status: 'ACTIVE',
            balance: 1058768.37,
            blockedSum: 0,
            hasStandingOrders: false,
            multiCurrency: true,
            branchTitle: 'Филиал №4 г.Караганда',
            dateClosed: 0,
            dateOpened: 1549908000000,
            interestRate: 0,
            limits:
              {
                currency: 'KZT',
                dayLimit: 5000000,
                monthLimit: 0,
                operationLimit: 2000000,
                weekLimit: 0
              },
            minBalance: 0,
            cards:
              [
                {
                  id: 3044086,
                  nameEmbossed: 'NIKOLAY NIKOLAEV',
                  number: '530496******2688',
                  status: 'ACTIVE',
                  priority: 1,
                  cardLimits: [],
                  expiration: 1727632800000,
                  cardTransactionStatus: 'FULL',
                  isPINSet: true,
                  isIVR: true,
                  hash: 'F6B62C23F79152609BCB24C674CD27776606FCD7',
                  type: 'MC_BLACK',
                  allowWebTransactions: true
                }
              ],
            overdraft: 0,
            ownFunds: 1058768.37,
            currentInterest: 0,
            lastMonthInterest: 0,
            allPeriodInterest: 0,
            cashbackForPeriod: 0,
            periodOfCashBack: 0,
            totalCashback: 0,
            subAccountBalances:
              [
                { amount: 22743.64, currency: 'KZT' },
                { amount: 2462.27, currency: 'USD' },
                { amount: 0, currency: 'EUR' }
              ],
            subAccountAvailableBalances:
              [
                { amount: 22743.64, currency: 'KZT' },
                { amount: 2462.27, currency: 'USD' },
                { amount: 0, currency: 'EUR' }
              ],
            subAccountActionKZT:
              [
                'CRED',
                'TSLF',
                'TLOC',
                'PAYM',
                'TOUT',
                'TLCC',
                'TOUC',
                'OUPS',
                'INPS',
                'SMTO',
                'SMTI',
                'CRCR',
                'CRIR'
              ],
            subAccountActionUSD: ['CRED', 'TSLF', 'TLOC', 'TINT'],
            subAccountActionEUR: ['CRED', 'TSLF', 'TLOC', 'TINT'],
            installmentAccount: false,
            activeInstallments: false,
            accountGraceInfo:
              {
                unusedCreditLimit: null,
                totalLoan: null,
                minimalPayment: null,
                nextBillingDate: null,
                nextDueDate: null,
                own: null,
                overdue: null,
                overlimit: null,
                penalty: null,
                creditLimit: null,
                graceFailedFee: null,
                gracePaymentAmount: null
              },
            finBlocking: 0,
            isGrace: false,
            fullDebtAmount: 0,
            showBalance: true,
            allowTransfer: true
          }
        }
      ],
      {
        accounts: [
          {
            mainProduct: {
              number: 'KZ899480005A02924349',
              type: 'card'
            },
            accounts: [
              {
                id: '2924349-KZT',
                type: 'ccard',
                title: '*2688-KZT',
                instrument: 'KZT',
                syncID: [
                  'KZ899480005A02924349',
                  '530496******2688'
                ],
                balance: 22743.64
              },
              {
                id: '2924349-USD',
                type: 'ccard',
                title: '*2688-USD',
                instrument: 'USD',
                syncID: [
                  'KZ899480005A02924349',
                  '530496******2688'
                ],
                balance: 2462.27
              },
              {
                id: '2924349-EUR',
                type: 'ccard',
                title: '*2688-EUR',
                instrument: 'EUR',
                syncID: [
                  'KZ899480005A02924349',
                  '530496******2688'
                ],
                balance: 0
              }
            ]
          }
        ],
        accountsByNumber: {
          KZ899480005A02924349: [
            {
              id: '2924349-KZT',
              type: 'ccard',
              title: '*2688-KZT',
              instrument: 'KZT',
              syncID: [
                'KZ899480005A02924349',
                '530496******2688'
              ],
              balance: 22743.64
            },
            {
              id: '2924349-USD',
              type: 'ccard',
              title: '*2688-USD',
              instrument: 'USD',
              syncID: [
                'KZ899480005A02924349',
                '530496******2688'
              ],
              balance: 2462.27
            },
            {
              id: '2924349-EUR',
              type: 'ccard',
              title: '*2688-EUR',
              instrument: 'EUR',
              syncID: [
                'KZ899480005A02924349',
                '530496******2688'
              ],
              balance: 0
            }
          ]
        }
      }
    ],
    [
      [
        {
          account: {
            actions: ['CRED', 'CRIR', 'DEOP', 'STMT', 'TLOC', 'TSLF', 'USBN'],
            currency: 'RUB',
            number: 'KZ729480007A03851295',
            priority: 0,
            title: 'Карточный счёт',
            type: 'CARD',
            allowBalance: true,
            allowCreateFinDoc: true,
            status: 'ACTIVE',
            multiCurrency: true,
            cards: [],
            subAccountActionKZT: ['CRED', 'TSLF', 'TLOC', 'PAYM', 'TOUT', 'TLCC', 'TOUC', 'OUPS', 'INPS', 'SMTO', 'SMTI', 'CRCR', 'CRIR'],
            subAccountActionUSD: ['CRED', 'TSLF', 'TLOC', 'TINT'],
            subAccountActionEUR: ['CRED', 'TSLF', 'TLOC', 'TINT'],
            isGrace: false,
            showBalance: true,
            allowTransfer: true
          },
          details: {
            actions:
              ['CRED', 'CRIR', 'DEOP', 'STMT', 'TLOC', 'TSLF', 'USBN', 'CRED', 'CRIR', 'DEOP', 'STMT', 'TLOC', 'TSLF', 'USBN'],
            currency: 'RUB',
            number: 'KZ729480007A03851295',
            priority: 0,
            title: 'Карточный счёт',
            type: 'CARD',
            allowBalance: true,
            allowCreateFinDoc: true,
            actualBalance: 0,
            status: 'ACTIVE',
            balance: 0,
            blockedSum: 0,
            hasStandingOrders: false,
            multiCurrency: true,
            contractNo: '',
            parentAccountId: 65836835,
            id: 65836837,
            branchTitle: 'Филиал №6 г.Алматы',
            dateClosed: 0,
            dateOpened: 1626976800000,
            interestRate: 0,
            limits:
              {
                currency: 'KZT',
                dayLimit: 5000000,
                monthLimit: 0,
                operationLimit: 2000000,
                weekLimit: 0
              },
            minBalance: 0,
            cards: [],
            overdraft: 0,
            ownFunds: 0,
            currentInterest: 0,
            lastMonthInterest: 0,
            allPeriodInterest: 0,
            cashbackForPeriod: 0,
            periodOfCashBack: 0,
            totalCashback: 0,
            subAccountBalances:
              [
                { amount: 0, currency: 'KZT' },
                { amount: 0, currency: 'USD' },
                { amount: 0, currency: 'EUR' }
              ],
            subAccountAvailableBalances: [],
            subAccountActionKZT: ['CRED', 'TSLF', 'TLOC', 'PAYM', 'TOUT', 'TLCC', 'TOUC', 'OUPS', 'INPS', 'SMTO', 'SMTI', 'CRCR', 'CRIR '],
            subAccountActionUSD: ['CRED', 'TSLF', 'TLOC', 'TINT'],
            subAccountActionEUR: ['CRED', 'TSLF', 'TLOC', 'TINT'],
            installmentAccount: false,
            activeInstallments: false,
            accountGraceInfo:
              {
                unusedCreditLimit: null,
                totalLoan: null,
                minimalPayment: null,
                nextBillingDate: null,
                nextDueDate: null,
                own: null,
                overdue: null,
                overlimit: null,
                penalty: null,
                creditLimit: null,
                graceFailedFee: null,
                gracePaymentAmount: null
              },
            finBlocking: 0,
            isGrace: false,
            fullDebtAmount: 0,
            cardProductOperation:
              {
                id: 100010,
                productId: 1337,
                version: 1,
                multiCurrency: true,
                installment: false
              },
            showBalance: true,
            allowTransfer: true
          },
          code: 1,
          errorMessage: null,
          errorCode: null,
          formErrors: null,
          bodyType: 'CardAccount',
          success: true
        }
      ],
      {
        accounts: [
          {
            mainProduct: { number: 'KZ729480007A03851295', type: 'card' },
            accounts: [
              {
                id: '3851295-KZT',
                balance: 0,
                instrument: 'KZT',
                syncID: ['KZ729480007A03851295'],
                title: '*1295-KZT',
                type: 'ccard'
              },
              {
                id: '3851295-USD',
                balance: 0,
                instrument: 'USD',
                syncID: ['KZ729480007A03851295'],
                title: '*1295-USD',
                type: 'ccard'
              },
              {
                id: '3851295-EUR',
                balance: 0,
                instrument: 'EUR',
                syncID: ['KZ729480007A03851295'],
                title: '*1295-EUR',
                type: 'ccard'
              }
            ]
          }
        ],
        accountsByNumber: {
          KZ729480007A03851295: [
            {
              id: '3851295-KZT',
              balance: 0,
              instrument: 'KZT',
              syncID: ['KZ729480007A03851295'],
              title: '*1295-KZT',
              type: 'ccard'
            },
            {
              id: '3851295-USD',
              balance: 0,
              instrument: 'USD',
              syncID: ['KZ729480007A03851295'],
              title: '*1295-USD',
              type: 'ccard'
            },
            {
              id: '3851295-EUR',
              balance: 0,
              instrument: 'EUR',
              syncID: ['KZ729480007A03851295'],
              title: '*1295-EUR',
              type: 'ccard'
            }
          ]
        }
      }
    ]
  ])('converts account', (apiAccount, account) => {
    expect(convertAccounts(apiAccount)).toEqual(account)
  })
})
