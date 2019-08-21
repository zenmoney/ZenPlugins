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

export function createDateIntervals ({ fromDate, toDate, addIntervalToDate, gapMs = 0 }) {
  const minDate = new Date(Math.min(fromDate.getTime(), toDate.getTime()))
  const maxDate = new Date(Math.max(fromDate.getTime(), toDate.getTime()))
  const dates = []
  let previousDate = fromDate
  let currentDate
  while (true) {
    currentDate = addIntervalToDate(previousDate)
    if (!currentDate || currentDate.getTime() === previousDate.getTime()) {
      console.assert(false, 'invalid addIntervalToDate implementation. Expected to return valid changed date. Previous was', previousDate)
      break
    }
    if (currentDate.getTime() > maxDate.getTime()) {
      currentDate = maxDate
      break
    } else if (currentDate.getTime() < minDate.getTime()) {
      currentDate = minDate
      break
    } else {
      const currentDateWithGap = new Date(currentDate.getTime() + gapMs)
      if (currentDateWithGap.getTime() < minDate) {
        break
      } else if (currentDateWithGap.getTime() > maxDate) {
        break
      } else {
        dates.push([previousDate, currentDate])
        previousDate = currentDateWithGap
      }
    }
  }
  if (currentDate.getTime() !== previousDate.getTime()) {
    dates.push([previousDate, currentDate])
  }
  return dates
}

export function changeTimezoneToCurrent (date, fromTimezoneOffsetSeconds) {
  return new Date(date.getTime() + (date.getTimezoneOffset() + fromTimezoneOffsetSeconds) * 60000)
}
