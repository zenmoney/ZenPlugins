import { FetchResponse, fetch } from '../../common/network'
import setCookie from 'set-cookie-parser'
import { InvalidLoginOrPasswordError } from '../../errors'
import { AccountDetails, Preferences } from './models'

const baseUrl = 'https://hb.posted.co.rs/posted/en/'

function readCookies (): string {
  const cookies = ZenMoney.getData('cookies', {}) as Record<string, unknown>
  let cookiesString = ''
  for (const name in cookies) {
    const value = cookies[name]
    if (cookiesString.length > 0) {
      cookiesString += '; '
    }
    cookiesString += `${name}=${value}`
  }
  return cookiesString
}

function updateCookies (setCookieString: string): void {
  const cookiesObj = ZenMoney.getData('cookies', {}) as Record<string, unknown>
  const setCookies = setCookie.parse(setCookie.splitCookiesString(setCookieString))
  for (const cookie of setCookies) {
    cookiesObj[cookie.name] = cookie.value
  }
  ZenMoney.setData('cookies', cookiesObj)
  ZenMoney.saveData()
}

async function fetchUrl (url: string, options: Record<string, unknown>): Promise<FetchResponse> {
  const cookies = readCookies()
  const response = await fetch(baseUrl + url, {
    ...options,
    ...{
      sanitizeResponseLog: { headers: { 'set-cookie': true } },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Cookie: cookies
      }
    }
  }) as FetchResponse & { headers: Record<string, string> }

  if ('set-cookie' in response.headers) {
    updateCookies(response.headers['set-cookie'])
  }

  return response
}

export async function fetchAuthorization ({ login, password }: Preferences): Promise<void> {
  const response = await fetchUrl('index.jsp', {
    method: 'POST',
    body: `korisnik=${login}&lozinka=${password}`
  }) as FetchResponse & { headers: Record<string, string> }

  if ('set-cookie' in response.headers) {
    updateCookies(response.headers['set-cookie'])
  }
  if ((response.body as string).includes('<div class=error>')) {
    throw new InvalidLoginOrPasswordError()
  }
}

export async function fetchAllAccounts (): Promise<AccountDetails[]> {
  const response = await fetchUrl('fracld.jsp?NF=1356', {
    method: 'POST'
  })

  const string = response.body as string
  const regexp = /(\d\d\d\d\d)\s+(\d\d\d\d\d\d\d\d\d)(\d)/g

  const matches = string.matchAll(regexp)

  const accounts: AccountDetails[] = []
  for (const match of matches) {
    const [, , accountId, accountType] = match
    accounts.push({
      id: Number(accountId),
      type: Number(accountType)
    })
  }

  return accounts
}

export async function fetchAccountData (account: AccountDetails): Promise<string> {
  const response = await fetchUrl('racsta.jsp', {
    method: 'POST',
    body: `RACUNPSTIP=${account.type}&racun=${account.id}`
  })

  return response.body as string
}
