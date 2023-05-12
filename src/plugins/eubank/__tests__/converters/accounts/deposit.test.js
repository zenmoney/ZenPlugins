import { convertAccounts } from '../../../converters'

describe('convertAccount', () => {
  it.each([
    [
      [
        {
          account: {
            actions: ['CRED', 'DEOP', 'OPEN', 'SMTI', 'STMT', 'TSLF'],
            currency: 'KZT',
            number: 'KZ31948KZT1260600456',
            priority: 0,
            title: 'ТурбоДепозит 9.98',
            type: 'SAVE',
            status: 'ACTIVE',
            showBalance: true,
            allowTransfer: true
          },
          details: {
            actions: ['CRED', 'DEOP', 'OPEN', 'SMTI', 'STMT', 'TSLF'],
            currency: 'KZT',
            number: 'KZ31948KZT1260600456',
            title: 'ТурбоДепозит 9.98',
            type: 'ТурбоДепозит Smartbank 12 мес.',
            actualBalance: 38.84,
            status: 'ACTIVE',
            balance: 1038.84,
            blockedSum: 0,
            hasStandingOrders: false,
            branchTitle: 'Отделение №502 (г.Астана)',
            dateOpened: 1560880800000,
            branchTermId: '1000132',
            interestRate: 9.98,
            accountNumber: 'KZ31948KZT1260600456',
            dateClosed: 0,
            accruedAmountForMonth: 0,
            accruedAmountTotal: 6038.84,
            limits:
            {
              currency: null,
              dayLimit: null,
              monthLimit: null,
              operationLimit: null,
              weekLimit: null
            },
            minBalance: 1000,
            expiration: 1592503200000,
            term: 1592503200000,
            showBalance: true,
            allowTransfer: true
          }
        }
      ],
      {
        accounts: [
          {
            mainProduct: {
              number: 'KZ31948KZT1260600456',
              type: 'deposit'
            },
            account: {
              id: '0600456',
              type: 'deposit',
              title: '*0456',
              instrument: 'KZT',
              syncID: [
                'KZ31948KZT1260600456'
              ],
              balance: 1038.84,
              startBalance: 1000,
              startDate: new Date(1560880800000),
              percent: 9.98,
              capitalization: true,
              endDateOffsetInterval: 'year',
              endDateOffset: 1,
              payoffInterval: 'month',
              payoffStep: 1
            }
          }
        ],
        accountsByNumber: {
          KZ31948KZT1260600456: {
            id: '0600456',
            type: 'deposit',
            title: '*0456',
            instrument: 'KZT',
            syncID: [
              'KZ31948KZT1260600456'
            ],
            balance: 1038.84,
            startBalance: 1000,
            startDate: new Date(1560880800000),
            percent: 9.98,
            capitalization: true,
            endDateOffsetInterval: 'year',
            endDateOffset: 1,
            payoffInterval: 'month',
            payoffStep: 1
          }
        }
      }
    ],
    [
      [
        {
          account: {
            actions: ['CRED', 'DEOP', 'STMT', 'TSLF'],
            currency: 'USD',
            number: 'KZ14948USD00606002DV',
            priority: 0,
            title: 'TurboDeposit 12 мес.',
            type: 'SAVE',
            status: 'ACTIVE',
            allowTransfer: true,
            showBalance: true
          },
          details: {
            actions: ['CRED', 'DEOP', 'STMT', 'TSLF'],
            currency: 'USD',
            number: 'KZ14948USD00606002DV',
            title: 'TurboDeposit 12 мес.',
            type: 'TurboDeposit 12 мес.',
            actualBalance: 526.51,
            status: 'ACTIVE',
            balance: 626.51,
            blockedSum: 0,
            hasStandingOrders: false,
            branchTitle: 'Филиал №5 г.Астана',
            dateOpened: 1598896800000,
            branchTermId: '1000109',
            interestRate: 1,
            accountNumber: 'KZ14948USD00606002DV',
            dateClosed: 0,
            accruedAmountForMonth: 0,
            accruedAmountTotal: 0.51,
            limits:
            {
              currency: null,
              dayLimit: null,
              monthLimit: null,
              operationLimit: null,
              weekLimit: null
            },
            minBalance: 100,
            expiration: 1630432800000,
            term: 1630432800000,
            allowTransfer: true,
            showBalance: true
          }
        }
      ],
      {
        accounts: [
          {
            mainProduct: {
              number: 'KZ14948USD00606002DV',
              type: 'deposit'
            },
            account: {
              id: '06002DV',
              type: 'deposit',
              title: '*02DV',
              instrument: 'USD',
              syncID: [
                'KZ14948USD00606002DV'
              ],
              balance: 626.51,
              startBalance: 100,
              startDate: new Date(1598896800000),
              percent: 1,
              capitalization: true,
              endDateOffsetInterval: 'year',
              endDateOffset: 1,
              payoffInterval: 'month',
              payoffStep: 1
            }
          }
        ],
        accountsByNumber: {
          KZ14948USD00606002DV: {
            id: '06002DV',
            type: 'deposit',
            title: '*02DV',
            instrument: 'USD',
            syncID: [
              'KZ14948USD00606002DV'
            ],
            balance: 626.51,
            startBalance: 100,
            startDate: new Date(1598896800000),
            percent: 1,
            capitalization: true,
            endDateOffsetInterval: 'year',
            endDateOffset: 1,
            payoffInterval: 'month',
            payoffStep: 1
          }
        }
      }
    ]
  ])('converts deposit', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
