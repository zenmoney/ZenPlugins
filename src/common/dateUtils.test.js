import { getIntervalBetweenDates } from './momentDateUtils'
import { createDateIntervals, formatCommentDateTime, isValidDate } from './dateUtils'

describe('formatCommentDateTime', () => {
  it('should return stringified datetime in year-month-day hours:minutes:seconds format', () => {
    expect(formatCommentDateTime(new Date(2017, 0, 2, 3, 4, 5))).toBe('2017-01-02 03:04:05')
    expect(formatCommentDateTime(new Date(2017, 10, 12, 13, 14, 15))).toBe('2017-11-12 13:14:15')
  })

  it('should throw on non-date', () => {
    [undefined, null, '', 1234567890].forEach((nonDate) => expect(() => formatCommentDateTime(nonDate)).toThrow())
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
