import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { OtpTransaction, Preferences, Session } from './models'
import { getCookies } from '../yettelbank-rs/helpers'
import { checkResponseAndSetCookies, Currency, getCurrencyCodeNumeric } from './helpers'
import { parseAccounts, parseTransactions } from './parsers'
import { OtpAccount } from './models'

const baseUrl = 'https://ebank.otpbanka.rs/RetailV4/Protected/Services/'

async function fetchApi (url: string, options?: FetchOptions): Promise<FetchResponse> {
  return await fetchJson(baseUrl + url, options ?? {})
}

async function fetchLogin (username: string, otp: string) {
  // otp = '2128506'
  const response = await fetchApi("RetailLoginService.svc/LoginUO", {
    method: 'POST',
    body: {
      'username': username,
      'otp': otp,
      'appType': 'AUTH_1',
      "sessionID": 1
    },
    sanitizeResponseLog: { headers: { 'set-cookie': true } }
  })
  console.log("Login response: ", response.body)
  checkResponseAndSetCookies(response)
}

async function fetchAccounts(login: string):  Promise<OtpAccount[]> {
  const response = await fetchApi("DataService.svc/GetAllAccountBalance", 
    {
      method: 'POST',
      body: {
          "sid": login,
          "gridName": "RetailAccountBalancePreviewFlat-L"
      },
      headers: {
        Cookies: getCookies()
      },
      sanitizeResponseLog: { headers: { 'set-cookie': true } }
    })
    console.log("Accounts response: ", response.body)
    checkResponseAndSetCookies(response)
    return parseAccounts(response.body as string[][])
}

async function fetchTransactions(accountNumber: string, currencyCode: string): Promise<OtpTransaction[]> {
  const response = await fetchApi("DataService.svc/GetTransactionalAccountTurnover", 
    {
      method: 'POST',
      body: {
        "accountNumber": accountNumber,
        "productCoreID": "1",
        "filterParam": {
            "CurrencyCodeNumeric": currencyCode,
            "FromDate": "17.11.2024", // todo get fetching period from preferences
            "ToDate": "17.12.2024",
            "ItemType": "",
            "ItemCount": "",
            "FromAmount": 0,
            "ToAmount": 0
        },
        "gridName": "RetailAccountTurnoverTransactionPreviewMasterDetail-L"
    },
      headers: {
        Cookies: getCookies()
      },
      sanitizeResponseLog: { headers: { 'set-cookie': true } }
    })
    checkResponseAndSetCookies(response)
    
    const responseBody: string[][][][] = response.body as string[][][][]
    console.log("Transactions response: ", responseBody)
    return parseTransactions(responseBody[0][1])
}

export async function fetchAuthorization ({ login, password }: Preferences): Promise<{cookieHeader: string, login: string}> {
  await fetchLogin(login, password)
  return { cookieHeader: getCookies(), login: login.slice(3) }
}

export async function fetchAllAccounts (session: Session): Promise<OtpAccount[]> {
  return await fetchAccounts(session.login)
}

export async function fetchProductTransactions (session: Session, accountNumber: string, currency: keyof typeof Currency, fromDate: Date, toDate: Date): Promise<OtpTransaction[]> {
  return await fetchTransactions(accountNumber, getCurrencyCodeNumeric(currency))
}
