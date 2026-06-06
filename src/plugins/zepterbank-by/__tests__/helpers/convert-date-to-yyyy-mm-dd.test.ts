import { convertDateToYyyyMmDd } from '../../helpers'

describe('dateToYyyyMmDd', () => {
  test('formats UTC date correctly', () => {
    const d = new Date('2026-02-12T00:00:00.000Z')
    expect(convertDateToYyyyMmDd(d)).toBe('2026-02-12')
  })

  test('ignores local timezone offset', () => {
    const d = new Date('2026-02-12T00:00:00+03:00')
    expect(convertDateToYyyyMmDd(d)).toBe('2026-02-11')
  })

  test('handles end of year', () => {
    const d = new Date('2025-12-31T23:59:59.999Z')
    expect(convertDateToYyyyMmDd(d)).toBe('2025-12-31')
  })

  test('leap day works', () => {
    const d = new Date('2028-02-29T12:00:00Z')
    expect(convertDateToYyyyMmDd(d)).toBe('2028-02-29')
  })

  test('works for epoch start', () => {
    const d = new Date(0) // 1970-01-01T00:00:00Z
    expect(convertDateToYyyyMmDd(d)).toBe('1970-01-01')
  })

  test('invalid date produces NaN parts', () => {
    const d = new Date('invalid')
    expect(convertDateToYyyyMmDd(d)).toBe('NaN-NaN-NaN')
  })
})
