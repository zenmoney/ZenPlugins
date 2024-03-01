import { convertAccounts } from '../../../converters'
import { FetchedAccounts } from '../../../models'

it.each([
  [
    {
      accounts: [
        {
          tag: 'account',
          product: {
            id: 13324137,
            coreAccountId: 10013904,
            primary: false,
            canBePrimary: true,
            hidden: false,
            friendlyName: 'My Current',
            iban: 'GE30TB7846636010100048',
            displayChildCard: false,
            productPartyContractId: 59982930,
            subType: 'A_100_100',
            subTypeText: 'FOR BUSINESS',
            currency: 'GEL',
            priority: 0,
            availableBalance: 738.65,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.06-01', context: null },
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                { code: null, operationType: '4.31.01.17-01', context: null },
                { code: null, operationType: '4.31.01.17-01', context: null },
                { code: null, operationType: '4.31.03.02-01', context: null },
                { code: null, operationType: '4.31.03.06-01', context: null },
                { code: null, operationType: '4.31.03.11-01', context: null },
                { code: null, operationType: '4.31.05.01-01', context: null }
              ],
            accountMatrixCategorisations: ['CURRENT_ACCOUNTS'],
            externalAccountId: '814578623'
          }
        },
        {
          tag: 'account',
          product: {
            id: 13324347,
            coreAccountId: 10014072,
            primary: false,
            canBePrimary: false,
            hidden: false,
            friendlyName: 'My Current',
            iban: 'GE60TB7846636110100009',
            displayChildCard: false,
            productPartyContractId: 59983479,
            subType: 'A_100_100',
            subTypeText: 'FOR BUSINESS',
            currency: 'USD',
            priority: 0,
            availableBalance: 0,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                { code: null, operationType: '4.35.01.01-01', context: null },
                { code: null, operationType: '4.35.01.01-01', context: null }
              ],
            accountMatrixCategorisations: ['CURRENT_ACCOUNTS'],
            externalAccountId: '814587459'
          }
        },
        {
          tag: 'account',
          product: {
            id: 14446445,
            coreAccountId: 10863911,
            primary: false,
            canBePrimary: false,
            hidden: false,
            friendlyName: 'My Current',
            iban: 'GE76TB7846636110100012',
            displayChildCard: false,
            productPartyContractId: 68401169,
            subType: 'A_100_100',
            subTypeText: 'FOR BUSINESS',
            currency: 'EUR',
            priority: 0,
            availableBalance: 0,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                { code: null, operationType: '4.35.01.01-01', context: null },
                { code: null, operationType: '4.35.01.01-01', context: null }
              ],
            accountMatrixCategorisations: ['CURRENT_ACCOUNTS'],
            externalAccountId: '815388591'
          }
        }
      ],
      debitCardsWithBlockations: [],
      creditCardsWithBlockations: []
    },
    [
      {
        account: {
          balance: 738.65,
          id: '10013904',
          instrument: 'GEL',
          syncIds: ['GE30TB7846636010100048'],
          title: 'My Current',
          type: 'checking'
        },
        coreAccountId: 10013904,
        tag: 'account'
      },
      {
        account: {
          balance: 0,
          id: '10014072',
          instrument: 'USD',
          syncIds: ['GE60TB7846636110100009'],
          title: 'My Current',
          type: 'checking'
        },
        coreAccountId: 10014072,
        tag: 'account'
      },
      {
        account: {
          balance: 0,
          id: '10863911',
          instrument: 'EUR',
          syncIds: ['GE76TB7846636110100012'],
          title: 'My Current',
          type: 'checking'
        },
        coreAccountId: 10863911,
        tag: 'account'
      }
    ]
  ],
  [
    {
      accounts: [
        {
          tag: 'account',
          product: {
            id: 16068089,
            coreAccountId: 12114576,
            primary: false,
            canBePrimary: false,
            hidden: false,
            friendlyName: 'My Current',
            iban: 'GE14TB7824436110100007',
            displayChildCard: false,
            productPartyContractId: 77767976,
            type: 'A',
            typeText: 'Account',
            subType: 'A_100_100',
            subTypeText: 'FOR BUSINESS',
            currency: 'USD',
            priority: 0,
            availableBalance: null,
            paymentOperationTypeContexts:
              [
                { code: null, operationType: '4.31.01.11-01', context: null },
                { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
                { code: null, operationType: '4.35.01.01-01', context: null },
                { code: null, operationType: '4.35.01.01-01', context: null }
              ],
            availableBalanceInGel: null,
            openDate: 1667246400000,
            interestRate: null,
            accountMatrixCategorisations: ['CURRENT_ACCOUNTS'],
            canBeClosed: true
          }
        }
      ],
      debitCardsWithBlockations: [],
      creditCardsWithBlockations: []
    },
    [
      {
        account: {
          balance: null,
          id: '12114576',
          instrument: 'USD',
          syncIds: ['GE14TB7824436110100007'],
          title: 'My Current',
          type: 'checking'
        },
        coreAccountId: 12114576,
        tag: 'account'
      }
    ]
  ]
])('converts current account', (apiAccounts: unknown, product: unknown) => {
  const result = convertAccounts(apiAccounts as FetchedAccounts)
  expect(result).toEqual(product)
})
