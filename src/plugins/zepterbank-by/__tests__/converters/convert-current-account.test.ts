import { convertCurrentAccount } from '../../converters'
import { FetchCurrentAccount } from '../../types/fetch.types'
import { Account, AccountType } from '../../../../types/zenmoney'
import { TEST_ACCOUNTS } from '../../__mocks__/accounts.sample'

describe('convertCurrentAccount', () => {
  const account0: Account = {
    id: '3p6Kf9JU2RQW4HFE42QGVB556Sv4hgVxg4vZ7ZP2',
    title: 'Текущий счет в белорусских рублях',
    balance: 1.42,
    instrument: 'BYN',
    syncIds: [
      'BY11ZEPT00000000000000001111',
      '5050100107306'
    ],
    type: AccountType.checking
  }

  it.each([
    [
      TEST_ACCOUNTS.CURRENT[0],
      account0
    ]
  ])('converts  account', (apiAccount: FetchCurrentAccount, account: Account) => {
    expect(convertCurrentAccount(apiAccount)).toEqual(account)
  })
})
