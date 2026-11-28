import { convertArchiveAccounts, getRequiredRequisites, saveAccountGraph } from './archiveAccounts'
import { convertModernAccounts, convertModernTransactions, getRequiredOperationDetails, parseBankDate } from './modernConverters'
import { JsonObject } from './modernValidation'
import { AccountOrCard } from '../../types/zenmoney'
import get from '../../types/get'

const current: JsonObject = jest.requireActual('./modern-fixtures/archive/current.json')
const products: { body: JsonObject } = jest.requireActual('./modern-fixtures/archive/products.json')
const operations: JsonObject[] = jest.requireActual('./modern-fixtures/archive/operations.json')
const secondOperations: JsonObject[] = jest.requireActual('./modern-fixtures/archive/second-session-operations.json')
const requisitesResponses: Array<{ request: { id: number }, response: { body: JsonObject } }> = jest.requireActual('./modern-fixtures/archive/requisites.json')
const detailResponses: Array<{ body: JsonObject & { uohId: string } }> = jest.requireActual('./modern-fixtures/archive/details.json')
const expectedAccounts: AccountOrCard[] = jest.requireActual('./modern-fixtures/archive/expected-accounts.json')
const expectedAliases: Record<string, string> = jest.requireActual('./modern-fixtures/archive/expected-aliases.json')
const expectedTransactions: unknown[] = jest.requireActual('./modern-fixtures/archive/expected-transactions.json')
const secondExpectedTransactions: unknown[] = jest.requireActual('./modern-fixtures/archive/second-expected-transactions.json')
const requisites = new Map(requisitesResponses.map(item => [String(item.request.id), item.response.body]))
const details = new Map(detailResponses.map(item => [item.body.uohId, item.body]))
const from = new Date('2000-01-01T00:00:00+03:00')
const graph = (): ReturnType<typeof convertArchiveAccounts> => convertArchiveAccounts(convertModernAccounts(current), products.body, operations, requisites)

