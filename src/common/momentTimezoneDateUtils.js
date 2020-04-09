const moment = require('moment')
require('moment-timezone')

export function parseDateInTimezone (dateTimeString, timezoneName) {
  const m = moment.tz(dateTimeString, timezoneName)
  console.assert(m.isValid(), `could not parse date ${dateTimeString} in time zone ${timezoneName}`)
  return m.toDate()
}
