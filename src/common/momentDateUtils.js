import _ from 'lodash'
import moment from 'moment'

export function getIntervalBetweenDates (fromDate, toDate, intervals = ['year', 'month', 'day']) {
  const [d1, m1, y1] = toAdjustedDayMonthYearTuple(fromDate)
  const [d2, m2, y2] = toAdjustedDayMonthYearTuple(toDate)
  for (let i = 0; i < intervals.length; i++) {
    const interval = intervals[i]
    const count = interval === 'day'
      ? Math.floor((toDate.getTime() - fromDate.getTime()) / (24 * 3600 * 1000))
      : moment(toDate).diff(moment(fromDate), interval, i < intervals.length - 1)
    if (_.isInteger(count)) {
      return { interval, count }
    }
    if (Math.round(count) < 1) {
      continue
    }
    if (interval === 'year') {
      const date1 = new Date(Math.min(y1, y2), m1, d1)
      const date2 = new Date(Math.min(y1, y2), m2, d2)
      if (Math.abs(date2.getTime() - date1.getTime()) < 36 * 3600 * 1000) {
        return { interval, count: Math.round(count) }
      }
    } else if (interval === 'month') {
      if (d1 === d2 || (isLastDayInMonth(d1, m1) && isLastDayInMonth(d2, m2))) {
        return { interval, count: Math.round(count) }
      }
    }
  }
  throw new Error(`could not calculate interval between dates ${fromDate} ${toDate}`)
}

function toAdjustedDayMonthYearTuple (date) {
  const [day, month, year] = [date.getDate(), date.getMonth(), date.getFullYear()]
  if (month === 1 && day > 28) {
    return [28, month, year]
  } else {
    return [day, month, year]
  }
}

function isLastDayInMonth (day, month) {
  switch (month) {
    case 1:
      return day >= 27
    case 0:
    case 2:
    case 4:
    case 6:
    case 7:
    case 9:
    case 11:
      return day >= 30
    default:
      return day >= 29
  }
}
