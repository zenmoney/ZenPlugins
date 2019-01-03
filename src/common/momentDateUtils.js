import _ from 'lodash'

// FIXME too fat and expensive dependency
const moment = require('moment')

export function getIntervalBetweenDates (fromDate, toDate, intervals = ['year', 'month', 'day']) {
  for (let i = 0; i < intervals.length; i++) {
    const interval = intervals[i]
    const count = moment(toDate).diff(moment(fromDate), interval, i < intervals.length - 1)
    if (_.isInteger(count)) {
      return { interval, count }
    }
  }
  throw new Error(`could not calculate interval between dates ${fromDate} ${toDate}`)
}
