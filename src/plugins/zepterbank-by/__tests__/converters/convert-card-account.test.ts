import { convertCardAccount } from '../../converters'
import { FetchCardAccount, FetchCardAccountMeta } from '../../types/fetch.types'
import { Account, AccountType } from '../../../../types/zenmoney'
import { TEST_ACCOUNTS } from '../../__mocks__/accounts.sample'

describe('convertCardAccount', () => {
  const account0: Account & FetchCardAccountMeta = {
    id: 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8',
    title: 'Белкарт "Национальный" BYN SV',
    balance: 1.39,
    instrument: 'BYN',
    syncIds: [
      'BY22ZEPT00000000000000001111',
      '5053951600195',
      '1111'
    ],
    type: AccountType.ccard,
    _meta: {
      cardTransactionsFetchId: 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8',
      productStatementFetchId: 'vc5275E7DJRNBWJaN9Ugpc86LZQ4F75Dda7xhb74'
    }
  }

  const account1: Account & FetchCardAccountMeta = {
    id: 'Y2errgEX8HfZ5efNYkj3XzirAqGrN7m523zs53P5',
    title: 'Visa Gold "Международный" EUR SV',
    balance: 0.16,
    instrument: 'EUR',
    syncIds: [
      'BY22ZEPT00000000000000002222',
      '5062592006073',
      '2222'
    ],
    type: AccountType.ccard,
    _meta: {
      cardTransactionsFetchId: 'Y2errgEX8HfZ5efNYkj3XzirAqGrN7m523zs53P5',
      productStatementFetchId: '7eoTC9pk6A3o7EfqF7633NmBWjDW9DHp23V5k8KJ'
    }
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
