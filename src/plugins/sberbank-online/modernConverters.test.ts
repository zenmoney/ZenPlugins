import { convertModernAccounts, convertModernTransactions } from './modernConverters'
import { JsonObject } from './modernValidation'

const model: JsonObject = jest.requireActual('./modern-fixtures/accounts.json')
const operations: unknown[] = jest.requireActual('./modern-fixtures/operations.json')
const expectedAccounts: unknown[] = jest.requireActual('./modern-fixtures/expected-accounts.json')
const expectedTransactions: unknown[] = jest.requireActual('./modern-fixtures/expected-transactions.json')
const fromDate = new Date('2026-10-17T21:00:00Z')

// Real, complete sanitized bank records; see modern-fixtures/provenance.json.
// ACCOUNT-001/002/003, TRANSFER-001, AMOUNT-001, STATUS-001, ID-001.
describe('modern Sberbank source records', () => {
  it('converts the full account graph without duplicating wallet representations', () => {
    expect(convertModernAccounts(model).accounts).toEqual(expectedAccounts)
  })

  it('preserves account identity and matching IDs when bank order changes', () => {
    const reversed: JsonObject = JSON.parse(JSON.stringify(model))
    for (const value of Object.values(reversed)) {
      const block = value as { data: unknown[] }
      block.data.reverse()
    }
    const sort = (items: Array<{ id: string }>): Array<{ id: string }> => items.sort((a, b) => a.id.localeCompare(b.id))
    expect(sort(convertModernAccounts(reversed).accounts)).toEqual(sort([...expectedAccounts] as Array<{ id: string }>))
  })

  it('converts all posted/pending records and excludes cancellations and nonfinancial events', () => {
    const result = convertModernTransactions(operations, convertModernAccounts(model), fromDate)
    expect(JSON.parse(JSON.stringify(result))).toEqual(expectedTransactions)
  })

  it('returns identical movement identities on repeated and overlapping runs', () => {
    const graph = convertModernAccounts(model)
    const first = convertModernTransactions(operations, graph, fromDate)
    const repeat = convertModernTransactions(operations, graph, fromDate)
    expect(repeat).toEqual(first)
    const boundary = first[0].date
    expect(convertModernTransactions(operations, graph, boundary, boundary)).toEqual(first.filter(item => item.date.getTime() === boundary.getTime()))
  })

  it('keeps both sides of a confirmed transfer when only one account is skipped', () => {
    const graph = convertModernAccounts(model)
    const all = convertModernTransactions(operations, graph, fromDate)
    const transfer = all.find(t => t.movements.length === 2 && t.movements.every(m => 'id' in m.account))
    expect(transfer).toBeDefined()
    const id = (transfer?.movements[0].account as { id: string }).id
    expect(convertModernTransactions(operations, graph, fromDate, null, x => x === id)).toContainEqual(transfer)
    expect(convertModernTransactions(operations, graph, fromDate, null, () => true)).toEqual([])
  })
})
