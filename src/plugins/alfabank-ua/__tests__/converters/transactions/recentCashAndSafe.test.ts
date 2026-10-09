const { convertTransaction, convertAccounts }: { convertTransaction: (raw: unknown, account: unknown, accounts?: unknown) => unknown, convertAccounts: (raw: unknown) => Array<{ account: { id: string } }> } = jest.requireActual('../../../converters')
const fixtures: Record<string, { operation: { id: string, operationDate: string, operationName: string, subjectUnit: string }, accountId: string, products: unknown[] }> = jest.requireActual('./recentCashAndSafe.json')

// TRANSFER-001/004: complete retained records and observed products are stored with source/build provenance.
describe('Sense cash and income-safe source records', () => {
  it.each(['cash-in', 'cash-out'] as const)('creates the observed cash movement for %s', key => {
    const fixture = fixtures[key]
    const raw = fixture.operation
    const account = { id: fixture.accountId, instrument: raw.subjectUnit }
    const sum = key === 'cash-in' ? 27000 : -100
    expect(convertTransaction(raw, account)).toEqual({
      date: new Date(raw.operationDate),
      hold: false,
      movements: [
        { id: raw.id, account: { id: account.id }, sum, fee: 0, invoice: null },
        { id: null, account: { type: 'cash', instrument: account.instrument, company: null, syncIds: null }, sum: -sum, fee: 0, invoice: null }
      ],
      merchant: null,
      comment: null
    })
  })
  it.each(['safe-in', 'safe-out'] as const)('preserves the confirmed local movement for %s without inventing safe posting', key => {
    const fixture = fixtures[key]
    const plans = convertAccounts(fixture.products)
    const accountsById = Object.fromEntries(plans.map((plan: { account: { id: string } }) => [plan.account.id, plan.account]))
    const account = accountsById[fixture.accountId]
    expect(accountsById[`${fixture.accountId}-safe`]).toBeDefined()
    expect(convertTransaction(fixture.operation, account, accountsById)).toEqual({
      date: new Date(fixture.operation.operationDate),
      hold: false,
      movements: [{ id: fixture.operation.id, account: { id: fixture.accountId }, sum: key === 'safe-in' ? -12000 : 3084.69, fee: 0, invoice: null }],
      merchant: null,
      comment: fixture.operation.operationName
    })
  })
})

export {}
