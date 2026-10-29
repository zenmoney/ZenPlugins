import { operationDate } from '../converters'

// [model] Calendar-boundary and timezone invariants, not full bank response fixtures.
describe('[model] operation instants', () => {
  it('keeps the instant around midnight independently of the device calendar', () => {
    const date = operationDate({ operDate: '04.01.2026', operDateTime: '04.01.2026 21:41' })
    expect(date.toISOString()).toBe('2026-01-04T18:41:00.000Z')
    expect(new Date(date.getTime() + 7 * 3600000).toISOString()).toBe('2026-01-05T01:41:00.000Z')
  })

  it('does not include a December instant in the January interval', () => {
    const date = operationDate({ operDate: '31.12.2025', operDateTime: '31.12.2025 11:36' })
    expect(date.getTime()).toBeLessThan(new Date('2026-01-01T00:00:00+03:00').getTime())
  })

  it('preserves a labelled bank time and optional seconds', () => {
    expect(operationDate({ operDate: '19.04.2026', operDateTime: '19.04.2026 05:37:12 мск' }).toISOString())
      .toBe('2026-04-19T02:37:12.000Z')
  })

  it('rejects unknown time formats rather than silently losing time', () => {
    expect(() => operationDate({ operDate: '04.01.2026', operDateTime: '04.01.2026 21:41 unknown' }))
      .toThrow('Unsupported operation time format')
  })
})
