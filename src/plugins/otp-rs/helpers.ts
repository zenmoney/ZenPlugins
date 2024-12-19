import { FetchResponse } from '../../common/network'
import { TemporaryUnavailableError } from '../../errors'
import { setCookies } from '../yettelbank-rs/helpers'

export function checkResponseAndSetCookies (response: FetchResponse): void {
  if (response.status !== 200) {
    throw new TemporaryUnavailableError()
  }
  setCookies(response)
}

export enum Currency {
  EUR = '978',
  RSD = '941'
}

export function getCurrencyCodeNumeric (currency: keyof typeof Currency): string {
  return Currency[currency]
}
