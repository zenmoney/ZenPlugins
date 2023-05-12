import { convertAccounts } from '../../../converters'

describe('convertAccount', () => {
  it.each([
    [
      [
        {
          account: {
            actions: ['COCA', 'CRCR', 'CRED', 'DEOP', 'FREF', 'INPS', 'OPCA', 'OUPS', 'PAYM', 'SMTI', 'STMT', 'TLCC', 'TLOC', 'TOUC', 'TOUT', 'TSLF'],
            currency: 'KZT',
            number: 'KZ48948KZT12604004PR',
            priority: 0,
            title: 'Текущий счет',
            type: 'CURR',
            status: 'ACTIVE',
            showBalance: true,
            allowTransfer: true
          },
          details: {
            actions: ['COCA', 'CRCR', 'CRED', 'DEOP', 'FREF', 'INPS', 'OPCA', 'OUPS', 'PAYM', 'SMTI', 'STMT', 'TLCC', 'TLOC', 'TOUC', 'TOUT', 'TSLF'],
            currency: 'KZT',
            number: 'KZ48948KZT12604004PR',
            priority: 0,
            title: 'Текущий счет',
            type: 'CURR',
            actualBalance: 0.85,
            status: 'ACTIVE',
            balance: 0.85,
            blockedSum: 0,
            hasStandingOrders: false,
            multiCurrency: false,
            branchTitle: 'Отделение №502 (г.Астана)',
            dateClosed: 0,
            dateOpened: 1405360800000,
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
            showBalance: true,
            allowTransfer: true
          }
        }
      ],
      {
        accounts: [
          {
            mainProduct: {
              number: 'KZ48948KZT12604004PR',
              type: 'current'
            },
            account: {
              id: '04004PR',
              type: 'checking',
              title: '*04PR',
              instrument: 'KZT',
              syncID: [
                'KZ48948KZT12604004PR'
              ],
              balance: 0.85
            }
          }
        ],
        accountsByNumber: {
          KZ48948KZT12604004PR: {
            id: '04004PR',
            type: 'checking',
            title: '*04PR',
            instrument: 'KZT',
            syncID: [
              'KZ48948KZT12604004PR'
            ],
            balance: 0.85
          }
        }
      }
    ]
  ])('converts current account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
