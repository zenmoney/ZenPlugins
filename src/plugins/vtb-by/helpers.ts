import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'

export const ensureCurrency = (codeOrName: string): string | undefined =>
  isNaN(Number(codeOrName))
    ? codeOrName
    : codeToCurrencyLookup[codeOrName]

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0

export const getMaskedCardLastDigits = (cardNumberMasked: string): string =>
  cardNumberMasked.replace(/\D/g, '').slice(-4)

export const isDateInRange = (date: Date, fromDate: Date, toDate?: Date): boolean =>
  date.getTime() >= fromDate.getTime() &&
  (toDate == null || date.getTime() <= toDate.getTime())

const MAX_MINI_STATEMENT_DAYS = 31

const getStartOfDay = (date: Date): Date => {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

const getEndOfDay = (date: Date): Date => {
  const normalized = new Date(date)
  normalized.setHours(23, 59, 59, 999)
  return normalized
}

export const getMiniStatementIntervals = (fromDate: Date, toDate?: Date): Array<{ from: number, till: number }> => {
  const intervals: Array<{ from: number, till: number }> = []
  const rangeEnd = getEndOfDay(toDate ?? new Date())
  const earliestAvailableDate = getStartOfDay(new Date())
  earliestAvailableDate.setDate(earliestAvailableDate.getDate() - MAX_MINI_STATEMENT_DAYS + 1)

  let cursor = getStartOfDay(fromDate)

  if (cursor.getTime() < earliestAvailableDate.getTime()) {
    cursor = earliestAvailableDate
  }

  while (cursor.getTime() <= rangeEnd.getTime()) {
    const intervalEnd = getEndOfDay(cursor)
    intervalEnd.setDate(intervalEnd.getDate() + MAX_MINI_STATEMENT_DAYS - 1)

    intervals.push({
      from: cursor.getTime(),
      till: Math.min(intervalEnd.getTime(), rangeEnd.getTime())
    })

    cursor = new Date(intervals[intervals.length - 1].till + 1)
  }

  return intervals
}
