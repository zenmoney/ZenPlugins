import { convertCardAccount } from '../../converters'
import { FetchCardAccount } from '../../types/fetch'
import { Account, AccountType } from '../../../../types/zenmoney'
import { TEST_ACCOUNTS } from '../../__mocks__/accounts.sample'

describe('convertCardAccount', () => {
  const account0: Account = {
    id: '8479823740280',
    title: 'EUR',
    balance: 7.12,
    instrument: 'EUR',
    syncIds: [
      'BY00POIS00000000000000001111',
      '8479823740280',
      '1111'
    ],
    type: AccountType.ccard
  }

  it.each([
    [
      TEST_ACCOUNTS.CARD[0],
      account0
    ]
  ])('converts  account', (apiAccount: FetchCardAccount, account: Account) => {
    expect(convertCardAccount(apiAccount)).toEqual(account)
  })
})
