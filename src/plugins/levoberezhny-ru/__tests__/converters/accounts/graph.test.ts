import { convertAccounts } from '../../../converters'
import { AccountType } from '../../../../../types/zenmoney'

// Complete relevant source graph, including hidden accounts and old cards.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const source = require('../../fixtures/accounts.json') as { accounts: unknown[] }

it('selects card-backed and open current accounts, including hidden accounts but excluding closed noncard products', () => {
  const expected = [{
    account: {
      id: '900002',
      type: AccountType.ccard,
      title: 'Тестовый счёт 1',
      instrument: 'RUB',
      syncIds: ['2200********0001', '40817810000000000001'],
      balance: 21522.41,
      archived: false
    },
    fetchParams: { accountId: '900002' }
  }, ...[
    { id: '900006', title: 'Тестовый счёт 2', number: '40817810000000000002', balance: 28345.65 },
    { id: '900008', title: 'Тестовый счёт 3', number: '40817810000000000003', balance: 0 }
  ].map(item => ({
    account: { id: item.id, type: AccountType.checking, title: item.title, instrument: 'RUB', syncIds: [item.number], balance: item.balance, archived: false },
    fetchParams: { accountId: item.id }
  }))]
  expect(convertAccounts(source.accounts)).toEqual(expected)
  expect(convertAccounts([...source.accounts].reverse())).toEqual([...expected].reverse())
})

// The captured source contains one WORK card and two CLOSE cards on the same account.
it('passes only the open card and account number through the real host adapter', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { patchAccounts } = require('../../../../../common/adapters') as { patchAccounts: (accounts: unknown[]) => Array<{ syncID: string[] }> }
  Object.assign(global, { ZenMoney: { features: { investmentAccount: false } } })
  const accounts = convertAccounts(source.accounts).map(plan => plan.account)
  const result = patchAccounts(accounts)
  expect(result[0].syncID).toEqual(['2200********0001', '*****810000000000001'])
  expect(result).toHaveLength(3)
})

it('does not reinterpret an account with only closed cards as a cardless current account', () => {
  const cardAccount = structuredClone(source.accounts[0]) as Record<string, unknown>
  const limits = cardAccount.limits as Array<{ cards: Array<Record<string, unknown>> }>
  for (const limit of limits) {
    for (const card of limit.cards) card.status = 'CLOSE'
  }
  expect(convertAccounts([cardAccount])).toEqual([])
})

it('uses availableWhenPay once for every supported debit account', () => {
  const plans = convertAccounts(source.accounts)
  expect(plans).toHaveLength(3)
  expect(plans[0].account.balance).toBe(21522.41)
  expect(plans.map(plan => plan.account.balance)).toEqual([21522.41, 28345.65, 0])
  expect(plans[0].account).not.toHaveProperty('creditLimit')
})
