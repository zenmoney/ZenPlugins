import { convertAccounts } from '../../../legacy/converters'
import { FetchedAccounts } from '../../../legacy/models'

it.each([
  [
    {
      accounts: [
        {
          tag: 'account',
          product: {
            id: 14584950,
            coreAccountId: 10975953,
            primary: false,
            canBePrimary: false,
            hidden: false,
            friendlyName: 'My Saving',
            iban: 'GE40TB7692936615123456',
            displayChildCard: false,
            productPartyContractId: 70374237,
            subType: 'A_101_52',
            subTypeText: 'My Safe',
            currency: 'USD',
            priority: 0,
            availableBalance: 0,
            paymentOperationTypeContexts: [
              {
                code: null,
                operationType: '4.31.01.16-01',
                context: 'CREDIT'
              },
              {
                code: null,
                operationType: '4.31.01.16-01',
                context: 'DEBIT'
              }
            ],
            accountMatrixCategorisations: [
              'SAVING_ACCOUNTS'
            ],
            externalAccountId: '815502950'
          }
        }

      ],
      debitCardsWithBlockations: [],
      creditCardsWithBlockations: []
    },
    [
      {
        account: {
          balance: 0,
          id: '10975953',
          instrument: 'USD',
          savings: true,
          syncIds: [
            'GE40TB7692936615123456'
          ],
          title: 'My Saving',
          type: 'checking'
        },
        coreAccountId: 10975953,
        tag: 'account'
      }
    ]
  ],
  [
    {
      accounts: [
        {
          tag: 'account',
          product:
            {
              id: 15268624,
              coreAccountId: 11504344,
              primary: false,
              canBePrimary: false,
              hidden: false,
              friendlyName: 'My Saving',
              iban: 'GE61TB7900336515100048',
              displayChildCard: false,
              productPartyContractId: 74009190,
              subType: 'A_101_52',
              subTypeText: 'My Safe',
              currency: 'GEL',
              priority: 0,
              availableBalance: null,
              paymentOperationTypeContexts:
                [
                  { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
                  { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' }
                ],
              accountMatrixCategorisations: ['SAVING_ACCOUNTS'],
              externalAccountId: '816042141'
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
          id: '11504344',
          instrument: 'GEL',
          savings: true,
          syncIds: [
            'GE61TB7900336515100048'
          ],
          title: 'My Saving',
          type: 'checking'
        },
        coreAccountId: 11504344,
        tag: 'account'
      }
    ]
  ]
])('converts saving account', (apiAccounts: unknown, product: unknown) => {
  const result = convertAccounts(apiAccounts as FetchedAccounts)
  expect(result).toEqual(product)
})
