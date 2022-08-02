import { AccountType } from '../../../../../types/zenmoney'
import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          address: '1',
          chain_stats: {
            funded_txo_count: 1,
            funded_txo_sum: 5000,
            spent_txo_count: 1,
            spent_txo_sum: 1000,
            tx_count: 2
          }
        },
        {
          address: '2',
          chain_stats: {
            funded_txo_count: 1,
            funded_txo_sum: 10000,
            spent_txo_count: 1,
            spent_txo_sum: 10000,
            tx_count: 2
          }
        }
      ],
      [
        {
          id: '1',
          type: AccountType.checking,
          title: '1',
          instrument: 'BTC',
          balance: 40,
          syncIds: ['1']
        },
        {
          id: '2',
          type: AccountType.checking,
          title: '2',
          instrument: 'BTC',
          balance: 0,
          syncIds: ['2']
        }
      ]
    ]
  ])('converts current account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
