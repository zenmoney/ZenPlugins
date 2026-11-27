import { parseLedgerDate, parseTokenUtcDate } from '../ledgerDate'

// [model] Runtime-zone invariants; the Turkey-time evidence is documented in ledgerDate.ts.
describe('[model] date parsing', () => {
  const originalTz = process.env.TZ
  afterEach(() => { process.env.TZ = originalTz })

  it.each(['Europe/Istanbul', 'UTC', 'America/New_York', 'Asia/Tokyo'])('keeps the Turkey-time instant of createdAt in %s', zone => {
    process.env.TZ = zone
    expect(parseLedgerDate('2026-11-21T16:33:30.017').toISOString()).toBe('2026-11-21T13:33:30.017Z')
    // Crosses the UTC day boundary: 01:10 Turkey time is the previous UTC day.
    expect(parseLedgerDate('2026-11-20T01:10:00.500').toISOString()).toBe('2026-11-19T22:10:00.500Z')
  })

  it('rejects an unexpected createdAt format instead of guessing', () => {
    expect(() => parseLedgerDate('2026-11-21T16:33:30+03:00')).toThrow('Unexpected ledger createdAt format')
    expect(() => parseLedgerDate('2026-02-30T10:00:00')).toThrow('Invalid ledger createdAt value')
  })

  it('reads token expiry as UTC', () => {
    expect(parseTokenUtcDate('2026-11-23T22:55:52')?.toISOString()).toBe('2026-11-23T22:55:52.000Z')
    expect(parseTokenUtcDate('soon')).toBeNull()
  })
})
