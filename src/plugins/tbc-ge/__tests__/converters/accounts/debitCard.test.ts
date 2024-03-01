import { convertAccounts } from '../../../legacy/converters'
import { FetchedAccounts } from '../../../legacy/models'

it.each([
  [
    {
      accounts: [
        {
          tag: 'account',
          product: {
            id: 14584949,
            coreAccountId: 10971234,
            primary: false,
            canBePrimary: true,
            hidden: false,
            friendlyName: 'My Account',
            iban: 'GE59TB7692945061654321',
            displayChildCard: false,
            productPartyContractId: 70374236,
            subType: 'A_200_11',
            subTypeText: 'MC STANDARD',
            currency: 'GEL',
            priority: 1,
            availableBalance: 388.52,
            paymentOperationTypeContexts: [
              {
                code: null,
                operationType: '4.31.01.06-01',
                context: null
              },
              {
                code: null,
                operationType: '4.31.01.11-01',
                context: null
              },
              {
                code: null,
                operationType: '4.31.01.16-01',
                context: 'CREDIT'
              },
              {
                code: null,
                operationType: '4.31.01.16-01',
                context: 'DEBIT'
              },
              {
                code: null,
                operationType: '4.31.01.16-01',
                context: 'MONEYBOX'
              },
              {
                code: null,
                operationType: '4.31.01.17-01',
                context: null
              },
              {
                code: null,
                operationType: '4.31.03.02-01',
                context: null
              },
              {
                code: null,
                operationType: '4.31.03.06-01',
                context: null
              },
              {
                code: null,
                operationType: '4.31.03.11-01',
                context: null
              },
              {
                code: null,
                operationType: '4.31.05.01-01',
                context: null
              }
            ],
            accountMatrixCategorisations: [
              'DEBIT_CARDS'
            ],
            externalAccountId: '815502917'
          }
        }
      ],
      debitCardsWithBlockations: [
        {
          iban: 'GE59TB7692945061654321',
          displayChildCard: false,
          cards: [
            {
              tibcoCard: {
                id: '1004712099',
                cardType: 'MIX',
                cardholderName: 'ANTON ANTONOV',
                cardholderId: '7746929',
                userIsCardHolder: false,
                cardNumber: '5916',
                expirationDate: 1774900800000,
                cardStatusCode: 'C_0',
                cardStatusText: 'Active',
                cardPicture: '315',
                blockedAmount: 340.04,
                availableAmount: 48.48,
                availableAmountInGel: 48.48,
                availableBalanceForCash: 48.48,
                availableBalanceForCashInGel: 48.48,
                priorityCurrency: 'GEL',
                renewApplication: false,
                productId: '92',
                renewalAllowed: false,
                pinResetAllowed: false,
                paySticker: false,
                accountName: 'My Account',
                vertical: false,
                harmPaymentRestrictionPossibility: true,
                harmPaymentRestriction: false
              },
              blockedMovements: [
                {
                  dateTime: 1648392834000,
                  location: 'Glovo>Tbilisi GE',
                  operationAmount: 91.5,
                  operationCurrency: 'GEL',
                  blockedAmount: 91.5,
                  blockedCurrency: 'GEL',
                  reversal: false,
                  credit: false
                },
                {
                  dateTime: 1648832347000,
                  location: 'i.m Maguli Dimitradze>batumi GE',
                  operationAmount: 6.2,
                  operationCurrency: 'GEL',
                  blockedAmount: 6.2,
                  blockedCurrency: 'GEL',
                  reversal: false,
                  credit: false
                }
              ]
            }
          ]
        }
      ],
      creditCardsWithBlockations: []
    },
    [
      {
        account: {
          balance: 290.82, // 388.52,
          id: '10971234',
          instrument: 'GEL',
          syncIds: [
            'GE59TB7692945061654321',
            '5916'
          ],
          title: 'My Account',
          type: 'ccard'
        },
        coreAccountId: 10971234,
        holdTransactions: [
          {
            comment: null,
            date: new Date('2022-03-27T14:53:54.000Z'),
            hold: true,
            merchant: {
              city: 'Tbilisi',
              country: 'GE',
              location: null,
              mcc: null,
              title: 'Glovo'
            },
            movements: [
              {
                account: {
                  id: '10971234'
                },
                fee: 0,
                id: null,
                invoice: null,
                sum: -91.5
              }
            ]
          },
          {
            comment: null,
            date: new Date('2022-04-01T16:59:07.000Z'),
            hold: true,
            merchant: {
              city: 'batumi',
              country: 'GE',
              location: null,
              mcc: null,
              title: 'i.m Maguli Dimitradze'
            },
            movements: [
              {
                account: {
                  id: '10971234'
                },
                fee: 0,
                id: null,
                invoice: null,
                sum: -6.2
              }
            ]
          }
        ],
        tag: 'card'
      }
    ]
  ],
  [
    {
      accounts: [
        {
          tag: 'account',
          product: {
            id: 14779135,
            coreAccountId: 11124441,
            primary: false,
            canBePrimary: true,
            hidden: false,
            friendlyName: 'My Account',
            iban: 'GE76TB7199645068100016',
            displayChildCard: false,
            productPartyContractId: 71612191,
            subType: 'A_200_10',
            subTypeText: 'MC GOLD',
            currency: 'GEL',
            priority: 1,
            availableBalance: 997.29,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.06-01', context: null },
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                {
                  code: null,
                  operationType: '4.31.01.16-01',
                  context: 'MONEYBOX'
                },
                { code: null, operationType: '4.31.01.17-01', context: null },
                { code: null, operationType: '4.31.03.02-01', context: null },
                { code: null, operationType: '4.31.03.06-01', context: null },
                { code: null, operationType: '4.31.03.11-01', context: null },
                { code: null, operationType: '4.31.05.01-01', context: null }
              ],
            accountMatrixCategorisations: ['DEBIT_CARDS'],
            externalAccountId: '815635428'
          }
        },
        {
          tag: 'account',
          product: {
            id: 14779136,
            coreAccountId: 11124442,
            primary: false,
            canBePrimary: false,
            hidden: false,
            friendlyName: 'My Account',
            iban: 'GE76TB7199645068100016',
            displayChildCard: false,
            productPartyContractId: 71612192,
            subType: 'A_200_10',
            subTypeText: 'MC GOLD',
            currency: 'USD',
            priority: 2,
            availableBalance: 0,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                { code: null, operationType: '4.35.01.01-01', context: null }
              ],
            accountMatrixCategorisations: ['DEBIT_CARDS'],
            externalAccountId: '815635429'
          }
        },
        {
          tag: 'account',
          product: {
            id: 14779137,
            coreAccountId: 11124443,
            primary: false,
            canBePrimary: false,
            hidden: false,
            friendlyName: 'My Account',
            iban: 'GE76TB7199645068100016',
            displayChildCard: false,
            productPartyContractId: 71612193,
            subType: 'A_200_10',
            subTypeText: 'MC GOLD',
            currency: 'EUR',
            priority: 3,
            availableBalance: 0,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                { code: null, operationType: '4.35.01.01-01', context: null }
              ],
            accountMatrixCategorisations: ['DEBIT_CARDS'],
            externalAccountId: '815635430'
          }
        }
      ],
      debitCardsWithBlockations: [
        {
          iban: 'GE76TB7199645068100016',
          displayChildCard: false,
          cards: [
            {
              tibcoCard: {
                id: '1004788017',
                cardType: 'MC GOLD',
                cardholderName: 'ALEKSEI MINASIAN',
                cardholderId: '7771996',
                userIsCardHolder: false,
                cardNumber: '3944',
                expirationDate: 1777492800000,
                cardStatusCode: 'C_0',
                cardStatusText: 'Active',
                cardPicture: '302',
                blockedAmount: 65.75,
                availableAmount: 931.54,
                availableAmountInGel: 931.54,
                availableBalanceForCash: 931.54,
                availableBalanceForCashInGel: 931.54,
                priorityCurrency: 'GEL',
                renewApplication: false,
                productId: '75',
                renewalAllowed: true,
                pinResetAllowed: true,
                paySticker: false,
                accountName: 'My Account',
                vertical: false,
                harmPaymentRestrictionPossibility: true,
                harmPaymentRestriction: false
              },
              blockedMovements: [
                {
                  dateTime: 1651384127000,
                  location: 'Glovo 01MAY GEV3R8VEA>BARCELONA ES',
                  operationAmount: 58.65,
                  operationCurrency: 'GEL',
                  blockedAmount: 58.65,
                  blockedCurrency: 'GEL',
                  reversal: false,
                  credit: false
                },
                {
                  dateTime: 1651384127000,
                  location: 'Glovo 01MAY GEV3R8VEA>BARCELONA ES',
                  operationAmount: 2.9,
                  operationCurrency: 'GEL',
                  blockedAmount: 2.9,
                  blockedCurrency: 'GEL',
                  reversal: true,
                  credit: false
                },
                {
                  dateTime: 1651398811000,
                  location: 'SOPIO MZHAVANADZE I/E>BATUMI GE',
                  operationAmount: 10,
                  operationCurrency: 'GEL',
                  blockedAmount: 10,
                  blockedCurrency: 'GEL',
                  reversal: false,
                  credit: false
                }
              ]
            }
          ]
        }
      ],
      creditCardsWithBlockations: []
    },
    [
      {
        account: {
          balance: 931.54, // 997.29,
          id: '11124441',
          instrument: 'GEL',
          syncIds: [
            'GE76TB7199645068100016',
            '3944'
          ],
          title: 'My Account',
          type: 'ccard'
        },
        coreAccountId: 11124441,
        holdTransactions: [
          {
            comment: null,
            date: new Date('2022-05-01T05:48:47.000Z'),
            hold: true,
            merchant: { city: 'BARCELONA', country: 'ES', location: null, mcc: null, title: 'Glovo 01MAY GEV3R8VEA' },
            movements: [{ account: { id: '11124441' }, fee: 0, id: null, invoice: null, sum: -58.65 }]
          },
          {
            comment: null,
            date: new Date('2022-05-01T05:48:47.000Z'),
            hold: true,
            merchant: { city: 'BARCELONA', country: 'ES', location: null, mcc: null, title: 'Glovo 01MAY GEV3R8VEA' },
            movements: [{ account: { id: '11124441' }, fee: 0, id: null, invoice: null, sum: 2.9 }]
          },
          {
            comment: null,
            date: new Date('2022-05-01T09:53:31.000Z'),
            hold: true,
            merchant: { city: 'BATUMI', country: 'GE', location: null, mcc: null, title: 'SOPIO MZHAVANADZE I/E' },
            movements: [{ account: { id: '11124441' }, fee: 0, id: null, invoice: null, sum: -10 }]
          }
        ],
        tag: 'card'
      },
      {
        account: {
          balance: 0,
          id: '11124442',
          instrument: 'USD',
          syncIds: [
            'GE76TB7199645068100016',
            '3944'
          ],
          title: 'My Account',
          type: 'ccard'
        },
        coreAccountId: 11124442,
        holdTransactions: [],
        tag: 'card'
      },
      {
        account: {
          balance: 0,
          id: '11124443',
          instrument: 'EUR',
          syncIds: [
            'GE76TB7199645068100016',
            '3944'
          ],
          title: 'My Account',
          type: 'ccard'
        },
        coreAccountId: 11124443,
        holdTransactions: [],
        tag: 'card'
      }
    ]
  ],
  [
    {
      accounts: [
        {
          tag: 'account',
          product: {
            id: 14251319,
            coreAccountId: 10719528,
            primary: false,
            canBePrimary: true,
            hidden: false,
            friendlyName: 'My Account',
            iban: 'GE53TB7786945064400003',
            displayChildCard: false,
            productPartyContractId: 65713174,
            subType: 'A_200_10',
            subTypeText: 'MC GOLD',
            currency: 'GEL',
            priority: 1,
            availableBalance: 77.43,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.06-01', context: null },
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                {
                  code: null,
                  operationType: '4.31.01.16-01',
                  context: 'MONEYBOX'
                },
                { code: null, operationType: '4.31.01.17-01', context: null },
                { code: null, operationType: '4.31.03.02-01', context: null },
                { code: null, operationType: '4.31.03.06-01', context: null },
                { code: null, operationType: '4.31.03.11-01', context: null },
                { code: null, operationType: '4.31.05.01-01', context: null }
              ],
            accountMatrixCategorisations: ['DEBIT_CARDS'],
            externalAccountId: '815245058'
          }
        },
        {
          tag: 'account',
          product: {
            id: 14251320,
            coreAccountId: 10719529,
            primary: false,
            canBePrimary: false,
            hidden: false,
            friendlyName: 'My Account',
            iban: 'GE53TB7786945064400003',
            displayChildCard: false,
            productPartyContractId: 65713175,
            subType: 'A_200_10',
            subTypeText: 'MC GOLD',
            currency: 'USD',
            priority: 2,
            availableBalance: 2698.71,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                { code: null, operationType: '4.35.01.01-01', context: null }
              ],
            accountMatrixCategorisations: ['DEBIT_CARDS'],
            externalAccountId: '815245059'
          }
        },
        {
          tag: 'account',
          product: {
            id: 14251321,
            coreAccountId: 10719530,
            primary: false,
            canBePrimary: false,
            hidden: false,
            friendlyName: 'My Account',
            iban: 'GE53TB7786945064400003',
            displayChildCard: false,
            productPartyContractId: 65713176,
            subType: 'A_200_10',
            subTypeText: 'MC GOLD',
            currency: 'EUR',
            priority: 3,
            availableBalance: 0,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                { code: null, operationType: '4.35.01.01-01', context: null }
              ],
            accountMatrixCategorisations: ['DEBIT_CARDS'],
            externalAccountId: '815245060'
          }
        }
      ],
      creditCardsWithBlockations: [],
      debitCardsWithBlockations: [
        {
          iban: 'GE53TB7786945064400003',
          displayChildCard: false,
          cards: [
            {
              tibcoCard: {
                id: '1004581311',
                cardType: 'VISA GOLD',
                cardholderName: 'VALENTIN NAUMOV',
                cardholderId: '7677869',
                userIsCardHolder: false,
                cardNumber: '5632',
                expirationDate: 1769803200000,
                cardStatusCode: 'C_0',
                cardStatusText: 'Active',
                cardPicture: '297',
                blockedAmount: 0,
                availableAmount: 8227.53,
                availableAmountInGel: 8227.53,
                availableBalanceForCash: 8227.53,
                availableBalanceForCashInGel: 8227.53,
                priorityCurrency: 'GEL',
                renewApplication: false,
                productId: '74',
                renewalAllowed: true,
                pinResetAllowed: true,
                paySticker: false,
                accountName: 'My Account',
                vertical: false,
                harmPaymentRestrictionPossibility: true,
                harmPaymentRestriction: false
              },
              blockedMovements: []
            },
            {
              tibcoCard: {
                id: '1004581312',
                cardType: 'MC GOLD',
                cardholderName: 'VALENTIN NAUMOV',
                cardholderId: '7677869',
                userIsCardHolder: false,
                cardNumber: '9871',
                expirationDate: 1769803200000,
                cardStatusCode: 'C_0',
                cardStatusText: 'Active',
                cardPicture: '302',
                blockedAmount: 0,
                availableAmount: 8227.53,
                availableAmountInGel: 8227.53,
                availableBalanceForCash: 8227.53,
                availableBalanceForCashInGel: 8227.53,
                priorityCurrency: 'GEL',
                renewApplication: false,
                productId: '75',
                renewalAllowed: true,
                pinResetAllowed: true,
                paySticker: false,
                accountName: 'My Account',
                vertical: false,
                harmPaymentRestrictionPossibility: true,
                harmPaymentRestriction: false
              },
              blockedMovements: []
            }
          ]
        }
      ]
    },
    [
      {
        account: {
          balance: 77.43,
          id: '10719528',
          instrument: 'GEL',
          syncIds: [
            'GE53TB7786945064400003',
            '5632',
            '9871'
          ],
          title: 'My Account',
          type: 'ccard'
        },
        coreAccountId: 10719528,
        holdTransactions: [],
        tag: 'card'
      },
      {
        account: {
          balance: 2698.71,
          id: '10719529',
          instrument: 'USD',
          syncIds: [
            'GE53TB7786945064400003',
            '5632',
            '9871'
          ],
          title: 'My Account',
          type: 'ccard'
        },
        coreAccountId: 10719529,
        holdTransactions: [],
        tag: 'card'
      },
      {
        account: {
          balance: 0,
          id: '10719530',
          instrument: 'EUR',
          syncIds: [
            'GE53TB7786945064400003',
            '5632',
            '9871'
          ],
          title: 'My Account',
          type: 'ccard'
        },
        coreAccountId: 10719530,
        holdTransactions: [],
        tag: 'card'
      }
    ]
  ],
  [
    {
      accounts: [
        {
          tag: 'account',
          product: {
            id: 13324138,
            coreAccountId: 10013905,
            primary: true,
            canBePrimary: true,
            hidden: false,
            friendlyName: 'My Account',
            iban: 'GE72TB7846645063400001',
            displayChildCard: false,
            productPartyContractId: 59982931,
            subType: 'A_200_38',
            subTypeText: 'CONCEPT VISA PLATINUM',
            currency: 'GEL',
            priority: 1,
            availableBalance: 0,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.06-01', context: null },
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                {
                  code: null,
                  operationType: '4.31.01.16-01',
                  context: 'MONEYBOX'
                },
                { code: null, operationType: '4.31.01.17-01', context: null },
                { code: null, operationType: '4.31.03.02-01', context: null },
                { code: null, operationType: '4.31.03.06-01', context: null },
                { code: null, operationType: '4.31.03.11-01', context: null },
                { code: null, operationType: '4.31.05.01-01', context: null }
              ],
            accountMatrixCategorisations: ['DEBIT_CARDS'],
            externalAccountId: '814587288'
          }
        },
        {
          tag: 'account',
          product: {
            id: 13324139,
            coreAccountId: 10013906,
            primary: false,
            canBePrimary: false,
            hidden: false,
            friendlyName: 'My Account',
            iban: 'GE72TB7846645063400001',
            displayChildCard: false,
            productPartyContractId: 59982932,
            subType: 'A_200_38',
            subTypeText: 'CONCEPT VISA PLATINUM',
            currency: 'USD',
            priority: 2,
            availableBalance: 30459.83,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                { code: null, operationType: '4.35.01.01-01', context: null }
              ],
            accountMatrixCategorisations: ['DEBIT_CARDS'],
            externalAccountId: '814587289'
          }
        },
        {
          tag: 'account',
          product: {
            id: 13324140,
            coreAccountId: 10013907,
            primary: false,
            canBePrimary: false,
            hidden: false,
            friendlyName: 'My Account',
            iban: 'GE72TB7846645063400001',
            displayChildCard: false,
            productPartyContractId: 59982933,
            subType: 'A_200_38',
            subTypeText: 'CONCEPT VISA PLATINUM',
            currency: 'EUR',
            priority: 3,
            availableBalance: 0,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                { code: null, operationType: '4.35.01.01-01', context: null }
              ],
            accountMatrixCategorisations: ['DEBIT_CARDS'],
            externalAccountId: '814587290'
          }
        }
      ],
      creditCardsWithBlockations: [],
      debitCardsWithBlockations: [
        {
          iban: 'GE72TB7846645063400001',
          displayChildCard: false,
          cards: [
            {
              tibcoCard: {
                id: '1004198091',
                cardType: 'CONCEPT VISA PLATINUM',
                cardholderName: 'SERGEI VAINIK',
                cardholderId: '7508466',
                userIsCardHolder: false,
                cardNumber: '6782',
                expirationDate: 1756584000000,
                cardStatusCode: 'C_0',
                cardStatusText: 'Active',
                cardPicture: '284',
                blockedAmount: 38800.2,
                availableAmount: 52427,
                availableAmountInGel: 52427,
                availableBalanceForCash: 52427,
                availableBalanceForCashInGel: 52427,
                priorityCurrency: 'GEL',
                renewApplication: false,
                productId: '107',
                renewalAllowed: true,
                pinResetAllowed: true,
                paySticker: false,
                accountName: 'My Account',
                vertical: false,
                harmPaymentRestrictionPossibility: true,
                harmPaymentRestriction: false
              },
              blockedMovements: [
                {
                  dateTime: 1651418341000,
                  location: 'Steam Purchase>425-952-2985 DE',
                  operationAmount: 149.95,
                  operationCurrency: 'ILS',
                  blockedAmount: 46.83,
                  blockedCurrency: 'USD',
                  reversal: false,
                  credit: false
                },
                {
                  dateTime: 1651655456000,
                  location: 'CHARTWELL INT. SCHOOL>BEOGRAD RS',
                  operationAmount: 1397243.38,
                  operationCurrency: 'RSD',
                  blockedAmount: 12903.8,
                  blockedCurrency: 'USD',
                  reversal: false,
                  credit: false
                }
              ]
            },
            {
              tibcoCard: {
                id: '1004199837',
                cardType: 'CONCEPT VISA PLATINUM',
                cardholderName: 'NATALIA VAINIK',
                cardholderId: '7508466',
                userIsCardHolder: false,
                cardNumber: '4538',
                expirationDate: 1756584000000,
                cardStatusCode: 'C_0',
                cardStatusText: 'Active',
                cardPicture: '284',
                blockedAmount: 38800.2,
                availableAmount: 52427,
                availableAmountInGel: 52427,
                availableBalanceForCash: 52427,
                availableBalanceForCashInGel: 52427,
                priorityCurrency: 'GEL',
                renewApplication: false,
                productId: '107',
                renewalAllowed: true,
                pinResetAllowed: true,
                paySticker: false,
                accountName: 'My Account',
                vertical: false,
                harmPaymentRestrictionPossibility: true,
                harmPaymentRestriction: false
              },
              blockedMovements: [
                {
                  dateTime: 1651607178000,
                  location: 'MP560 ORGANIC VASE PELB>eograd RS',
                  operationAmount: 471.97,
                  operationCurrency: 'RSD',
                  blockedAmount: 4.36,
                  blockedCurrency: 'USD',
                  reversal: false,
                  credit: false
                }
              ]
            }
          ]
        }
      ]
    },
    [
      {
        account: {
          balance: 0,
          id: '10013905',
          instrument: 'GEL',
          syncIds: [
            'GE72TB7846645063400001',
            '6782',
            '4538'
          ],
          title: 'My Account',
          type: 'ccard'
        },
        coreAccountId: 10013905,
        holdTransactions: [],
        tag: 'card'
      },
      {
        account: {
          balance: 17504.84, // 30459.83,
          id: '10013906',
          instrument: 'USD',
          syncIds: [
            'GE72TB7846645063400001',
            '6782',
            '4538'
          ],
          title: 'My Account',
          type: 'ccard'
        },
        coreAccountId: 10013906,
        holdTransactions: [
          {
            comment: null,
            date: new Date('2022-05-01T15:19:01.000Z'),
            hold: true,
            merchant: {
              city: '425-952-2985',
              country: 'DE',
              location: null,
              mcc: null,
              title: 'Steam Purchase'
            },
            movements: [
              {
                account: { id: '10013906' },
                fee: 0,
                id: null,
                invoice: {
                  instrument: 'ILS',
                  sum: -149.95
                },
                sum: -46.83
              }
            ]
          },
          {
            comment: null,
            date: new Date('2022-05-04T09:10:56.000Z'),
            hold: true,
            merchant: {
              city: 'BEOGRAD',
              country: 'RS',
              location: null,
              mcc: null,
              title: 'CHARTWELL INT. SCHOOL'
            },
            movements: [
              {
                account: { id: '10013906' },
                fee: 0,
                id: null,
                invoice: {
                  instrument: 'RSD',
                  sum: -1397243.38
                },
                sum: -12903.8
              }
            ]
          },
          {
            comment: null,
            date: new Date('2022-05-03T19:46:18.000Z'),
            hold: true,
            merchant: {
              city: 'eograd',
              country: 'RS',
              location: null,
              mcc: null,
              title: 'MP560 ORGANIC VASE PELB'
            },
            movements: [
              {
                account: { id: '10013906' },
                fee: 0,
                id: null,
                invoice: {
                  instrument: 'RSD',
                  sum: -471.97
                },
                sum: -4.36
              }
            ]
          }
        ],
        tag: 'card'
      },
      {
        account: {
          balance: 0,
          id: '10013907',
          instrument: 'EUR',
          syncIds: [
            'GE72TB7846645063400001',
            '6782',
            '4538'
          ],
          title: 'My Account',
          type: 'ccard'
        },
        coreAccountId: 10013907,
        holdTransactions: [],
        tag: 'card'
      }
    ]
  ],
  [
    {
      accounts: [
        {
          tag: 'account',
          product: {
            id: 14457704,
            coreAccountId: 10877527,
            primary: false,
            canBePrimary: true,
            hidden: false,
            friendlyName: 'Dasha',
            iban: 'GE23TB7407845064400001',
            displayChildCard: false,
            productPartyContractId: 68710911,
            subType: 'A_200_3',
            subTypeText: 'VISA GOLD',
            currency: 'GEL',
            priority: 1,
            availableBalance: 352.78,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.06-01', context: null },
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                {
                  code: null,
                  operationType: '4.31.01.16-01',
                  context: 'MONEYBOX'
                },
                { code: null, operationType: '4.31.01.17-01', context: null },
                { code: null, operationType: '4.31.03.02-01', context: null },
                { code: null, operationType: '4.31.03.06-01', context: null },
                { code: null, operationType: '4.31.03.11-01', context: null },
                { code: null, operationType: '4.31.05.01-01', context: null }
              ],
            accountMatrixCategorisations: ['DEBIT_CARDS'],
            externalAccountId: '815397048'
          }
        },
        {
          tag: 'account',
          product: {
            id: 14457705,
            coreAccountId: 10877528,
            primary: false,
            canBePrimary: false,
            hidden: false,
            friendlyName: 'Dasha',
            iban: 'GE23TB7407845064400001',
            displayChildCard: false,
            productPartyContractId: 68710912,
            subType: 'A_200_3',
            subTypeText: 'VISA GOLD',
            currency: 'USD',
            priority: 2,
            availableBalance: 0,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                { code: null, operationType: '4.35.01.01-01', context: null }
              ],
            accountMatrixCategorisations: ['DEBIT_CARDS'],
            externalAccountId: '815397049'
          }
        },
        {
          tag: 'account',
          product: {
            id: 14457706,
            coreAccountId: 10877529,
            primary: false,
            canBePrimary: false,
            hidden: false,
            friendlyName: 'Dasha',
            iban: 'GE23TB7407845064400001',
            displayChildCard: false,
            productPartyContractId: 68710913,
            subType: 'A_200_3',
            subTypeText: 'VISA GOLD',
            currency: 'EUR',
            priority: 3,
            availableBalance: 580.76,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                { code: null, operationType: '4.35.01.01-01', context: null }
              ],
            accountMatrixCategorisations: ['DEBIT_CARDS'],
            externalAccountId: '815397050'
          }
        },
        {
          tag: 'account',
          product: {
            id: 14457707,
            coreAccountId: 10877530,
            primary: false,
            canBePrimary: true,
            hidden: false,
            friendlyName: 'Topper',
            iban: 'GE96TB7407845068100013',
            displayChildCard: false,
            productPartyContractId: 68710914,
            subType: 'A_200_10',
            subTypeText: 'MC GOLD',
            currency: 'GEL',
            priority: 1,
            availableBalance: 289.61,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.06-01', context: null },
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                {
                  code: null,
                  operationType: '4.31.01.16-01',
                  context: 'MONEYBOX'
                },
                { code: null, operationType: '4.31.01.17-01', context: null },
                { code: null, operationType: '4.31.03.02-01', context: null },
                { code: null, operationType: '4.31.03.06-01', context: null },
                { code: null, operationType: '4.31.03.11-01', context: null },
                { code: null, operationType: '4.31.05.01-01', context: null }
              ],
            accountMatrixCategorisations: ['DEBIT_CARDS'],
            externalAccountId: '815397051'
          }
        },
        {
          tag: 'account',
          product: {
            id: 14457708,
            coreAccountId: 10877531,
            primary: false,
            canBePrimary: false,
            hidden: false,
            friendlyName: 'Topper',
            iban: 'GE96TB7407845068100013',
            displayChildCard: false,
            productPartyContractId: 68710915,
            subType: 'A_200_10',
            subTypeText: 'MC GOLD',
            currency: 'USD',
            priority: 2,
            availableBalance: 0,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                { code: null, operationType: '4.35.01.01-01', context: null }
              ],
            accountMatrixCategorisations: ['DEBIT_CARDS'],
            externalAccountId: '815397052'
          }
        },
        {
          tag: 'account',
          product: {
            id: 14457709,
            coreAccountId: 10877532,
            primary: false,
            canBePrimary: false,
            hidden: false,
            friendlyName: 'Topper',
            iban: 'GE96TB7407845068100013',
            displayChildCard: false,
            productPartyContractId: 68710916,
            subType: 'A_200_10',
            subTypeText: 'MC GOLD',
            currency: 'EUR',
            priority: 3,
            availableBalance: 0,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                { code: null, operationType: '4.35.01.01-01', context: null }
              ],
            accountMatrixCategorisations: ['DEBIT_CARDS'],
            externalAccountId: '815397053'
          }
        }
      ],
      creditCardsWithBlockations: [],
      debitCardsWithBlockations: [
        {
          iban: 'GE23TB7407845064400001',
          displayChildCard: false,
          cards: [
            {
              tibcoCard: {
                id: '1004650174',
                cardType: 'VISA GOLD',
                cardholderName: 'TOPPER MICHAEL BARNES',
                cardholderId: '7714078',
                userIsCardHolder: false,
                cardNumber: '2178',
                expirationDate: 1772222400000,
                cardStatusCode: 'C_0',
                cardStatusText: 'Active',
                cardPicture: '297',
                blockedAmount: 14.44,
                availableAmount: 2087.01,
                availableAmountInGel: 2087.01,
                availableBalanceForCash: 2087.01,
                availableBalanceForCashInGel: 2087.01,
                priorityCurrency: 'GEL',
                renewApplication: false,
                productId: '74',
                renewalAllowed: true,
                pinResetAllowed: true,
                paySticker: false,
                accountName: 'Dasha',
                vertical: false,
                harmPaymentRestrictionPossibility: true,
                harmPaymentRestriction: false
              },
              blockedMovements:
                [
                  {
                    dateTime: 1652616407000,
                    location: 'Yandex Taxi>Schipol NL',
                    operationAmount: 7,
                    operationCurrency: 'EUR',
                    blockedAmount: 7,
                    blockedCurrency: 'EUR',
                    reversal: false,
                    credit: false
                  },
                  {
                    dateTime: 1652874115000,
                    location: 'APPLE.COM/BILL>ITUNES.COM IE',
                    operationAmount: 0.99,
                    operationCurrency: 'USD',
                    blockedAmount: 0.99,
                    blockedCurrency: 'USD',
                    reversal: false,
                    credit: false
                  },
                  {
                    dateTime: 1652899405000,
                    location: 'Yandex Taxi>Schipol NL',
                    operationAmount: 4.6,
                    operationCurrency: 'GEL',
                    blockedAmount: 4.6,
                    blockedCurrency: 'GEL',
                    reversal: false,
                    credit: false
                  }
                ]
            }
          ]
        },
        {
          iban: 'GE96TB7407845068100013',
          displayChildCard: false,
          cards: [
            {
              tibcoCard: {
                id: '1004650175',
                cardType: 'MC GOLD',
                cardholderName: 'TOPPER MICHAEL BARNES',
                cardholderId: '7714078',
                userIsCardHolder: false,
                cardNumber: '4076',
                expirationDate: 1772222400000,
                cardStatusCode: 'C_0',
                cardStatusText: 'Active',
                cardPicture: '302',
                blockedAmount: 0,
                availableAmount: 289.61,
                availableAmountInGel: 289.61,
                availableBalanceForCash: 289.61,
                availableBalanceForCashInGel: 289.61,
                priorityCurrency: 'GEL',
                renewApplication: false,
                productId: '75',
                renewalAllowed: true,
                pinResetAllowed: true,
                paySticker: false,
                accountName: 'Topper',
                vertical: false,
                harmPaymentRestrictionPossibility: true,
                harmPaymentRestriction: false
              },
              blockedMovements: []
            }
          ]
        }
      ]
    },
    [
      {
        account: {
          balance: 348.18,
          id: '10877527',
          instrument: 'GEL',
          syncIds: [
            'GE23TB7407845064400001',
            '2178'
          ],
          title: 'Dasha',
          type: 'ccard'
        },
        coreAccountId: 10877527,
        holdTransactions: [
          {
            comment: null,
            date: new Date('2022-05-18T18:43:25.000Z'),
            hold: true,
            merchant: {
              city: 'Schipol',
              country: 'NL',
              location: null,
              mcc: null,
              title: 'Yandex Taxi'
            },
            movements: [
              {
                account: { id: '10877527' },
                fee: 0,
                id: null,
                invoice: null,
                sum: -4.6
              }
            ]
          }
        ],

        tag: 'card'
      },
      {
        account: {
          balance: -0.99,
          id: '10877528',
          instrument: 'USD',
          syncIds: [
            'GE23TB7407845064400001',
            '2178'
          ],
          title: 'Dasha',
          type: 'ccard'
        },
        coreAccountId: 10877528,
        holdTransactions: [
          {
            comment: null,
            date: new Date('2022-05-18T11:41:55.000Z'),
            hold: true,
            merchant: {
              city: 'ITUNES.COM',
              country: 'IE',
              location: null,
              mcc: null,
              title: 'APPLE.COM/BILL'
            },
            movements: [
              {
                account: { id: '10877528' },
                fee: 0,
                id: null,
                invoice: null,
                sum: -0.99
              }
            ]
          }
        ],
        tag: 'card'
      },
      {
        account: {
          balance: 573.76,
          id: '10877529',
          instrument: 'EUR',
          syncIds: [
            'GE23TB7407845064400001',
            '2178'
          ],
          title: 'Dasha',
          type: 'ccard'
        },
        coreAccountId: 10877529,
        holdTransactions: [
          {
            comment: null,
            date: new Date('2022-05-15T12:06:47.000Z'),
            hold: true,
            merchant: {
              city: 'Schipol',
              country: 'NL',
              location: null,
              mcc: null,
              title: 'Yandex Taxi'
            },
            movements: [
              {
                account: { id: '10877529' },
                fee: 0,
                id: null,
                invoice: null,
                sum: -7
              }
            ]
          }
        ],
        tag: 'card'
      },
      {
        account: {
          balance: 289.61,
          id: '10877530',
          instrument: 'GEL',
          syncIds: [
            'GE96TB7407845068100013',
            '4076'
          ],
          title: 'Topper',
          type: 'ccard'
        },
        coreAccountId: 10877530,
        holdTransactions: [],
        tag: 'card'
      },
      {
        account: {
          balance: 0,
          id: '10877531',
          instrument: 'USD',
          syncIds: [
            'GE96TB7407845068100013',
            '4076'
          ],
          title: 'Topper',
          type: 'ccard'
        },
        coreAccountId: 10877531,
        holdTransactions: [],
        tag: 'card'
      },
      {
        account: {
          balance: 0,
          id: '10877532',
          instrument: 'EUR',
          syncIds: [
            'GE96TB7407845068100013',
            '4076'
          ],
          title: 'Topper',
          type: 'ccard'
        },
        coreAccountId: 10877532,
        holdTransactions: [],
        tag: 'card'
      }
    ]
  ],
  [
    {
      accounts: [
        {
          tag: 'account',
          product: {
            id: 14912657,
            coreAccountId: 11227603,
            primary: false,
            canBePrimary: true,
            hidden: false,
            friendlyName: 'Зарплата GEL',
            iban: 'GE17TB7875545064400004',
            displayChildCard: false,
            productPartyContractId: 72277181,
            subType: 'A_200_3',
            subTypeText: 'VISA GOLD',
            currency: 'GEL',
            priority: 1,
            availableBalance: 0,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.06-01', context: null },
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                {
                  code: null,
                  operationType: '4.31.01.16-01',
                  context: 'MONEYBOX'
                },
                { code: null, operationType: '4.31.01.17-01', context: null },
                { code: null, operationType: '4.31.03.02-01', context: null },
                { code: null, operationType: '4.31.03.06-01', context: null },
                { code: null, operationType: '4.31.03.11-01', context: null },
                { code: null, operationType: '4.31.05.01-01', context: null }
              ],
            accountMatrixCategorisations: ['DEBIT_CARDS'],
            externalAccountId: '815757864'
          }
        },
        {
          tag: 'account',
          product: {
            id: 14912658,
            coreAccountId: 11227604,
            primary: false,
            canBePrimary: false,
            hidden: false,
            friendlyName: 'Зарплата GEL',
            iban: 'GE17TB7875545064400004',
            displayChildCard: false,
            productPartyContractId: 72277182,
            subType: 'A_200_3',
            subTypeText: 'VISA GOLD',
            currency: 'USD',
            priority: 2,
            availableBalance: 0,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                { code: null, operationType: '4.35.01.01-01', context: null }
              ],
            accountMatrixCategorisations: ['DEBIT_CARDS'],
            externalAccountId: '815757865'
          }
        },
        {
          tag: 'account',
          product: {
            id: 14912659,
            coreAccountId: 11227605,
            primary: false,
            canBePrimary: false,
            hidden: false,
            friendlyName: 'Зарплата GEL',
            iban: 'GE17TB7875545064400004',
            displayChildCard: false,
            productPartyContractId: 72277183,
            subType: 'A_200_3',
            subTypeText: 'VISA GOLD',
            currency: 'EUR',
            priority: 3,
            availableBalance: 0,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                { code: null, operationType: '4.35.01.01-01', context: null }
              ],
            accountMatrixCategorisations: ['DEBIT_CARDS'],
            externalAccountId: '815757866'
          }
        },
        {
          tag: 'account',
          product: {
            id: 14919461,
            coreAccountId: 11232886,
            primary: false,
            canBePrimary: true,
            hidden: false,
            friendlyName: 'My Account',
            iban: 'GE74TB7875545068100013',
            displayChildCard: false,
            productPartyContractId: 72309426,
            subType: 'A_200_10',
            subTypeText: 'MC GOLD',
            currency: 'GEL',
            priority: 1,
            availableBalance: null,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.06-01', context: null },
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                {
                  code: null,
                  operationType: '4.31.01.16-01',
                  context: 'MONEYBOX'
                },
                { code: null, operationType: '4.31.01.17-01', context: null },
                { code: null, operationType: '4.31.03.02-01', context: null },
                { code: null, operationType: '4.31.03.06-01', context: null },
                { code: null, operationType: '4.31.03.11-01', context: null },
                { code: null, operationType: '4.31.05.01-01', context: null }
              ],
            accountMatrixCategorisations: ['DEBIT_CARDS'],
            externalAccountId: '815767774'
          }
        },
        {
          tag: 'account',
          product: {
            id: 14919462,
            coreAccountId: 11232887,
            primary: false,
            canBePrimary: false,
            hidden: false,
            friendlyName: 'My Account',
            iban: 'GE74TB7875545068100013',
            displayChildCard: false,
            productPartyContractId: 72309429,
            subType: 'A_200_10',
            subTypeText: 'MC GOLD',
            currency: 'USD',
            priority: 2,
            availableBalance: null,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                { code: null, operationType: '4.35.01.01-01', context: null }
              ],
            accountMatrixCategorisations: ['DEBIT_CARDS'],
            externalAccountId: '815767775'
          }
        },
        {
          tag: 'account',
          product: {
            id: 14919463,
            coreAccountId: 11232888,
            primary: false,
            canBePrimary: false,
            hidden: false,
            friendlyName: 'My Account',
            iban: 'GE74TB7875545068100013',
            displayChildCard: false,
            productPartyContractId: 72309432,
            subType: 'A_200_10',
            subTypeText: 'MC GOLD',
            currency: 'EUR',
            priority: 3,
            availableBalance: null,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                { code: null, operationType: '4.35.01.01-01', context: null }
              ],
            accountMatrixCategorisations: ['DEBIT_CARDS'],
            externalAccountId: '815767776'
          }
        }
      ],
      creditCardsWithBlockations: [],
      debitCardsWithBlockations: [
        {
          iban: 'GE74TB7875545068100013',
          displayChildCard: false,
          cards: [
            {
              tibcoCard: {
                id: '1004848344',
                cardType: 'MC GOLD',
                cardholderName: 'RAMAN LYSAV',
                cardholderId: '7818755',
                userIsCardHolder: false,
                cardNumber: '9532',
                expirationDate: 1780171200000,
                cardStatusCode: 'C_1',
                cardStatusText: 'Inactive',
                cardPicture: '303',
                blockedAmount: 0,
                availableAmount: 0,
                availableAmountInGel: 0,
                availableBalanceForCash: 0,
                availableBalanceForCashInGel: 0,
                priorityCurrency: 'GEL',
                renewApplication: false,
                productId: '75',
                renewalAllowed: true,
                pinResetAllowed: false,
                paySticker: false,
                accountName: 'My Account',
                vertical: false,
                harmPaymentRestrictionPossibility: true,
                harmPaymentRestriction: true
              },
              blockedMovements: []
            }
          ]
        },
        {
          iban: 'GE17TB7875545064400004',
          displayChildCard: false,
          cards: [
            {
              tibcoCard: {
                id: '1004844291',
                cardType: 'VISA GOLD',
                cardholderName: 'RAMAN LYSAV',
                cardholderId: '7818755',
                userIsCardHolder: false,
                cardNumber: '8316',
                expirationDate: 1780171200000,
                cardStatusCode: 'C_0',
                cardStatusText: 'Active',
                cardPicture: '298',
                blockedAmount: 0,
                availableAmount: 0,
                availableAmountInGel: 0,
                availableBalanceForCash: 0,
                availableBalanceForCashInGel: 0,
                priorityCurrency: 'GEL',
                renewApplication: false,
                productId: '74',
                renewalAllowed: true,
                pinResetAllowed: true,
                paySticker: false,
                accountName: 'Зарплата GEL',
                vertical: false,
                harmPaymentRestrictionPossibility: true,
                harmPaymentRestriction: false
              },
              blockedMovements: []
            }
          ]
        }
      ]
    },
    [
      {
        account: {
          balance: 0,
          id: '11227603',
          instrument: 'GEL',
          syncIds: ['GE17TB7875545064400004', '8316'],
          title: 'Зарплата GEL',
          type: 'ccard'
        },
        coreAccountId: 11227603,
        holdTransactions: [],
        tag: 'card'
      },
      {
        account: {
          balance: 0,
          id: '11227604',
          instrument: 'USD',
          syncIds: ['GE17TB7875545064400004', '8316'],
          title: 'Зарплата GEL',
          type: 'ccard'
        },
        coreAccountId: 11227604,
        holdTransactions: [],
        tag: 'card'
      },
      {
        account: {
          balance: 0,
          id: '11227605',
          instrument: 'EUR',
          syncIds: ['GE17TB7875545064400004', '8316'],
          title: 'Зарплата GEL',
          type: 'ccard'
        },
        coreAccountId: 11227605,
        holdTransactions: [],
        tag: 'card'
      },
      {
        account: {
          balance: null,
          id: '11232886',
          instrument: 'GEL',
          syncIds: ['GE74TB7875545068100013', '9532'],
          title: 'My Account',
          type: 'ccard'
        },
        coreAccountId: 11232886,
        holdTransactions: [],
        tag: 'card'
      },
      {
        account: {
          balance: null,
          id: '11232887',
          instrument: 'USD',
          syncIds: ['GE74TB7875545068100013', '9532'],
          title: 'My Account',
          type: 'ccard'
        },
        coreAccountId: 11232887,
        holdTransactions: [],
        tag: 'card'
      },
      {
        account: {
          balance: null,
          id: '11232888',
          instrument: 'EUR',
          syncIds: ['GE74TB7875545068100013', '9532'],
          title: 'My Account',
          type: 'ccard'
        },
        coreAccountId: 11232888,
        holdTransactions: [],
        tag: 'card'
      }
    ]
  ]
])('converts debit card', (apiAccounts: unknown, product: unknown) => {
  const result = convertAccounts(apiAccounts as FetchedAccounts)
  expect(result).toEqual(product)
})
