import padLeft from 'pad-left'
import * as _ from 'lodash'

const moment = require('moment')

export const toAtLeastTwoDigitsString = (number) => padLeft(number, 2, '0')

export const isValidDate = (date) => date instanceof Date && !isNaN(date.getTime())

export function formatCommentDateTime (date) {
  if (!isValidDate(date)) {
    throw new Error('valid date should be provided')
  }
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(toAtLeastTwoDigitsString).join('-') + ' ' +
    [date.getHours(), date.getMinutes(), date.getSeconds()].map(toAtLeastTwoDigitsString).join(':')
}

export function toShortISOString (date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(toAtLeastTwoDigitsString).join('-')
}

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

export function toDate (date) {
  if (date instanceof Date) {
    return date
  }
  if (typeof date === 'string') {
    return new Date(date)
  }
  if (typeof date === 'number') {
    return new Date(date < 10000000000 ? date * 1000 : date)
  }
  throw new Error(`could not convert ${date} to date`)
}

export function toMoscowDate (date) {
  return new Date(date.getTime() + (date.getTimezoneOffset() + 180) * 60000)
}
