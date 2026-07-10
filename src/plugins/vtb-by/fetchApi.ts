import { fetchJson } from '../../common/network'
import { RetryError, retry, toNodeCallbackArguments } from '../../common/retry'
import { TemporaryUnavailableError } from '../../errors'
import type * as T from './types/fetch'
import { BASE_API_URL, CLIENT_KIND, GEOLOCATION_PERMISSION_GRANTED, LOGIN_DEVICE_INFO } from './models'

const makeUrl = (path: string): string => `${BASE_API_URL}${path}`
const NETWORK_ERROR_PATTERN = /\[NER]|\[NTI]|ECONNRESET|ETIMEDOUT|socket hang up/i
const MAX_FETCH_ATTEMPTS = 3
const FETCH_RETRY_DELAY_MS = 1500
type FetchJsonResult = Awaited<ReturnType<typeof fetchJson>>
type FetchAttemptResult = [Error | null, FetchJsonResult | null]

const isFetchAttemptResult = (value: unknown): value is FetchAttemptResult => {
  if (!Array.isArray(value) || value.length !== 2) return false

  const [error, response] = value

  if (!(error == null || error instanceof Error)) return false
  if (response == null) return true
  if (typeof response !== 'object') return false

  return 'status' in response && 'body' in response
}

const fetchApi = async (path: string, body: unknown, sessionToken?: string): Promise<unknown> => {
  const headers: Record<string, string> = {
    Accept: 'application/json;charset=utf-8',
    'Content-Type': 'application/json;charset=UTF-8',
    clientKind: CLIENT_KIND
  }

  if (sessionToken != null) {
    headers.Authorization = sessionToken
    headers.session_token = sessionToken
  }

  let result: FetchAttemptResult

  try {
    const retryResult = await retry({
      getter: toNodeCallbackArguments(async () => await fetchJson(makeUrl(path), {
        method: 'POST',
        headers,
        body,
        sanitizeRequestLog: {
          headers: {
            Authorization: true,
            session_token: true
          },
          body: {
            login: true,
            password: true,
            geoLocation: true,
            geolocation: true,
            latitude: true,
            longitude: true
          }
        },
        sanitizeResponseLog: {
          body: {
            sessionToken: true
          }
        }
      })),
      predicate: (value) => isFetchAttemptResult(value) && value[0] == null && value[1] != null && value[1].status < 500,
      maxAttempts: MAX_FETCH_ATTEMPTS,
      delayMs: FETCH_RETRY_DELAY_MS
    })

    if (!isFetchAttemptResult(retryResult)) {
      throw new TemporaryUnavailableError()
    }

    result = retryResult
  } catch (error) {
    if (
      error instanceof RetryError ||
      (error instanceof Error && NETWORK_ERROR_PATTERN.test(error.message))
    ) {
      throw new TemporaryUnavailableError()
    }

    throw error
  }

  const [networkError, response] = result

  if (
    networkError != null ||
    response == null
  ) {
    throw new TemporaryUnavailableError()
  }

  const { status, body: responseBody } = response

  if (status !== 200) {
    throw new TemporaryUnavailableError()
  }

  return responseBody
}

export const fetchLogin = async ({ login, password, geoLocation }: T.AuthenticateInput): Promise<T.AuthenticateOutput> => {
  return await fetchApi('/services/v2/session/login', {
    ...LOGIN_DEVICE_INFO,
    geoLocation,
    geolocation: GEOLOCATION_PERMISSION_GRANTED,
    latitude: geoLocation.latitude,
    longitude: geoLocation.longitude,
    login,
    password
  }) as T.AuthenticateOutput
}

export const fetchAccountsOverview = async ({ sessionToken }: { sessionToken: string }): Promise<T.FetchAccountsOverviewOutput> => {
  return await fetchApi('/services/v2/products/getUserAccountsOverview', {
    concurrently: false,
    cardAccount: {},
    depositAccount: {},
    currentAccount: {},
    returnStatus: '1',
    stateFilter: 'ACTIVE_AND_CLOSED',
    corpoCardAccount: {},
    additionCardAccount: {},
    creditAccount: {}
  }, sessionToken) as T.FetchAccountsOverviewOutput
}

export const fetchCardAccountFullStatement = async ({ sessionToken, internalAccountId }: T.FetchCardAccountFullStatementInput): Promise<T.FetchCardAccountFullStatementOutput> => {
  return await fetchApi('/services/v2/products/getCardAccountFullStatement', {
    internalAccountId
  }, sessionToken) as T.FetchCardAccountFullStatementOutput
}

export const fetchMiniCardStatement = async ({ sessionToken, cardHash, from, till }: T.FetchMiniCardStatementInput): Promise<T.FetchMiniCardStatementOutput> => {
  return await fetchApi('/services/v2/card/getMiniCardStatement', {
    cardHash,
    from,
    till
  }, sessionToken) as T.FetchMiniCardStatementOutput
}

export const fetchDepositAccountStatement = async (
  { sessionToken, internalAccountId, from, till }: T.FetchDepositAccountStatementInput
): Promise<T.FetchDepositAccountStatementOutput> => {
  return await fetchApi('/services/v2/products/getDepositAccountStatement', {
    accountType: '0',
    internalAccountId,
    reportData: {
      from,
      till
    }
  }, sessionToken) as T.FetchDepositAccountStatementOutput
}
