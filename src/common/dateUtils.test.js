import { createDateIntervals, dateInTimezone, formatCommentDateTime, getDatePeriodType, getFirstDayOfMonth, getMidnight, isISODate, isValidDate, toISODateString } from './dateUtils'
import { getIntervalBetweenDates } from './momentDateUtils'

describe('formatCommentDateTime', () => {
  it('should return stringified datetime in year-month-day hours:minutes:seconds format', () => {
    expect(formatCommentDateTime(new Date(2017, 0, 2, 3, 4, 5))).toBe('2017-01-02 03:04:05')
    expect(formatCommentDateTime(new Date(2017, 10, 12, 13, 14, 15))).toBe('2017-11-12 13:14:15')
  })

  it('should throw on non-date', () => {
    for (const nonDate of [undefined, null, '', 1234567890]) {
      expect(() => formatCommentDateTime(nonDate)).toThrow()
    }
  })
})

describe('isValidDate', () => {
  it('should return true for valid dates', () => {
    expect(isValidDate(new Date())).toBeTruthy()
  })
  it('should return false for invalid dates and other types', () => {
    expect(isValidDate(new Date('non-date'))).toBeFalsy()
    expect(isValidDate(Date.now())).toBeFalsy()
    expect(isValidDate(null)).toBeFalsy()
    expect(isValidDate()).toBeFalsy()
  })
})

describe('getIntervalBetweenDates', () => {
  it('returns right intervals', () => {
    expect(getIntervalBetweenDates(new Date('2018-06-01'), new Date('2019-06-01'))).toEqual({
      interval: 'year',
      count: 1
    })
    expect(getIntervalBetweenDates(new Date('2012-05-28'), new Date('2025-08-21'), ['year', 'month'])).toEqual({
      interval: 'month',
      count: 158
    })
    expect(getIntervalBetweenDates(new Date('2018-06-01'), new Date('2018-06-10'))).toEqual({
      interval: 'day',
      count: 9
    })
  })
})

describe('createDateIntervals', () => {
  it('returns ascending intervals', () => {
    expect(createDateIntervals({
      fromDate: new Date('2019-01-01'),
      toDate: new Date('2019-01-29'),
      addIntervalToDate: date => new Date(date.getTime() + 7 * 24 * 3600 * 1000)
    })).toEqual([
      [new Date('2019-01-01'), new Date('2019-01-08')],
      [new Date('2019-01-08'), new Date('2019-01-15')],
      [new Date('2019-01-15'), new Date('2019-01-22')],
      [new Date('2019-01-22'), new Date('2019-01-29')]
    ])
  })

  it('returns descending intervals', () => {
    expect(createDateIntervals({
      fromDate: new Date('2019-01-29'),
      toDate: new Date('2019-01-01'),
      addIntervalToDate: date => new Date(date.getTime() - 7 * 24 * 3600 * 1000)
    })).toEqual([
      [new Date('2019-01-29'), new Date('2019-01-22')],
      [new Date('2019-01-22'), new Date('2019-01-15')],
      [new Date('2019-01-15'), new Date('2019-01-08')],
      [new Date('2019-01-08'), new Date('2019-01-01')]
    ])
  })

  it('returns empty array for equal dates', () => {
    expect(createDateIntervals({
      fromDate: new Date('2019-01-01'),
      toDate: new Date('2019-01-01'),
      addIntervalToDate: date => new Date(date.getTime() - 7 * 24 * 3600 * 1000)
    })).toEqual([])
  })

  it('returns original interval, if addIntervalToDate changes date to date outside of original interval', () => {
    expect(createDateIntervals({
      fromDate: new Date('2019-01-01'),
      toDate: new Date('2019-01-29'),
      addIntervalToDate: date => new Date(date.getTime() + 30 * 24 * 3600 * 1000)
    })).toEqual([
      [new Date('2019-01-01'), new Date('2019-01-29')]
    ])
  })

  it('constraints dates to max and min', () => {
    expect(createDateIntervals({
      fromDate: new Date('2018-01-01T20:45+03:00'),
      toDate: new Date('2018-02-05T09:00+03:00'),
      addIntervalToDate: date => new Date(date.getTime() + 10 * 24 * 60 * 60 * 1000 - 1000),
      gapMs: 1000
    })).toEqual([
      [new Date('2018-01-01T20:45:00+03:00'), new Date('2018-01-11T20:44:59.000+03:00')],
      [new Date('2018-01-11T20:45:00+03:00'), new Date('2018-01-21T20:44:59.000+03:00')],
      [new Date('2018-01-21T20:45:00+03:00'), new Date('2018-01-31T20:44:59.000+03:00')],
      [new Date('2018-01-31T20:45:00+03:00'), new Date('2018-02-05T09:00:00.000+03:00')]
    ])
  })

  it('constraints dates with gap to max and min', () => {
    expect(createDateIntervals({
      fromDate: new Date('2018-01-01'),
      toDate: new Date('2018-02-02'),
      addIntervalToDate: date => new Date(date.getTime() + 10 * 24 * 60 * 60 * 1000),
      gapMs: 10 * 24 * 60 * 60 * 1000
    })).toEqual(
      [
        [new Date('2018-01-01'), new Date('2018-01-11')],
        [new Date('2018-01-21'), new Date('2018-01-31')]
      ]
    )
  })

  it('throws error if addIntervalToDate works not as expected', () => {
    expect(() => createDateIntervals({
      fromDate: new Date('2019-01-01'),
      toDate: new Date('2019-01-29'),
      addIntervalToDate: date => new Date('2019-01-01')
    })).toThrow()
  })
})

