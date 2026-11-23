import { splitDateRange } from '../converters'

describe('splitDateRange', () => {
  it('splits range into periods of at most 12 months', () => {
    expect(splitDateRange(new Date(2025, 4, 4), new Date(2026, 10, 21))).toEqual([
      [new Date(2025, 4, 4), new Date(2026, 4, 3)],
      [new Date(2026, 4, 4), new Date(2026, 10, 21)]
    ])
  })

  it('returns single period for short range', () => {
    expect(splitDateRange(new Date(2026, 10, 1), new Date(2026, 10, 21))).toEqual([
      [new Date(2026, 10, 1), new Date(2026, 10, 21)]
    ])
  })
})
