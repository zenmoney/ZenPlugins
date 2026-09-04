import { AccountType } from '../../../../types/zenmoney'
import { convertAccounts } from '../../converters'
import { SimpleFinAccountSet } from '../../models'

describe('convertAccounts', () => {
  it('converts SimpleFIN accounts with connection metadata', () => {
    const accountSet: SimpleFinAccountSet = {
      connections: [
        {
          connId: 'CON-1',
          name: 'My Bank - Personal',
          orgName: 'My Bank'
        }
      ],
      accounts: [
        {
          id: 'acc-1',
          name: 'Savings',
          connId: 'CON-1',
          currency: 'usd',
          balance: 100.23,
          availableBalance: 75.23,
          transactions: []
        },
        {
          id: 'acc-2',
          name: 'Credit Card',
          connId: 'CON-1',
          currency: 'USD',
          balance: -42.5,
          transactions: []
        }
      ]
    }

    expect(convertAccounts(accountSet).map(({ account }) => account)).toEqual([
      {
        id: 'CON-1:acc-1',
        type: AccountType.checking,
        title: 'My Bank Savings',
        instrument: 'USD',
        syncIds: [
          'simplefin:CON-1:acc-1'
        ],
        savings: true,
        balance: 100.23,
        available: 75.23,
        creditLimit: 0
      },
      {
        id: 'CON-1:acc-2',
        type: AccountType.ccard,
        title: 'My Bank Credit Card',
        instrument: 'USD',
        syncIds: [
          'simplefin:CON-1:acc-2'
        ],
        savings: false,
        balance: -42.5,
        available: undefined,
        creditLimit: 0
      }
    ])
  })
})
