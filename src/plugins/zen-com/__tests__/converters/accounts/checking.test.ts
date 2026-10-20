import { convertAccounts } from '../../../converters'
import { accountsResponse } from '../../../__fixtures__/accounts'
import { expectedAccounts, expectedKnownAccountNumbers } from '../../../__fixtures__/expected-accounts'
import { arrayAt } from '../../../validation'

describe('ZEN.COM currency accounts', () => {
  it('ACCOUNT-001/002/003/004 preserves all 35 balances and virtual-number matching context in one fetch plan', () => {
    const accounts = arrayAt(accountsResponse, 'accounts')
    const expected = [{ accounts: expectedAccounts, knownAccountNumbers: expectedKnownAccountNumbers, fetchParams: { accountIds: expectedAccounts.map(account => account.id) } }]
    expect(convertAccounts(accounts)).toEqual(expected)
    expect(convertAccounts([...accounts].reverse())).toEqual(expected)
    expect(convertAccounts([...accounts, ...accounts])).toEqual(expected)
  })
})
