import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { OtpTransaction, Preferences, Session, OtpAccount } from './models'
import { getCookies } from '../yettelbank-rs/helpers'
import { checkResponseAndSetCookies, Currency, getCurrencyCodeNumeric } from './helpers'
import { parseAccounts, parseTransactions } from './parsers'
import moment from 'moment'

const baseUrl = 'https://ebank.otpbanka.rs/RetailV4/Protected/Services/'

async function fetchApi (url: string, options?: FetchOptions): Promise<FetchResponse> {
  return await fetchJson(baseUrl + url, options ?? {})
}

async function fetchLogin (username: string, otp: string): Promise<void> {
  const response = await fetchApi('RetailLoginService.svc/LoginUO', {
    method: 'POST',
    body: {
      username,
      otp,
      appType: 'AUTH_1',
      sessionID: 1
    },
    sanitizeResponseLog: { headers: { 'set-cookie': true } }
  })
  checkResponseAndSetCookies(response)
}

async function fetchAccounts (login: string): Promise<OtpAccount[]> {
  const response = await fetchApi('DataService.svc/GetAllAccountBalance', {
    method: 'POST',
    body: {
      sid: login,
      gridName: 'RetailAccountBalancePreviewFlat-L'
    },
    headers: {
      Cookies: getCookies()
    },
    sanitizeResponseLog: { headers: { 'set-cookie': true } }
  })
  checkResponseAndSetCookies(response)
  return parseAccounts(response.body as string[][])
}

async function fetchTransactions (accountNumber: string, currencyCode: string, fromDate: Date, toDate: Date): Promise<OtpTransaction[]> {
  if (toDate === null) toDate = new Date()
  const response = await fetchApi('DataService.svc/GetTransactionalAccountTurnover', {
    method: 'POST',
    body: {
      accountNumber,
      productCoreID: '1',
      filterParam: {
        CurrencyCodeNumeric: currencyCode,
        FromDate: moment(fromDate).format('DD.MM.YYYY'),
        ToDate: moment(toDate).format('DD.MM.YYYY'),
        ItemType: '',
        ItemCount: '',
        FromAmount: 0,
        ToAmount: 0
      },
      gridName: 'RetailAccountTurnoverTransactionPreviewMasterDetail-L'
    },
    headers: {
      Cookies: getCookies()
    },
    sanitizeResponseLog: { headers: { 'set-cookie': true } }
  })
  checkResponseAndSetCookies(response)

  const responseBody = response.body as string[][][][]
  return responseBody.length !== 0 ? parseTransactions(responseBody[0][1]) : []
}

export async function fetchAuthorization ({ login, password }: Preferences): Promise<{ cookieHeader: string, login: string }> {
  await fetchLogin(login, password)
  return { cookieHeader: getCookies(), login: login.slice(3) }
}

export async function fetchAllAccounts (session: Session): Promise<OtpAccount[]> {
  return await fetchAccounts(session.login)
}

export async function fetchProductTransactions (session: Session, accountNumber: string, currency: keyof typeof Currency, fromDate: Date, toDate: Date): Promise<OtpTransaction[]> {
  return await fetchTransactions(accountNumber, getCurrencyCodeNumeric(currency), fromDate, toDate)
}
