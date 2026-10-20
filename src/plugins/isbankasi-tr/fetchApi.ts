import { parse as parseCookieString, splitCookiesString } from 'set-cookie-parser'

import { fetch as fetchNetwork, FetchFunc, FetchResponse } from '../../common/network'
import { generateUUID } from '../../common/utils'
import { InvalidLoginOrPasswordError, InvalidOtpCodeError } from '../../errors'
import get, { getOptString, getString } from '../../types/get'
import { createOAuthHeader } from './oauth'
import { AuthSession, CookieStore, DeviceIdentity, StoredAuthRejectedError } from './types'

const MCM_BASE_URL = 'https://mobil.isbank.com.tr/ClientGateway/'
const IAM_BASE_URL = 'https://smobil.isbank.com.tr/auth/'
const APP_VERSION = '10.12.1'
const WRONG_PASSWORD_CODES = new Set(['SY01', 'SY02', 'SY03', 'SY04'])
const WRONG_OTP_CODES = new Set(['AST02'])
const COOKIE_NAMES: Array<keyof CookieStore> = ['JSESSIONID', 'osc', 'f5osc', 'softtechSessionId']
const MCM_VIEW_LABELS: Record<McmPhase, string> = {
  startup: 'LandingFragment',
  password: 'AuthenticationLoginFirstFactorFragment',
  otp: 'AuthenticationLoginMobileApprovalFragment',
  data: ''
}

const REQUEST_LOG_MASK = {
  headers: {
    Authorization: true,
    'Proxy-Authorization': true,
    Cookie: true,
    'X-Device-Token': true
  },
  body: {
    password: true,
    citizenID: true,
    customerNumber: true,
    corporateCustomerNumber: true,
    RandNo: true,
    refresh_token: true,
    mfaToken: true,
    deviceMatchInfo: {
      iMEINumber: true,
      mobileApprovalCode: true,
      challengeResponse: true
    }
  }
}

const RESPONSE_LOG_MASK = {
  headers: {
    'set-cookie': true
  },
  body: {
    authorization: true,
    access_token: true,
    refresh_token: true,
    session_state: true,
    RandNo: true,
    randNo: true,
    loginInfo: {
      customer: true
    }
  }
}

export type McmPhase = 'startup' | 'password' | 'otp' | 'data'

interface McmRequestOptions {
  clearCookies?: boolean
  disableResponseCookie?: boolean
  updateRandNo?: boolean
}

export interface FetchApiState {
  randNo?: string
  cookies: CookieStore
}

export interface RefreshedTokens {
  accessToken: string
  refreshToken: string
}

export class IsBankFetchApi {
  private readonly fetch: FetchFunc
  private readonly identity: DeviceIdentity
  private randNo?: string
  private readonly cookies: CookieStore

  constructor (options: {
    identity: DeviceIdentity
    fetch?: FetchFunc
    session?: AuthSession
  }) {
    this.identity = options.identity
    this.fetch = options.fetch ?? fetchNetwork
    this.randNo = options.session?.randNo
    this.cookies = { ...(options.session?.cookies ?? {}) }
  }

  async requestMcm (
    path: string,
    body: Record<string, unknown>,
    phase: McmPhase,
    accessToken?: string,
    options: McmRequestOptions = {}
  ): Promise<unknown> {
    if (options.clearCookies === true) this.clearCookies()
    const url = `${MCM_BASE_URL}${path}`
    const requestBody = {
      ...body,
      Coordinates: {
        Latitude: '0.0',
        Longitude: '0.0'
      },
      DeviceNumber: this.identity.deviceId,
      ...(this.randNo !== undefined ? { RandNo: this.randNo } : {}),
      Tuid: generateUUID().toUpperCase()
    }
    const headers: Record<string, string> = {
      'Accept-Language': 'tr-TR',
      Connection: 'Keep-Alive',
      'Proxy-Connection': 'Keep-Alive',
      'Content-Type': 'application/json; charset=UTF-8',
      'User-Agent': this.userAgent,
      Authorization: createOAuthHeader(url),
      'diag-fc': createDiagnosticHeader(path, phase),
      'diag-nc': createDiagnosticHeader(path, phase),
      'diag-ch': 'IsCep'
    }
    if (options.disableResponseCookie === true) headers['Clear-Site-Data'] = 'cookie'
    const cookieHeader = this.getCookieHeader()
    if (cookieHeader !== '') headers.Cookie = cookieHeader
    if (accessToken !== undefined) headers['Proxy-Authorization'] = `Bearer ${accessToken}`

    const response = await this.fetch(url, {
      method: 'POST',
      headers,
      body: omitNullValues(requestBody),
      stringify: JSON.stringify,
      parse: parseJson,
      sanitizeRequestLog: REQUEST_LOG_MASK,
      sanitizeResponseLog: RESPONSE_LOG_MASK
    })
    this.updateCookies(response)
    console.assert(response.status >= 200 && response.status < 300, 'Unexpected İşCep MCM HTTP response', {
      path,
      status: response.status
    })
    if (options.updateRandNo !== false) {
      const nextRandNo = getOptString(response.body, 'RandNo')
      if (nextRandNo !== undefined) this.randNo = nextRandNo
    }
    this.validateMcmBody(response.body, path, phase)
    return response.body
  }

