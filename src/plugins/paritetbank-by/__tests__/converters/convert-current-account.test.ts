import { convertCurrentAccount } from '../../converters'
import { FetchCurrentAccount } from '../../types/fetch'
import { Account } from '../../../../types/zenmoney'
import { TEST_ACCOUNTS } from '../../__mocks__/accounts.data'

describe('convertCurrentAccount', () => {
  it.each([
    [
      TEST_ACCOUNTS.CURRENT[0],
      {
        id: '425367558876986',
        title: 'BY00POIS00000000000000002222',
        balance: 1.55,
        instrument: 'BYN',
        syncIds: [
          'BY00POIS00000000000000002222',
          '425367558876986'
        ],
        type: 'checking'
      } as Account
    ]
  ])('converts  account', (apiAccount: FetchCurrentAccount, account: Account) => {
    expect(convertCurrentAccount(apiAccount)).toEqual(account)
  })
})