describe('dateInTimezone', () => {
  it('moves date to specific time zone', () => {
    expect(dateInTimezone(new Date('2019-01-01T00:00:00+06:00'), 6 * 60)).toEqual(new Date(2019, 0, 1))
    expect(dateInTimezone(new Date('2019-05-13T23:04:05-03:00'), -3 * 60)).toEqual(new Date(2019, 4, 13, 23, 4, 5))
  })
})

describe('calendar dates and inclusive periods [model]', () => {
  // Calendar boundaries must preserve local dates, reject rollover and leave inputs intact.
  it.each([
    ['2028-02-29', true],
    ['2026-02-29', false],
    ['2026-04-31', false],
    ['2026-8-01', false],
    ['2026-08-01T00:00:00Z', false],
    [null, false]
  ])('strictly validates ISO date %s', (value, expected) => {
    expect(isISODate(value)).toBe(expected)
  })

  it.each([
    [0, new Date(2026, 0, 1)],
    [1, new Date(2026, 1, 1)],
    [-1, new Date(2025, 11, 1)]
  ])('finds the first day with month offset %s without overflowing or mutating the input', (offset, expected) => {
    const date = new Date(2026, 0, 31, 17, 45)
    expect(getFirstDayOfMonth(date, offset)).toEqual(expected)
    expect(date).toEqual(new Date(2026, 0, 31, 17, 45))
  })

  it('resets time at the target month boundary', () => {
    // In America/Santiago, this source day's midnight rolls forward to 01:00.
    expect(getFirstDayOfMonth(new Date(2026, 8, 6, 17, 45))).toEqual(new Date(2026, 8, 1))
  })

  it.each([
    [new Date(2026, 1, 15), '2026-02-28'],
    [new Date(2028, 1, 15), '2028-02-29'],
    [new Date(2026, 11, 15), '2026-12-31']
  ])('finds the last day of the month containing %s', (date, expected) => {
    expect(toISODateString(getMidnight(getFirstDayOfMonth(date, 1), -1))).toBe(expected)
  })

  it.each([
    ['2026-12-31T20:59:59Z', 180, '2026-12-31'],
    ['2026-12-31T21:00:00Z', 180, '2027-01-01'],
    ['2026-12-31T21:00:00Z', 0, '2026-12-31'],
    ['2027-01-01T00:00:00Z', -180, '2026-12-31']
  ])('formats %s at the requested offset of %s minutes', (value, offset, expected) => {
    expect(toISODateString(dateInTimezone(new Date(value), offset))).toBe(expected)
  })

  it.each([
    ['2028-02-01', '2028-02-29', 'month'],
    ['2026-04-01', '2026-06-30', 'quarter'],
    ['2026-01-01', '2026-12-31', 'year'],
    ['2026-02-01', '2026-04-30', 'custom'],
    ['2026-09-07', '2026-09-13', 'custom'],
    ['2026-12-27', '2027-01-03', 'custom']
  ])('classifies inclusive range %s through %s as %s', (from, to, expected) => {
    expect(getDatePeriodType(from, to)).toBe(expected)
  })

  it('rejects invalid or reversed period boundaries', () => {
    expect(() => getDatePeriodType('2026-02-01', '2026-02-30')).toThrow('Invalid date period boundary')
    expect(() => getDatePeriodType('2026-08-20', '2026-08-10')).toThrow('Invalid date period range')
  })
})