  async refreshToken (refreshToken: string): Promise<RefreshedTokens> {
    const url = `${IAM_BASE_URL}realms/main/protocol/openid-connect/token`
    const formBody = `grant_type=refresh_token&client_id=iscep-individual&refresh_token=${encodeURIComponent(refreshToken)}`
    const response = await this.fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': this.userAgent,
        'Accept-Language': 'tr-TR',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'x-tuid': generateUUID().toLowerCase()
      },
      body: formBody,
      parse: parseJson,
      sanitizeRequestLog: {
        ...REQUEST_LOG_MASK,
        body: true
      },
      sanitizeResponseLog: RESPONSE_LOG_MASK
    })

    if (response.status < 200 || response.status >= 300) {
      const code = getOptString(response.body, 'error')
      if (code === 'invalid_grant') {
        throw new StoredAuthRejectedError({ status: response.status, code })
      }
      console.assert(false, 'Unexpected İşCep refresh-token response', {
        status: response.status,
        code
      })
    }

    return {
      accessToken: getString(response.body, 'access_token'),
      refreshToken: getString(response.body, 'refresh_token')
    }
  }

  getState (): FetchApiState {
    return {
      ...(this.randNo !== undefined ? { randNo: this.randNo } : {}),
      cookies: { ...this.cookies }
    }
  }

  private get userAgent (): string {
    return `IsCep/${APP_VERSION} (${this.identity.manufacturer}/${this.identity.model}; Android/${this.identity.osVersion}; Scale/xxhdpi; MobileServices/FCM)`
  }

  private validateMcmBody (body: unknown, path: string, phase: McmPhase): void {
    const error = get(body, 'Error')
    if (error === undefined || error === null) return
    const code = getOptString(error, 'ErrorCode') ?? getOptString(error, 'Code')
    if (phase === 'password' && code !== undefined && WRONG_PASSWORD_CODES.has(code)) {
      throw new InvalidLoginOrPasswordError()
    }
    if (phase === 'otp' && code !== undefined && WRONG_OTP_CODES.has(code)) {
      throw new InvalidOtpCodeError()
    }
    console.assert(false, 'Unexpected İşCep MCM error', {
      path,
      category: getOptString(error, 'Category'),
      code,
      technicalCode: getOptString(error, 'Code')
    })
  }

  private updateCookies (response: FetchResponse): void {
    const header = getOptString(response.headers, 'set-cookie')
    if (header === undefined) return
    for (const cookie of parseCookieString(splitCookiesString(header), { decodeValues: false })) {
      if (COOKIE_NAMES.includes(cookie.name as keyof CookieStore)) {
        this.cookies[cookie.name as keyof CookieStore] = cookie.value
      }
    }
  }

  private getCookieHeader (): string {
    return COOKIE_NAMES
      .filter(name => this.cookies[name] !== undefined)
      .map(name => `${name}=${this.cookies[name] as string}`)
      .join('; ')
  }

  private clearCookies (): void {
    this.cookies.JSESSIONID = undefined
    this.cookies.osc = undefined
    this.cookies.f5osc = undefined
    this.cookies.softtechSessionId = undefined
  }
}

function parseJson (value: string): unknown {
  return JSON.parse(value) as unknown
}

function createDiagnosticHeader (path: string, phase: McmPhase): string {
  return `ACI76390.${MCM_VIEW_LABELS[phase]}./ClientGateway/${path}`
}

function omitNullValues (value: unknown): unknown {
  if (Array.isArray(value)) return value.map(omitNullValues)
  if (value === null || typeof value !== 'object') return value
  const result: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value)) {
    if (item !== null && item !== undefined) result[key] = omitNullValues(item)
  }
  return result
}
