import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { getString } from '../../types/get'
import { InvalidLoginOrPasswordError } from '../../errors'
import { Preferences, Product, Session } from './models'
import { isArray } from 'lodash'
import { getCookies, setCookies } from '../yettelbank-rs/helpers'

const baseUrl = 'https://ebank.otpbanka.rs/RetailV4/Protected/Services/'

async function fetchApi (url: string, options?: FetchOptions): Promise<FetchResponse> {
  return await fetchJson(baseUrl + url, options ?? {})
}

async function fetchLogin (url: string, username: string, otp: string) {
  const response = await fetchApi(url, {
    method: 'POST',
    body: {
      'username': username,
      'otp': otp,
      'appType': 'AUTH_1',
      "sessionID": 1
    },
    sanitizeResponseLog: { headers: { 'set-cookie': true } }
  })
  setCookies(response)
}



async function fetchAccounts(url: string, username: string) {
  const response = await fetchApi(url, 
    {
      method: 'POST',
      headers: {
        Cookies: getCookies()
      }
    }

  )
}

export async function fetchAuthorization ({ login, password }: Preferences): Promise<{cookieHeader: string, login: string}> {
  await fetchLogin("RetailLoginService.svc/LoginUO", login, password)
  return { cookieHeader: getCookies(), login: login.slice(3) }
}

export async function fetchAllAccounts (session: Session): Promise<unknown[]> {
  const resp = await fetchApi('accounts.json')
  assert(isArray(resp.body), 'cant get accounts array', resp)
  return resp.body
  //return await fetchAccounts("DataService.svc/GetAllAccountBalance", session.login)
}

export async function fetchProductTransactions ({ id, transactionNode }: Product, session: Session): Promise<unknown[]> {
  const response = await fetchApi(`transactions_${transactionNode}${id}.json`)

  assert(isArray(response.body), 'cant get transactions array', response)
  return response.body
}
