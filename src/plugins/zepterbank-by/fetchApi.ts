import { BASE_API_URL } from './models'
import { fetchJson } from '../../common/network'
import type * as T from './types/fetch.types'
import { FetchError, FetchOutput } from './types/base.types'

const makeUrl = (url: string): string => `${BASE_API_URL}/${url}`

export const fetchLogin = async ({ login, password }: T.AuthenticateInput): Promise<FetchOutput<T.AuthenticateOutput>> => {
  const { status, body } = await fetchJson(makeUrl('/users/auth/login'), {
    method: 'POST',
    body: {
      login,
      password,
      appVersion: '1',
      browser: 'Chrome',
      browserVersion: '144.0.0.0',
      deviceModel: 'Chrome',
      deviceUid: '144.0.0.0',
      osType: `${ZenMoney.device.manufacturer} ${ZenMoney.device.model}`,
      osVersion: ZenMoney.device.os.version
    }
  })

  if (status === 200) {
    return { status, data: body as T.AuthenticateOutput, error: null }
  } else {
    return { status, data: null, error: body as FetchError }
  }
}

export const fetchAccounts = async ({ sessionToken }: T.FetchAccountsInput): Promise<FetchOutput<T.FetchAccountsOutput>> => {
  const { status, body } = await fetchJson(makeUrl('/products?refresh=true'), {
    headers: {
      Authorization: sessionToken
    }
  })

  if (status === 200) {
    return { status, data: body as T.FetchAccountsOutput, error: null }
  } else {
    return { status, data: null, error: body as FetchError }
  }
}

export const fetchCardTransactions = async ({ sessionToken, from, to, cardId }: T.FetchTransactionsInput): Promise<FetchOutput<T.FetchTransactionsOutput>> => {
  const { status, body } = await fetchJson(makeUrl('/cards/history'), {
    method: 'POST',
    headers: {
      Authorization: sessionToken
    },
    body: {
      dateFrom: from,
      dateTo: to,
      historyType: 'ALL',
      productId: cardId,
      size: 10 // bigger?
    }
  })

  if (status === 200) {
    return { status, data: body as T.FetchTransactionsOutput, error: null }
  } else {
    return { status, data: null, error: body as FetchError }
  }
}

export const fetchProductStatement = async ({ sessionToken, from, to, productId }: T.FetchProductStatementInput): Promise<FetchOutput<T.FetchProductStatementOutput>> => {
  const { status, body } = await fetchJson(makeUrl('/products/statement'), {
    method: 'POST',
    headers: {
      Authorization: sessionToken
    },
    body: {
      startDate: from,
      endDate: to,
      productId
    }
  })

  if (status === 200) {
    return { status, data: body as T.FetchProductStatementOutput, error: null }
  } else {
    return { status, data: null, error: body as FetchError }
  }
}
