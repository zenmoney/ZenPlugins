import { toAtLeastTwoDigitsString } from './stringUtils'

export const isValidDate = (date) => date instanceof Date && !isNaN(date.getTime())

export function formatCommentDateTime (date) {
  if (!isValidDate(date)) {
    throw new Error('valid date should be provided')
  }
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(toAtLeastTwoDigitsString).join('-') + ' ' +
    [date.getHours(), date.getMinutes(), date.getSeconds()].map(toAtLeastTwoDigitsString).join(':')
}

export function toISODateString (date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(toAtLeastTwoDigitsString).join('-')
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
