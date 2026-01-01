import { BASE_API_URL } from './models'
import { fetchJson } from '../../common/network'
import type * as T from './types/fetch'
import { FetchError, FetchOutput } from './types/base'
import { isNonEmptyString } from './helpers'

const makeUrl = (domain: 'auth' | 'core', url: string): string =>
  `${BASE_API_URL}/${domain}/services/v3${url}`

/**
 * Login using a new deviceId created a device listed in the user's account
 * Device name is usually `{platform} {browser}`
 * **/
export const fetchLogin = async ({ login, password, deviceId }: T.AuthenticateInput): Promise<FetchOutput<T.AuthenticateOutput>> => {
  const { status, body } = await fetchJson(makeUrl('auth', '/authentication/login'), {
    method: 'POST',
    body: {
      login,
      password,
      deviceUDID: deviceId,
      clientKind: 'WEB',
      appID: '1.27',
      browser: 'Chrome',
      browserVersion: '141.0.0.0',
      platform: `${ZenMoney.device.manufacturer} ${ZenMoney.device.model}`,
      platformVersion: ZenMoney.device.os.version
    }
  })

  if (status === 200) {
    return { status, data: body as T.AuthenticateOutput, error: null }
  } else {
    return { status, data: null, error: body as FetchError }
  }
}

export const fetchAccounts = async ({ sessionToken }: T.FetchAccountsInput): Promise<FetchOutput<T.FetchAccountsOutput>> => {
  const { status, body } = await fetchJson(makeUrl('core', '/product/get-products?getCreditDetail=false'), {
    headers: {
      Authorization: `Bearer ${sessionToken}`
    }
  })

  if (status === 200) {
    return { status, data: body as T.FetchAccountsOutput, error: null }
  } else {
    return { status, data: null, error: body as FetchError }
  }
}

export const fetchTransactions = async ({ sessionToken, from, to, account }: T.FetchTransactionsInput): Promise<FetchOutput<T.FetchTransactionsOutput>> => {
  const { status, body } = await fetchJson(makeUrl('core', '/operation/history/get-operations-history'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionToken}`
    },
    body: {
      dateFrom: from,
      dateTo: to,
      ...(isNonEmptyString(account) && { contractNumber: account })
    }
  })

  if (status === 200) {
    return { status, data: body as T.FetchTransactionsOutput, error: null }
  } else {
    return { status, data: null, error: body as FetchError }
  }
}
