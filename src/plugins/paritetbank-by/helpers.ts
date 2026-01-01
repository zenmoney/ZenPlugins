import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'
import { BUSINESS_TIME_OFFSET } from './models'

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

/**
 * Gets valid UNIX timestamp from server date ms timestamp
 *
 * @param {string} ts - Server timestamp
 * @returns {number} Valid UNIX timestamp from corresponding server value
 */
export const getUnixTimestamp = (ts: number): number => ts - BUSINESS_TIME_OFFSET
