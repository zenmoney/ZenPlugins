import { createDateIntervals } from '../api'

function toDateRange (intervals) {
  return intervals.map(([fromDate, toDate]) => ([
    [fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), fromDate.getHours(), fromDate.getMinutes(), fromDate.getSeconds(), fromDate.getMilliseconds()],
    [toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), toDate.getHours(), toDate.getMinutes(), toDate.getSeconds(), toDate.getMilliseconds()]
  ]))
}

describe('createDateIntervals', () => {
  it('should split date period by whole days without overlap', () => {
    expect(toDateRange(
      createDateIntervals(new Date('2018-01-01T20:45+03:00'), new Date('2018-02-05T09:00+03:00'))
    )).toEqual([
      [[2018, 0, 1, 0, 0, 0, 0], [2018, 0, 10, 23, 59, 59, 999]],
      [[2018, 0, 11, 0, 0, 0, 0], [2018, 0, 20, 23, 59, 59, 999]],
      [[2018, 0, 21, 0, 0, 0, 0], [2018, 0, 30, 23, 59, 59, 999]],
      [[2018, 0, 31, 0, 0, 0, 0], [2018, 1, 5, 23, 59, 59, 999]]
    ])
  })

  it('should not reuse the same formatted day for adjacent UTC-based intervals', () => {
    expect(toDateRange(
      createDateIntervals(new Date('2026-01-01T00:00:00Z'), new Date('2026-01-25T00:00:00Z'))
    )).toEqual([
      [[2026, 0, 1, 0, 0, 0, 0], [2026, 0, 10, 23, 59, 59, 999]],
      [[2026, 0, 11, 0, 0, 0, 0], [2026, 0, 20, 23, 59, 59, 999]],
      [[2026, 0, 21, 0, 0, 0, 0], [2026, 0, 25, 23, 59, 59, 999]]
    ])
  })
})
