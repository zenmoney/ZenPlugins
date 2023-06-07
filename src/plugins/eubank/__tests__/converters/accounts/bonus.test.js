import { convertAccounts } from '../../../converters'

describe('convertAccount', () => {
  it.each([
    [
      [
        {
          account: {
            actions: ['ECVA', 'STMT'],
            currency: 'BNS',
            number: 'BONUS-645357268914',
            priority: 0,
            title: 'Бонусный счет',
            type: 'BONS',
            allowBalance: true,
            allowCreateFinDoc: true,
            status: 'ACTIVE',
            showBalance: true,
            allowTransfer: true
          },
          details: {
            actions: ['ECVA', 'STMT', 'ECVA', 'STMT'],
            currency: 'BNS',
            number: 'BONUS-645357268914',
            priority: 0,
            title: 'Бонусный счет',
            type: 'BONS',
            allowBalance: true,
            allowCreateFinDoc: true,
            actualBalance: 0.00,
            status: 'ACTIVE',
            balance: 2600.05,
            blockedSum: -2093.04,
            hasStandingOrders: false,
            multiCurrency: false,
            contractNo: 'BONUS-645357268914',
            id: 67890123,
            branchTitle: 'АО Евразийский Банк',
            dateClosed: 0,
            dateOpened: 1676556789012,
            interestRate: 0.0000,
            limits: {
              currency: 'KZT',
              dayLimit: 1000000.0000,
              monthLimit: 7000000.0000,
              operationLimit: 1000000.0000,
              weekLimit: 0.0000
            },
            minBalance: 0,
            showBalance: true,
            allowTransfer: true
          }
        }
      ],
      {
        accounts: [
          {
            mainProduct: {
              number: 'BONUS-645357268914',
              type: 'bonus'
            },
            account: {
              id: '67890123',
              type: 'investment',
              title: 'BONUS-645357268914',
              instrument: 'KZT',
              syncID: [
                'BONUS-645357268914'
              ],
              balance: 0
            }
          }
        ],
        accountsByNumber: {
          'BONUS-645357268914': {
            id: '67890123',
            type: 'investment',
            title: 'BONUS-645357268914',
            instrument: 'KZT',
            syncID: [
              'BONUS-645357268914'
            ],
            balance: 0
          }
        }
      }
    ]
  ])('converts bonus account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
