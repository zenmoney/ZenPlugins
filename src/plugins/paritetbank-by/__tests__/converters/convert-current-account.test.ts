import { convertCurrentAccount } from '../../converters'
import { FetchCurrentAccount } from '../../types/fetch'
import { Account, AccountType } from '../../../../types/zenmoney'
import { TEST_ACCOUNTS } from '../../__mocks__/accounts.sample'

describe('convertCurrentAccount', () => {
  const account0: Account = {
    id: '425367558876986',
    title: 'BY00POIS00000000000000002222',
    balance: 1.55,
    instrument: 'BYN',
    syncIds: [
      'BY00POIS00000000000000002222',
      '425367558876986'
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
