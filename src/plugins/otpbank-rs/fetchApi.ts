import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { OtpTransaction, Preferences, Session, OtpAccount, OtpCard, Product } from './models'
import { getCookies } from '../yettelbank-rs/helpers'
import { checkResponseAndSetCookies, Currency, getCurrencyCodeNumeric } from './helpers'
import { parseAccounts, parseCardTurnover, parseCards, parseTransactions } from './parsers'
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

async function fetchCards (login: string): Promise<OtpCard[]> {
  const response = await fetchApi('DataService.svc/GetAllCard', {
    method: 'POST',
    body: {
      sid: login,
      gridName: 'RetailCardListPreviewFlat-L'
    },
    headers: {
      Cookies: getCookies()
    },
    sanitizeResponseLog: { headers: { 'set-cookie': true } }
  })
  checkResponseAndSetCookies(response)
  return parseCards(response.body as string[][])
}

async function fetchAccountTransactions (accountNumber: string, currencyCode: string, fromDate: Date, toDate: Date): Promise<OtpTransaction[]> {
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

async function fetchCardTransactions (
  primaryCardID: string,
  productCodeCore: string,
  accountType: 'DIN' | 'DEV',
  fromDate: Date,
  toDate: Date
): Promise<OtpTransaction[]> {
  const response = await fetchApi('DataService.svc/GetCardTurnover', {
    method: 'POST',
    body: {
      primaryCardID,
      productCodeCore,
      filterParam: {
        AccountType: accountType,
        FromDate: moment(fromDate).format('DD.MM.YYYY'),
        ToDate: moment(toDate).format('DD.MM.YYYY'),
        FromAmount: '',
        ToAmount: ''
      },
      gridName: 'RetailCardTurnoverPreviewMasterDetail-L'
    },
    headers: {
      Cookies: getCookies()
    },
    sanitizeResponseLog: { headers: { 'set-cookie': true } }
  })
  checkResponseAndSetCookies(response)
  return parseCardTurnover(response.body as string[][][][])
}

function resolveCardAccountType (currencyCodeNumeric?: string): 'DIN' | 'DEV' | null {
  if (currencyCodeNumeric === Currency.RSD) return 'DIN'
  if (currencyCodeNumeric === Currency.EUR) return 'DEV'
  return null
}

export async function fetchAuthorization ({ login, password }: Preferences): Promise<{ cookieHeader: string, login: string }> {
  await fetchLogin(login, password)
  return { cookieHeader: getCookies(), login: login.slice(3) }
}

export async function fetchAllAccounts (session: Session): Promise<OtpAccount[]> {
  return await fetchAccounts(session.login)
}

export async function fetchAllCards (session: Session): Promise<OtpCard[]> {
  return await fetchCards(session.login)
}

export async function fetchProductTransactions (session: Session, product: Product, accountCurrency: keyof typeof Currency, fromDate: Date, toDate: Date): Promise<OtpTransaction[]> {
  if (product.source === 'cardTurnover') {
    const accountType = product.accountType ?? resolveCardAccountType(product.currencyCodeNumeric)
    if (product.primaryCardId == null || product.productCodeCore == null || accountType == null) {
      return []
    }
    return await fetchCardTransactions(product.primaryCardId, product.productCodeCore, accountType, fromDate, toDate)
  }

  const accountNumber = product.accountNumber ?? product.id
  return await fetchAccountTransactions(accountNumber, getCurrencyCodeNumeric(accountCurrency), fromDate, toDate)
}
