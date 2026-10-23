import { AccountType } from '../../../../../types/zenmoney'
import { convertAccounts } from '../../../converters'
import { parseAccounts } from '../../../parsers'
import { fixture } from '../../../testFixtures'

const expected = [
  { account: { id: '200111111111111117', type: AccountType.checking, title: 'ALEKSANDRA PETROVIC PR (RSD)', instrument: 'RSD', balance: 69204.71, syncIds: ['200111111111111117'] }, fetchParams: { index: '0' } },
  { account: { id: '200222222222222262', type: AccountType.checking, title: 'ALEKSANDRA PETROVIC PR (EUR)', instrument: 'EUR', balance: 10448.75, syncIds: ['200222222222222262'] }, fetchParams: { index: '1' } }
]

it('ACCOUNT-001/002/003/004 preserves the complete current-account graph and fetch plans', () => {
  const raw = parseAccounts(fixture('accounts.html'))
  expect(convertAccounts(raw)).toEqual(expected)
  expect(convertAccounts([...raw].reverse())).toEqual([...expected].reverse())
})
