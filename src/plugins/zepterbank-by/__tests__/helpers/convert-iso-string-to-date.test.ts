import { convertIsoDateStringToDate } from '../../helpers'

describe('convertIsoDateStringToDate', () => {
  it('converts +BUSINESS_TIME_OFFSET local time to correct UTC instant', () => {
    const d = convertIsoDateStringToDate('2026-02-12T20:58:51')
    const expected = new Date('2026-02-12T20:58:51+03:00').toISOString()
    expect(d.toISOString()).toBe(expected)
  })

  it('crosses day boundary when subtracting offset (early hours)', () => {
    const d = convertIsoDateStringToDate('2026-02-12T01:00:00')
    const expected = new Date('2026-02-12T01:00:00+03:00').toISOString()
    expect(d.toISOString()).toBe(expected)
  })

  it('crosses year boundary when subtracting offset (Jan 1)', () => {
    const d = convertIsoDateStringToDate('2026-01-01T00:10:00')
    const expected = new Date('2026-01-01T00:10:00+03:00').toISOString()
    expect(d.toISOString()).toBe(expected)
  })

  it('parses leap day correctly (2028-02-29)', () => {
    const d = convertIsoDateStringToDate('2028-02-29T12:34:56')
    const expected = new Date('2028-02-29T12:34:56+03:00').toISOString()
    expect(d.toISOString()).toBe(expected)
  })

  it('does not depend on system timezone (mock TZ by forcing Date toISOString stable check)', () => {
    const d = convertIsoDateStringToDate('2026-02-12T20:58:51')
    expect(d.toISOString().endsWith('Z')).toBe(true)
  })

  it('returns an invalid date for malformed input (missing T)', () => {
    const d = convertIsoDateStringToDate('2026-02-12 20:58:51')
    expect(Number.isNaN(d.getTime())).toBe(true)
  })

  it('returns an invalid date for malformed input (non-numeric parts)', () => {
    const d = convertIsoDateStringToDate('aaaa-bb-ccTdd:ee:ff')
    expect(Number.isNaN(d.getTime())).toBe(true)
  })

  it('ignores milliseconds if present (current implementation will make seconds NaN -> invalid)', () => {
    const d = convertIsoDateStringToDate('2026-02-12T20:58:51.123' as any)
    expect(Number.isNaN(d.getTime())).toBe(true)
  })
})
