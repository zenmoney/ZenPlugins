import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { OtpTransaction, Preferences, Session, OtpAccount, OtpCard, Product } from './models'
import { getCookies } from '../yettelbank-rs/helpers'
import { checkResponseAndSetCookies, Currency, getCurrencyCodeNumeric } from './helpers'
import { parseAccounts, parseCardTurnover, parseCards, parseDepositTurnover, parseTransactions } from './parsers'
import { getOptString } from '../../types/get'
import moment from 'moment'

const baseUrl = 'https://ebank.otpbanka.rs/RetailV4/Protected/Services/'

async function fetchApi (url: string, options?: FetchOptions): Promise<FetchResponse> {
  return await fetchJson(baseUrl + url, {
    parse: body => {
      console.assert(typeof body === 'string', 'OTP Bank response must be JSON text')
      return JSON.parse((body).replace(/^\uFEFF/, '')) as unknown
    },
    sanitizeRequestLog: {
      headers: { Cookie: true, Cookies: true, Authorization: true },
      body: { username: true, otp: true, sid: true, sessionID: true }
    },
    ...options
  })
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
    sanitizeResponseLog: {
      headers: { 'set-cookie': true },
      body: {
        Address: true,
        Street: true,
        StreetNumber: true,
        Locality: true,
        PhoneNumber: true,
        MobileNumber: true,
        CorePhoneNumber: true,
        BirthDate: true,
        Username: true,
        Email: true,
        FirstName: true,
        LastName: true,
        Name: true,
        FullName: true,
        SocialIdentityNumber: true,
        Ticket: true,
        RequestToken: true,
        IdToken: true,
        SessionID: true,
        SessionGuid: true,
        GeneratedSessionID: true,
        SMSSessionID: true,
        HolosSessionID: true,
        SecurityComponent: true,
        EncryptedSecurityUserID: true,
        HistoryPins: true
      }
    }
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

async function fetchAccountTransactions (product: Product, currencyCode: string, fromDate: Date, toDate: Date): Promise<OtpTransaction[]> {
  if (toDate === null) toDate = new Date()
  const isDeposit = product.source === 'depositTurnover'
  console.assert(product.productCodeCore != null && product.productCodeCore !== '', 'Missing OTP account product code')
  const endpoint = isDeposit ? 'GetTimeDepositAccountTurnoverOTPV4' : 'GetTransactionalAccountTurnover'
  const response = await fetchApi(`DataService.svc/${endpoint}`, {
    method: 'POST',
    body: {
      accountNumber: product.accountNumber ?? product.id,
      productCoreID: product.productCodeCore,
      filterParam: {
        CurrencyCodeNumeric: currencyCode,
        FromDate: moment(fromDate).format('DD.MM.YYYY'),
        ToDate: moment(toDate).format('DD.MM.YYYY'),
        ItemType: '',
        ItemCount: '',
        FromAmount: 0,
        ToAmount: 0,
        Description: ''
      },
      gridName: isDeposit
        ? 'RetailAccountTurnoverTimeDepositDomesticPreviewMasterDetail-L'
        : 'RetailAccountTurnoverTransactionPreviewMasterDetail-L'
    },
    headers: {
      Cookies: getCookies()
    },
    sanitizeResponseLog: { headers: { 'set-cookie': true } }
  })
  console.assert(response.status === 200, 'OTP account history request failed', {
    endpoint,
    status: response.status,
    errorCode: getOptString(response.body, 'ErrorCode')
  })
  checkResponseAndSetCookies(response)

  if (isDeposit) {
    return parseDepositTurnover(response.body)
  }

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

  return await fetchAccountTransactions(product, product.currencyCodeNumeric ?? getCurrencyCodeNumeric(accountCurrency), fromDate, toDate)
}
