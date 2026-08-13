import { mergeStatements } from '../converters'
import { SimbankStatementAccount, SimbankStatementTransaction } from '../models'
import { AccountOrCard, AccountType } from '../../../types/zenmoney'

const account = (id: string, date: string, balance: number, creditLimit: number | null = null, usedLimit: number | null = null): SimbankStatementAccount => ({
  id, title: 'Simbank *' + id.slice(-4), balance, creditLimit, usedLimit, instrument: 'KGS', date
})

const tx = (uid: string, amount: string): SimbankStatementTransaction => ({
  date: '2025-12-21T10:00:00.000', amount, balance: '0,00', description: 'op', uid, originString: ''
})

describe('mergeStatements', () => {
  it('returns nothing for null', () => {
    expect(mergeStatements(null)).toEqual({ accounts: [], transactions: [] })
  })

  it('merges several files of the SAME card into one (no duplicate-id crash)', () => {
    const result = mergeStatements([
      { account: account('402183****0412', '2026-06-10T00:00:00.000', 100), transactions: [tx('a', '-10,00')] },
      { account: account('402183****0412', '2026-06-21T00:00:00.000', 200), transactions: [tx('b', '-20,00')] }
    ])
    expect(result.accounts).toHaveLength(1)
    expect(new Set(result.accounts.map(a => a.id)).size).toBe(1)
    // freshest statement wins the balance
    expect(result.accounts[0].balance).toBe(200)
    expect(result.transactions).toHaveLength(2)
  })

  it('deduplicates overlapping rows across files by movement id', () => {
    const result = mergeStatements([
      { account: account('402183****0412', '2026-06-10T00:00:00.000', 100), transactions: [tx('a', '-10,00'), tx('b', '-20,00')] },
      { account: account('402183****0412', '2026-06-21T00:00:00.000', 200), transactions: [tx('a', '-10,00'), tx('b', '-20,00'), tx('c', '-30,00')] }
    ])
    expect(result.accounts).toHaveLength(1)
    expect(result.transactions).toHaveLength(3)
    expect(result.transactions.map(t => t.movements[0].id).sort((a, b) => (a ?? '').localeCompare(b ?? ''))).toEqual(['a', 'b', 'c'])
  })

  it('keeps distinct cards separate', () => {
    const result = mergeStatements([
      { account: account('402183****0412', '2026-06-21T00:00:00.000', 200), transactions: [tx('a', '-10,00')] },
      { account: account('555555****9999', '2026-06-21T00:00:00.000', 50), transactions: [tx('x', '-5,00')] }
    ])
    expect(result.accounts).toHaveLength(2)
    expect(new Set(result.accounts.map(a => a.id)).size).toBe(2)
  })

  it('takes the credit limit from the freshest statement (limit may change)', () => {
    const result = mergeStatements([
      { account: account('402183****0412', '2026-05-31T00:00:00.000', -1338.20, 200000), transactions: [tx('a', '-10,00')] },
      { account: account('402183****0412', '2026-06-21T00:00:00.000', -50000, 100000), transactions: [tx('b', '-20,00')] }
    ])
    expect(result.accounts).toHaveLength(1)
    const acc = result.accounts[0] as AccountOrCard
    expect(acc.type).toBe(AccountType.ccard)
    expect(acc.creditLimit).toBe(100000) // freshest statement's limit
    expect(acc.balance).toBe(-50000) // own funds from the freshest statement
  })

  it('falls back to a checking account when the freshest statement has no limit (disabled)', () => {
    const result = mergeStatements([
      { account: account('402183****0412', '2026-05-31T00:00:00.000', 198661.80, 200000), transactions: [tx('a', '-10,00')] },
      { account: account('402183****0412', '2026-06-21T00:00:00.000', 1234.00, null), transactions: [tx('b', '-20,00')] }
    ])
    const acc = result.accounts[0] as AccountOrCard
    expect(acc.type).toBe(AccountType.checking)
    expect(acc.creditLimit).toBeUndefined()
    expect(acc.balance).toBe(1234.00)
  })
})
