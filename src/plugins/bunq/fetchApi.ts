import { fetch, FetchOptions, FetchResponse, ParseError } from '../../common/network'
import { BankMessageError, TemporaryUnavailableError } from '../../errors'
import {
  ApiError,
  ApiListResponse,
  ApiResponse,
  BunqAccountResponse,
  BunqPaymentListResponse,
  BunqInstallationResponse,
  BunqSessionResponse
} from './models'
import { isNumber, isObject } from 'lodash'
import { APP_VERSION, OS_VERSION } from '../tbc-ge/models'
import { signObject } from './utils'

const baseUrl = 'https://api.bunq.com/v1/'

async function fetchApi (url: string, options: FetchOptions): Promise<FetchResponse> {
  let response: FetchResponse
  if (!options.sanitizeRequestLog) {
    options.sanitizeRequestLog = {}
  }

  const headers: object = isObject(options.headers) ? options.headers : {}
  options.headers = {
    ...headers,
    'User-Agent': `Zenmoney Bunq Plugin a${APP_VERSION} (Android; Android ${OS_VERSION}; ANDROID_PHONE)`,
    'Content-Type': 'application/json; charset=UTF-8',
    'Cache-Control': 'no-cache'
  }

  options.stringify = JSON.stringify
  options.parse = JSON.parse

  try {
    response = await fetch(baseUrl + url, options)
  } catch (e) {
    if (e instanceof ParseError && e.response.status === 502) {
      throw new TemporaryUnavailableError()
    }
    throw e
  }
  return response
}

export async function fetchApiInstallation (publicKey: string): Promise<ApiResponse<BunqInstallationResponse>> {
  const body = { client_public_key: publicKey }
  const method = 'POST'

  const response = await fetchApi('installation', { method, body })

  throwIsNotSuccess(response)

  return response.body as ApiResponse<BunqInstallationResponse>
}

export async function fetchDeviceSet (installationToken: string, userApiKey: string): Promise<void> {
  const body = {
    description: 'Zenmoney sync plugin',
    secret: userApiKey,
    permitted_ips: ['*']
  }
  const method = 'POST'
  const headers = {
    'X-Bunq-Client-Authentication': installationToken
  }

  const response = await fetchApi('device-server', { method, body, headers })

  throwIsNotSuccess(response)
}

export async function fetchSessionStart (installationToken: string, clientPrivateKey: string, userApiKey: string): Promise<ApiResponse<BunqSessionResponse>> {
  const body = {
    secret: userApiKey
  }
  const method = 'POST'
  const signature: string = await signObject(body, clientPrivateKey)
  const headers = {
    'X-Bunq-Client-Signature': signature,
    'X-Bunq-Client-Authentication': installationToken
  }

  const response = await fetchApi('session-server', { method, body, headers })

  throwIsNotSuccess(response)

  return response.body as ApiResponse<BunqSessionResponse>
}

export async function fetchMonetaryAccountList (userId: number, sessionToken: string, olderId?: number): Promise<ApiListResponse<BunqAccountResponse>> {
  const method = 'GET'
  const headers = {
    'X-Bunq-Client-Authentication': sessionToken
  }

  const response = await fetchApi(`user/${userId}/monetary-account${isNumber(olderId) ? `?older_id=${olderId}` : ''}`, { method, headers })

  throwIsNotSuccess(response)

  return response.body as ApiListResponse<BunqAccountResponse>
}

export async function fetchPayments (userId: number, monetaryId: number, sessionToken: string, olderId?: number): Promise<ApiListResponse<BunqPaymentListResponse>> {
  const method = 'GET'
  const headers = {
    'X-Bunq-Client-Authentication': sessionToken
  }

  const response = await fetchApi(`user/${userId}/monetary-account/${monetaryId}/payment/${isNumber(olderId) ? `?older_id=${olderId}` : ''}`, { method, headers })

  throwIsNotSuccess(response)

  return response.body as ApiListResponse<BunqPaymentListResponse>
}

function throwIsNotSuccess (response: FetchResponse): void {
  if (response.status !== 200) {
    const error = response.body as ApiError

    const errMessage = error?.Error[0]?.error_description_translated ?? 'Unknown error'
    throw new BankMessageError(errMessage)
  }
}
