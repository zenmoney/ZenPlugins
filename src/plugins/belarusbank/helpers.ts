import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'

export const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string' && typeof value !== 'number') return null

  const result = String(value).trim()
  return result.length > 0 ? result : null
}

export const normalizeCurrency = (value: unknown): string => {
  const currency = asNonEmptyString(value)
  if (currency == null) throw new Error('Currency is missing')

  const normalized = currency.toUpperCase()
  if (/^[A-Z]{3}$/.test(normalized)) return normalized

  const byNumericCode = codeToCurrencyLookup[normalized]
  if (byNumericCode != null) return byNumericCode

  throw new Error(`Unknown currency: ${currency}`)
}

export const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(new Set(values.map(asNonEmptyString).filter((value): value is string => value != null)))

export const parseDate = (value: unknown, fallback: Date): Date => {
  if (typeof value !== 'string' && typeof value !== 'number') return fallback

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date
}

export const parseRequiredDate = (value: unknown, fieldName: string): Date => {
  const date = parseDate(value, new Date(Number.NaN))
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid ${fieldName}`)
  return date
}

const LOCAL_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/

/** Parses a Belarusbank timestamp without an explicit offset as Minsk local time. */
export const parseMinskDate = (value: unknown, fieldName: string): Date => {
  const normalizedValue = typeof value === 'string' && LOCAL_DATE_TIME_PATTERN.test(value.trim())
    ? `${value.trim()}+03:00`
    : value

  return parseRequiredDate(normalizedValue, fieldName)
}

export const toNumber = (value: unknown, fallback: number): number => {
  if (typeof value !== 'string' && typeof value !== 'number') return fallback

  const result = Number(String(value).replace(',', '.'))
  return Number.isFinite(result) ? result : fallback
}

export const toOptionalNumber = (value: unknown): number | null => {
  const result = toNumber(value, Number.NaN)
  return Number.isNaN(result) ? null : result
}

export const isArchived = (status: unknown): boolean | undefined => {
  if (typeof status === 'boolean') return status

  const value = asNonEmptyString(status)
  if (value == null) return undefined

  if (/^-?\d+$/.test(value)) return Number(value) === -1

  return !/(?:ACTIVE|OPEN|ДЕЙСТВ|АКТИВ)/i.test(value)
}

export const getLastCardDigits = (value: unknown): string | null => {
  const cardPan = asNonEmptyString(value)
  if (cardPan == null) return null

  const digits = cardPan.replace(/\D/g, '')
  return digits.length >= 4 ? digits.slice(-4) : null
}
