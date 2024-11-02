import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { getArray } from '../../types/get'
import { Auth, Preferences, Product, Session } from './models'

const baseUrl = 'https://app2.timo.vn/'

async function fetchApi (url: string, options?: FetchOptions): Promise<FetchResponse> {
  return await fetchJson(baseUrl + url, options ?? {})
}

export async function fetchAuthorization ({ username, password }: Preferences, auth: Auth, passwordSha512: string): Promise<FetchResponse> {
  return await fetchApi('login',
    {
      method: 'POST',
      headers: {
        'X-Timo-Devicereg': auth.deviceReg
      },
      body: {
        username,
        password: passwordSha512,
        lang: 'en'
      }
    }
  )
}

export async function fetchSendOtp (auth: Auth, otpCode: string | null, token: string, refNo: string): Promise<FetchResponse> {
  return await fetchApi('login/commit',
    {
      method: 'POST',
      headers: {
        Token: token,
        'X-Timo-Devicereg': auth.deviceReg
      },
      body: {
        lang: 'en',
        otp: otpCode,
        refNo,
        securityChallenge: otpCode,
        securityCode: otpCode
      }
    }
  )
}

export async function fetchAllAccounts (session: Session): Promise<unknown[]> {
  const response = await fetchApi('user/accountPreview',
    {
      method: 'GET',
      headers: {
        Token: session.token,
        'X-Timo-Devicekey': session.auth.deviceReg
      }
    }
  )
  return getArray(response.body, 'data.accounts')
}

export async function fetchProductTransactions ({ id, accountType }: Product, session: Session, fromDate: Date, toDate: Date): Promise<unknown[]> {
  const response = await fetchApi('user/account/transaction/list',
    {
      method: 'POST',
      headers: {
        Token: session.token,
        'X-Timo-Devicekey': session.auth.deviceReg
      },
      body: {
        accountNo: id,
        accountType,
        fromDate: formatDate(fromDate),
        toDate: formatDate(toDate)
      }
    }
  )
  return getArray(response.body, 'data.items')
}

function formatDate (date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}/${month}/${year}`
}
