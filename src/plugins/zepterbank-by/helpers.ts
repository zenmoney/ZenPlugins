import { BUSINESS_TZ, DATETIME_REGEX } from './models'

export const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0

export const convertIsoDateStringToDate = (isoDateString: string): Date => {
  const match = DATETIME_REGEX.exec(isoDateString)

  if (match === null) {
    return new Date(NaN)
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6])

  const utc = Date.UTC(year, month - 1, day, hour - BUSINESS_TZ, minute, second)

  return new Date(utc)
}

export const convertDateToYyyyMmDd = (date: Date): string => {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')

  return `${y}-${m}-${d}`
}
