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

export function dateInTimezone (date, timezoneOffsetMinutes) {
  return new Date(date.getTime() + (date.getTimezoneOffset() + timezoneOffsetMinutes) * 60000)
}

export function getMidnight (date, offset) {
  const midnight = new Date(date.getTime())
  midnight.setDate(midnight.getDate() + offset)
  midnight.setHours(0, 0, 0, 0)
  return midnight
}

export function getFirstDayOfMonth (date, offset = 0) {
  const firstDay = new Date(date.getTime())
  firstDay.setMonth(firstDay.getMonth() + offset, 1)
  return getMidnight(firstDay, 0)
}

export function isISODate (value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return isValidDate(date) && date.toISOString().slice(0, 10) === value
}

/** Classify an inclusive calendar-date range; partial periods remain custom. */
export function getDatePeriodType (from, to) {
  if (!isISODate(from) || !isISODate(to)) throw new Error('Invalid date period boundary')
  if (from > to) throw new Error('Invalid date period range')
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  const lastDay = getMidnight(getFirstDayOfMonth(end, 1), -1)
  if (start.getFullYear() === end.getFullYear() && start.getDate() === 1 && end.getDate() === lastDay.getDate()) {
    const monthCount = end.getMonth() - start.getMonth() + 1
    if (monthCount === 1) return 'month'
    if (monthCount === 3 && start.getMonth() % 3 === 0) return 'quarter'
    if (monthCount === 12) return 'year'
  }
  return 'custom'
}