// ACCOUNT-001/002/003, AMOUNT-001/002, TRANSFER-001/004, STATUS-001,
// ID-001 and the requested-interval contract. Complete observed bank objects;
// independent reference ledgers and source interpretation are in provenance.json.
describe('complete historical Sberbank graph and financial records', () => {
  it('preserves all current and historical accounts and exact old-card/account aliases', () => {
    const result = graph()
    expect(result.accounts).toEqual(expectedAccounts)
    expect(Object.fromEntries([...result.byBankId].map(([id, account]) => [id, account.id]))).toEqual(expectedAliases)
    expect(result.accounts).toHaveLength(38)
    expect(new Set(result.accounts.map(a => a.id)).size).toBe(result.accounts.length)
    expect(result.accounts.filter(a => a.balance == null)).toHaveLength(24)
  })

  it('keeps conversion independent of item order and does not mutate the current graph', () => {
    const fresh = convertModernAccounts(current)
    const before = JSON.stringify(fresh.accounts)
    const reversed = convertArchiveAccounts(fresh, products.body, [...operations].reverse(), requisites)
    const sort = <T extends { id: string }>(items: T[]): T[] => [...items].sort((a, b) => a.id.localeCompare(b.id))
    expect(sort(reversed.accounts)).toEqual(sort(graph().accounts))
    expect(JSON.stringify(fresh.accounts)).toBe(before)
  })

  it('refreshes two old-card requisites on full runs while preserving physical account identities', () => {
    const initial = convertArchiveAccounts(convertModernAccounts(current), products.body, [])
    expect(getRequiredRequisites(operations, initial).sort()).toEqual([...requisites.keys()].sort())
    const saved = saveAccountGraph(graph())
    const repeat = convertArchiveAccounts(convertModernAccounts(current), products.body, operations, requisites, saved)
    expect(repeat.accounts).toEqual(expectedAccounts)
    const next = convertArchiveAccounts(convertModernAccounts(current), products.body, [], new Map(), saved)
    expect(getRequiredRequisites(operations, next).sort()).toEqual([...requisites.keys()].sort())
  })

  it.each(['sber:history:account:RUB:4049', 'sber:history:account:RUB:4050'])('archives cached account %s when a later real statement confirms its closure', id => {
    // ACCOUNT-002/003: replay the complete observed records before the closure,
    // then the second capture with rotated transport IDs and the actual closure.
    const full = graph()
    const closure = operations.find(row => row.form === 'UfsDepositClose' && get(row, 'state.category') === 'executed' && full.byBankId.get(String(get(row, 'fromResource.id')).replace(/^[^:]+:/, ''))?.id === id)
    if (closure == null) throw new Error('Missing observed closure')
    const earlier = operations.filter(row => parseBankDate(row.date) < parseBankDate(closure.date))
    const before = convertArchiveAccounts(convertModernAccounts(current), products.body, earlier, requisites)
    const previous = before.accounts.find(account => account.id === id)
    expect(previous).toBeDefined()
    expect(previous?.archived).toBeUndefined()
    const saved = saveAccountGraph(before)
    const unchanged = JSON.stringify(saved)
    const after = convertArchiveAccounts(convertModernAccounts(current), products.body, secondOperations, requisites, saved)
    const sort = (items: unknown[]): unknown[] => [...items].sort((a, b) => String(get(a, 'id')).localeCompare(String(get(b, 'id'))))
    // An older record can supply the masked resource label rather than the
    // later billing title. Closing the account must retain its saved title.
    const expectedAfter = expectedAccounts.map(account => account.id === id ? { ...account, title: previous?.title } : account)
    expect(sort(after.accounts)).toEqual(sort(expectedAfter))
    expect(JSON.stringify(saved)).toBe(unchanged)
    const repeat = convertArchiveAccounts(convertModernAccounts(current), products.body, secondOperations, requisites, saveAccountGraph(after))
    expect(repeat.accounts).toEqual(after.accounts)
  })

  it('converts the complete selected statement including cash withdrawals, closures, zero events and both FX directions', () => {
    const result = convertModernTransactions(operations, graph(), from, null, undefined, details)
    expect(JSON.parse(JSON.stringify(result))).toEqual(expectedTransactions)
    expect(result).toHaveLength(78)
    const ids = result.flatMap(t => t.movements.flatMap(m => m.id != null ? [`${m.id}:${'id' in m.account ? m.account.id : ''}`] : []))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('returns identical transactions on full repeats and only the requested subset on incremental runs', () => {
    const first = graph()
    const all = convertModernTransactions(operations, first, from, null, undefined, details)
    const repeat = convertArchiveAccounts(convertModernAccounts(current), products.body, operations, requisites, saveAccountGraph(first))
    expect(convertModernTransactions(operations, repeat, from, null, undefined, details)).toEqual(all)
    const boundary = new Date('2026-10-17T21:00:00Z')
    expect(convertModernTransactions(operations, repeat, boundary, null, undefined, details)).toEqual(all.filter(t => t.date >= boundary))
    const exact = all[0].date
    expect(convertModernTransactions(operations, repeat, exact, exact, undefined, details)).toEqual(all.filter(t => t.date.getTime() === exact.getTime()))
  })

  it('omits exclusively skipped histories while keeping both confirmed transfer sides when one side is included', () => {
    const full = graph()
    expect(getRequiredOperationDetails(operations, full, from, null, () => true)).toEqual([])
    expect(convertModernTransactions(operations, full, from, null, () => true, details)).toEqual([])
    const all = convertModernTransactions(operations, full, from, null, undefined, details)
    const transfer = all.find(t => t.movements.length === 2 && t.movements.every(m => 'id' in m.account))
    expect(transfer).toBeDefined()
    const skipped = (transfer?.movements[0].account as { id: string }).id
    expect(convertModernTransactions(operations, full, from, null, id => id === skipped, details)).toContainEqual(transfer)
  })

  it('keeps the same accounts when real closed-account IDs change between captured sessions', () => {
    const first = graph()
    const second = convertArchiveAccounts(convertModernAccounts(current), products.body, secondOperations, requisites, saveAccountGraph(first))
    expect(second.accounts).toEqual(expectedAccounts)
    let changedReferences = 0
    for (const record of operations) {
      if (record.isFinancial !== true || get(record, 'state.category') !== 'executed') continue
      const next = secondOperations.find(row => row.uohId === record.uohId)
      const oldId = get(record, 'billingAmount.id')
      const newId = get(next, 'billingAmount.id')
      if (typeof oldId !== 'string' || typeof newId !== 'string' || oldId === newId) continue
      changedReferences++
      expect(first.byBankId.get(oldId)?.id).toBe(second.byBankId.get(newId)?.id)
    }
    expect(changedReferences).toBeGreaterThan(0)
    const firstTransactions = convertModernTransactions(operations, first, from, null, undefined, details)
    const secondTransactions = convertModernTransactions(secondOperations, second, from, null, undefined, details)
    expect(JSON.parse(JSON.stringify(secondTransactions))).toEqual(secondExpectedTransactions)
    // Pending authorizations legitimately settle between the two captures.
    // Account IDs, operation IDs and monetary effects must remain unchanged.
    const financialEffects = (items: typeof firstTransactions): unknown[] => items.map(({ date, movements }) => ({ date, movements }))
    expect(financialEffects(secondTransactions)).toEqual(financialEffects(firstTransactions))
  })

  it('[model] preserves existing local identities from migration hints and ignores stale transport aliases', () => {
    const first = graph()
    const saved = saveAccountGraph(first)
    const localId = (id: string): string => `existing-local:${id}`
    const cache = {
      accounts: saved.accounts.map(account => ({ ...account, id: localId(account.id) })),
      maskedAccounts: saved.maskedAccounts?.map(([key, id]): [string, string] => [key, localId(id)]),
      // Persisted bank transport IDs can refer to different closed products on
      // the next session; only fresh bank evidence may resolve these references.
      aliases: saved.aliases.map(([id]): [string, string] => [id, localId(saved.accounts[0].id)])
    }
    const migrated = convertArchiveAccounts(convertModernAccounts(current), products.body, secondOperations, requisites, cache)
    const fresh = convertArchiveAccounts(convertModernAccounts(current), products.body, secondOperations, requisites)
    expect(migrated.accounts).toEqual(first.accounts.map(account => ({ ...account, id: localId(account.id) })))
    expect([...migrated.byBankId].map(([id, account]) => [id, account.id])).toEqual([...fresh.byBankId].map(([id, account]) => [id, localId(account.id)]))
  })
})
