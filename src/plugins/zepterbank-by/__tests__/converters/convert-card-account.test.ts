import { convertCardAccount } from '../../converters'
import { FetchCardAccount } from '../../types/fetch.types'
import { Account, AccountType } from '../../../../types/zenmoney'
import { TEST_ACCOUNTS } from '../../__mocks__/accounts.sample'

describe('convertCardAccount', () => {
  const account0: Account = {
    id: 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8',
    title: 'Белкарт "Национальный" BYN SV',
    balance: 1.39,
    instrument: 'BYN',
    syncIds: [
      'BY22ZEPT00000000000000001111',
      '5053951600195',
      '1111'
    ],
    type: AccountType.ccard
  }

  const account1: Account = {
    id: 'Y2errgEX8HfZ5efNYkj3XzirAqGrN7m523zs53P5',
    title: 'Visa Gold "Международный" EUR SV',
    balance: 0.16,
    instrument: 'EUR',
    syncIds: [
      'BY22ZEPT00000000000000002222',
      '5062592006073',
      '2222'
    ],
    type: AccountType.ccard
  }

  it.each([
    [
      TEST_ACCOUNTS.CARD[0],
      account0
    ],
    [
      TEST_ACCOUNTS.CARD[1],
      account1
    ]
  ])('converts  account', (apiAccount: FetchCardAccount, account: Account) => {
    expect(convertCardAccount(apiAccount)).toEqual(account)
  })
})
