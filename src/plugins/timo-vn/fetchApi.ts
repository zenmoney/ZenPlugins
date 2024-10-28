import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { getString } from '../../types/get'
import { InvalidLoginOrPasswordError } from '../../errors'
import { Preferences, Product, Session, Auth } from './models'
import { isArray } from 'lodash'
import { generateRandomString } from '../../common/utils'

const baseUrl = 'https://app2.timo.vn/'

async function fetchApi (url: string, options?: FetchOptions): Promise<FetchResponse> {
  return await fetchJson(baseUrl + url, options ?? {})
}

export async function fetchAuthorization ({ username, password}: Preferences, auth: Auth, passwordSha512: string): Promise<FetchResponse> {
  return await fetchApi('login',
    {
      method: 'POST',
      headers: {
        'X-Timo-Devicereg': auth.deviceReg
      },
      body: {
        username,
        'password': passwordSha512,
        'lang': 'en'
      }
    }
  )
}

export async function fetchSendOtp (auth: Auth, otpCode: string | null, token: string, refNo: string): Promise<FetchResponse> {
  return await fetchApi('login/commit',
    {
      method: 'POST',
      headers: {
        'Token': token,
        'X-Timo-Devicereg': auth.deviceReg
      },
      body: {
        'lang': 'en',
        'otp': otpCode,
        'refNo': refNo,
        'securityChallenge': otpCode,
        'securityCode': otpCode
      }
    }
  )
}

export async function fetchAllAccounts (session: Session): Promise<unknown[]> {
  const response = await fetchApi('user/accountPreview',
    {
      method: 'GET',
      headers: {
        'Token': session.token,
        'X-Timo-Devicekey': session.auth.deviceReg
      }
    }
  )

  assert(isArray(response.body.data.accounts), 'cant get accounts array', response)
  return response.body.data.accounts
}

export async function fetchProductTransactions ({ id, accountType }: Product, session: Session, fromDate: Date, toDate: Date): Promise<unknown[]> {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }
  const response = await fetchApi(`user/account/transaction/list`,
    {
      method: 'POST',
      headers: {
        'Token': session.token,
        'X-Timo-Devicekey': session.auth.deviceReg
      },
      body: {
        'accountNo': id,
        'accountType': accountType,
        'fromDate': fromDate.toLocaleDateString('en-GB', options),
        'toDate': toDate.toLocaleDateString('en-GB', options)
      }
    }
  )

  //assert(isArray(response.body.data.items), 'cant get transactions array', response)
  return response.body.data.items
}
