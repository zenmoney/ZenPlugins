import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'

/**
 * Ensures that a valid currency name is returned from a given string
 * that may represent either a currency name or a numeric code.
 *
 * @param {string} codeOrName - A currency name (alphabetic code) or a numeric code as a string.
 * @returns {string|undefined} A valid currency code, or `undefined` if no match was found.
 *
 * @example
 * ensureCurrency("BYN") // → "BYN"
 * ensureCurrency("933") // → "EUR"
 */
export const ensureCurrency = (codeOrName: string): string | undefined =>
  isNaN(Number(codeOrName))
    ? codeOrName
    : codeToCurrencyLookup[codeOrName]

export const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0
