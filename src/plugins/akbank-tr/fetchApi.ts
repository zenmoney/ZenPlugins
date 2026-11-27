import { fetch as fetchNetwork, FetchFunc } from '../../common/network'
import { getOptArray, getOptBoolean, getOptString } from '../../types/get'
import { createCrystalHeader } from './crypto'
import { AuthSession, DeviceIdentity } from './types'

export const APP_VERSION = '4.72.0'
const BASE_URL = 'https://akbankmobil.akbank.com.tr/EntryPointServiceNative/'
const ENTRY_POINT_URL = `${BASE_URL}EntryPointService/EntryPointJson`

const REQUEST_LOG_MASK = {
  headers: {
    Authorization: true,
    Cookie: true,
    DeviceID: true,
    'X-Akbank-Session-Id': true,
    crystalKyberEncryptionKey: true
  },
  body: {
    input: true,
    tokenSessionId: true,
    igsEnc: true,
    captchaEnc: true,
    kullAdiEnc: true,
    mbb: true,
    tckn: true,
    clientUID: true,
    deviceOs: true,
    imei: true,
    androidUID: true,
    otpEnc: true,
    softOtpEnc: true,
    hardOtpEnc: true,
    clientDeviceID: true,
    smartPhoneDeviceClientID: true,
    clientDeviceIDWithTimeStamp: true
  }
}

const RESPONSE_LOG_MASK = {
  headers: {
    'set-cookie': true,
    Authorization: true
  },
  body: sanitizeResponseBody
}

const SENSITIVE_RESPONSE_KEYS = new Set([
  'entrypointjsonresult',
  'accesstoken',
  'access_token',
  'activationtoken',
  'tokensessionid',
  'code',
  'deviceclientid',
  'adsoyad',
  'tckn',
  'vkn',
  'sifretel',
  'formattedsifretel',
  'gsmnolistesi',
  'email',
  'fullname',
  'cardownername',
  'maskfullname',
  'cardno',
  'digitalcardno',
  'cvenc',
  'kartsahibi',
  'groupadsoyad',
  'phonenumber',
  'securitypics',
  'securityimage'
])

export interface RequestOptions {
  crystalHeader?: boolean
  emptyLoginHeader?: boolean
  igsEnc?: string | null
}

export class AkbankFetchApi {
  private readonly identity: DeviceIdentity
  private readonly fetch: FetchFunc
  private tokenSessionId?: string

  constructor (options: {
    identity: DeviceIdentity
    fetch?: FetchFunc
    session?: AuthSession
  }) {
    this.identity = options.identity
    this.fetch = options.fetch ?? fetchNetwork
    this.tokenSessionId = options.session?.tokenSessionId
  }

  async request (
    path: string,
    fields: Record<string, unknown>,
    options: RequestOptions = {}
  ): Promise<unknown> {
    const request = {
      deviceTimestamp: String(Date.now()),
      igsEnc: options.igsEnc ?? null,
      isScreenMirroring: false,
      secureServerFingerprint: null,
      CallbackFunctionId: null,
      confirmationType: null,
      coordinates: null,
      isBusy: false,
      isNativeFlag: 'true',
      language: 'TR',
      NextTransactionUrl: path,
      tokenSessionId: this.tokenSessionId ?? null,
      ...fields,
      input: null
    }
    const innerRequest = JSON.stringify(request)
    const body = { ...request, input: innerRequest }
    const headers: Record<string, string> = {
      Accept: '*/*',
      'Accept-Encoding': 'gzip',
      'Accept-Language': 'TR',
      'Content-Type': 'application/json',
      AppVersion: APP_VERSION,
      DeviceID: this.identity.clientUid,
      DeviceModel: this.identity.model,
      OS: 'Android',
      OSVersion: '15'
    }
    if (this.tokenSessionId !== undefined) headers['X-Akbank-Session-Id'] = this.tokenSessionId
    if (options.emptyLoginHeader === true) headers.login_header = '""'
    if (options.crystalHeader === true) headers.crystalKyberEncryptionKey = createCrystalHeader(innerRequest)

    const response = await this.fetch(ENTRY_POINT_URL, {
      method: 'POST',
      headers,
      body,
      stringify: JSON.stringify,
      parse: parseResponse,
      sanitizeRequestLog: REQUEST_LOG_MASK,
      sanitizeResponseLog: RESPONSE_LOG_MASK
    })
    console.assert(response.status >= 200 && response.status < 300, 'Unexpected Akbank HTTP response', {
      path,
      status: response.status,
      errorCode: getOptString(response.body, 'ErrorCode')
    })
    const isError = getOptBoolean(response.body, 'IsError') ?? getOptBoolean(response.body, 'isError') ?? false
    console.assert(!isError, 'Akbank returned an unexpected API error', {
      path,
      errorCode: getOptString(response.body, 'ErrorCode'),
      errorMessage: getOptString(response.body, 'ErrorMessage') ?? getOptString(response.body, 'errorMessage'),
      nextTransactionUrl: getOptString(response.body, 'NextTransactionUrl')
    })
    const dialogs = getOptArray(response.body, 'DialogBoxes') ?? getOptArray(response.body, 'dialogBoxes') ?? []
    const hasBlockingDialog = dialogs.some(dialog => getOptString(dialog, 'Type') === 'Blocker')
    console.assert(!hasBlockingDialog, 'Akbank returned a blocking bank response', {
      path,
      messageCodes: (getOptArray(response.body, 'MessageList') ?? [])
        .map(message => getOptString(message, 'Code'))
        .filter((code): code is string => code !== undefined)
    })
    const token = getOptString(response.body, 'tokenSessionID') ?? getOptString(response.body, 'tokenSessionId')
    if (isNonBlank(token)) this.tokenSessionId = token
    return response.body
  }

  getTokenSessionId (): string {
    console.assert(isNonBlank(this.tokenSessionId), 'Akbank authorization response did not provide a session token')
    return this.tokenSessionId as string
  }
}

function parseResponse (value: string): unknown {
  const outer = JSON.parse(value) as unknown
  if (outer === null || typeof outer !== 'object' || Array.isArray(outer)) return outer
  const result = getOptString(outer, 'EntryPointJsonResult')
  if (result === undefined || result.trim() === '') return outer
  const inner = JSON.parse(result) as unknown
  console.assert(inner !== null && typeof inner === 'object' && !Array.isArray(inner), 'Akbank response content has an unexpected shape')
  return { ...(outer as Record<string, unknown>), ...(inner as Record<string, unknown>), EntryPointJsonResult: undefined }
}

function sanitizeResponseBody (value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeResponseBody)
  if (value === null || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key,
    key !== 'Code' && SENSITIVE_RESPONSE_KEYS.has(key.toLocaleLowerCase('en-US')) ? maskValue(item) : sanitizeResponseBody(item)
  ]))
}

function maskValue (value: unknown): string {
  if (typeof value === 'string') return `<string[${value.length}]>`
  if (Array.isArray(value)) return `<array[${value.length}]>`
  return '<value>'
}

function isNonBlank (value?: string): boolean {
  return value !== undefined && value.trim() !== ''
}
