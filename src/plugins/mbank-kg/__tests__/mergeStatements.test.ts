import { mergeStatements } from '../converters'
import { MBankStatementAccount, MBankStatementTransaction } from '../models'

const account = (id: string, date: string, balance: number): MBankStatementAccount => ({
  id, title: 'MBank *' + id.slice(-4), balance, instrument: 'KGS', date
})

const tx = (uid: string, debit: string, credit: string): MBankStatementTransaction => ({
  date: '2026-06-01T10:00:00.000', debit, credit, payee: 'ОАО "МБАНК"', description: 'op', uid
})

describe('mergeStatements', () => {
  it('returns nothing for an empty list', () => {
    expect(mergeStatements([])).toEqual({ accounts: [], transactions: [] })
  })

  it('merges several files of the SAME account into one (no duplicate-id crash)', () => {
    const result = mergeStatements([
      { account: account('1033220210523058', '2026-06-10T00:00:00.000', 100), transactions: [tx('a', '10,00', '0,00')] },
      { account: account('1033220210523058', '2026-06-21T00:00:00.000', 200), transactions: [tx('b', '20,00', '0,00')] }
    ])
    expect(result.accounts).toHaveLength(1)
    expect(new Set(result.accounts.map(a => a.id)).size).toBe(1)
    // freshest statement wins the balance
    expect(result.accounts[0].balance).toBe(200)
    expect(result.transactions).toHaveLength(2)
  })

  it('deduplicates overlapping rows across files by movement id', () => {
    const result = mergeStatements([
      { account: account('1033220210523058', '2026-06-10T00:00:00.000', 100), transactions: [tx('a', '10,00', '0,00'), tx('b', '20,00', '0,00')] },
      { account: account('1033220210523058', '2026-06-21T00:00:00.000', 200), transactions: [tx('a', '10,00', '0,00'), tx('b', '20,00', '0,00'), tx('c', '30,00', '0,00')] }
    ])
    expect(result.accounts).toHaveLength(1)
    expect(result.transactions).toHaveLength(3)
    expect(result.transactions.map(t => t.movements[0].id).sort((a, b) => (a ?? '').localeCompare(b ?? ''))).toEqual(['a', 'b', 'c'])
  })

  it('keeps distinct accounts separate (e.g. KGS + USD)', () => {
    const result = mergeStatements([
      { account: account('1033220210523058', '2026-06-21T00:00:00.000', 200), transactions: [tx('a', '10,00', '0,00')] },
      { account: { ...account('1030120343416812', '2026-06-21T00:00:00.000', 3), instrument: 'USD' }, transactions: [tx('z', '0,00', '2,00')] }
    ])
    expect(result.accounts).toHaveLength(2)
    expect(new Set(result.accounts.map(a => a.id)).size).toBe(2)
    expect(result.accounts.find(a => a.id === '1030120343416812')?.instrument).toBe('USD')
    expect(result.transactions).toHaveLength(2)
  })
})
