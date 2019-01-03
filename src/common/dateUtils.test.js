import { getIntervalBetweenDates } from './momentDateUtils'
import { formatCommentDateTime, isValidDate } from './dateUtils'

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
