import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { getString } from '../../types/get'
import { InvalidLoginOrPasswordError } from '../../errors'
import { Preferences, Product, Session } from './models'
import { isArray } from 'lodash'
import { getCookies, setCookies } from '../yettelbank-rs/helpers'
import { checkResponseAndSetCookies } from './helpers'
import { parseAccounts } from './converters'

const baseUrl = 'https://ebank.otpbanka.rs/RetailV4/Protected/Services/'

async function fetchApi (url: string, options?: FetchOptions): Promise<FetchResponse> {
  return await fetchJson(baseUrl + url, options ?? {})
}

async function fetchLogin (username: string, otp: string) {
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
  checkResponseAndSetCookies(response)
}



async function fetchAccounts(login: string) {
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
    
    checkResponseAndSetCookies(response)
    return parseAccounts(response.body as string[][])
}

export async function fetchAuthorization ({ login, password }: Preferences): Promise<{cookieHeader: string, login: string}> {
  await fetchLogin(login, password)
  return { cookieHeader: getCookies(), login: login.slice(3) }
}

export async function fetchAllAccounts (session: Session): Promise<unknown[]> {
  return await fetchAccounts(session.login)
}

export async function fetchProductTransactions ({ id, transactionNode }: Product, session: Session): Promise<unknown[]> {
  const response = await fetchApi(`transactions_${transactionNode}${id}.json`)

  assert(isArray(response.body), 'cant get transactions array', response)
  return response.body
}
