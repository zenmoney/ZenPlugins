import { fetch } from '../../common/network'
import { randomInt } from '../../common/utils'
import { APP_VERSION, Auth, Product } from './models'
import { getOptArray, getOptNumber, getOptString } from '../../types/get'
import { InvalidOtpCodeError, InvalidPreferencesError } from '../../errors'
import forge from 'node-forge'
import { defaultsDeep } from 'lodash'

const API_URL = 'https://api.click.uz/evo/'

export class ClickApiError extends Error {
  constructor (public readonly code: number | undefined, message: string, public readonly status: number) {
    super(message)
    this.name = 'ClickApiError'
  }
}

export class SessionExpiredError extends ClickApiError {
  constructor (message: string, status: number) {
    super(-32004, message, status)
    this.name = 'SessionExpiredError'
  }
}

function getResultArray (response: unknown): unknown[] {
  const result = getOptArray(response, 'result')
  if (result === undefined) {
    throw new ClickApiError(undefined, 'CLICK API returned an invalid result', 200)
  }
  return result
}

function getResultString (response: unknown, path: string): string {
  const result = getOptString(response, path)
  if (result === undefined) {
    throw new ClickApiError(undefined, 'CLICK API returned an invalid result', 200)
  }
  return result
}

export function getAuthToken (phone: string, deviceId: string, firstSmsCode: string): string {
  const authTokenStep = forge.md.sha256.create().update(deviceId + firstSmsCode + phone, 'utf8').digest().toHex()
  return forge.md.sha512.create().update(deviceId + authTokenStep + phone, 'utf8').digest().toHex()
}

export function encryptPinCode (authToken: string, pin: string, time: string): string {
  const step1 = authToken + time + forge.md.md5.create().update(pin, 'utf8').digest().toHex()
  return forge.md.sha512.create().update(step1, 'utf8').digest().toHex()
}

export function encryptSmsCode (phone: string, smsCode: string, deviceId: string): string {
  return forge.md.sha256.create().update(deviceId + smsCode + phone, 'utf8').digest().toHex()
}

function getAndroidSdkVersion (androidVersion: string): number {
  const majorVersion = androidVersion.split('.')[0]
  const versions: Record<string, number> = {
    8: 26,
    9: 28,
    10: 29,
    11: 30,
    12: 31,
    13: 33,
    14: 34,
    15: 35,
    16: 36
  }
  return versions[majorVersion] ?? 29
}

async function fetchApi (method: string, params: unknown, auth: { sessionKey?: string, deviceId?: string },
  sanitizeOptions: { sanitizeRequestLog?: unknown, sanitizeResponseLog?: unknown }): Promise<unknown> {
  const id = new Date().getTime() + randomInt(0, 1000)
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Accept-Language': 'ru',
      'User-Agent': 'okhttp/5.3.2',
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
      'Accept-Theme': 'dark',
      'Accept-version': '2.1.0',
      id: id.toString(),
      ...'sessionKey' in auth && { 'session-key': auth.sessionKey },
      ...'deviceId' in auth && { 'device-id': auth.deviceId }
    },
    body: {
      id,
      jsonrpc: '2.0',
      method,
      params
    },
    stringify: JSON.stringify,
    parse: JSON.parse,
    sanitizeRequestLog: defaultsDeep({
      headers: { 'device-id': true, 'session-key': true }
    }, sanitizeOptions.sanitizeRequestLog),
    sanitizeResponseLog: sanitizeOptions.sanitizeResponseLog
  })

  const code = getOptNumber(response.body, 'error.code')
  const message = getOptString(response.body, 'error.message') ??
    getOptString(response.body, 'error.data') ??
    getOptString(response.body, 'message') ??
    'CLICK API request failed'
  if (code === -32004 || response.status === 401) {
    throw new SessionExpiredError(message, response.status)
  }
  if (code !== undefined || response.status < 200 || response.status >= 300) {
    throw new ClickApiError(code, message, response.status)
  }
  return response.body
}

export async function fetchDeviceRegister (phone: string, imei: string): Promise<string> {
  const deviceName = `${ZenMoney.device.manufacturer} ${ZenMoney.device.model}`
  const response = await fetchApi('device.register.request', {
    app_version: APP_VERSION,
    device_info: `${getAndroidSdkVersion(ZenMoney.device.os.version)}|${ZenMoney.device.os.version}|${deviceName}|Rooted: false`,
    device_name: deviceName,
    device_type: 1,
    imei,
    phone_number: phone
  }, {}, {
    sanitizeRequestLog: { body: { params: { phone_number: true, imei: true } } },
    sanitizeResponseLog: { body: { result: { device_id: true } } }
  })
  return getResultString(response, 'result.device_id')
}

export async function fetchConfirmRegister (phone: string, smsCode: string, auth: { deviceId: string }): Promise<void> {
  try {
    const response = await fetchApi('device.register.confirm', {
      confirm_token: encryptSmsCode(phone, smsCode, auth.deviceId),
      device_id: auth.deviceId,
      phone_number: phone,
      upgrade: false
    }, auth, {
      sanitizeRequestLog: { body: { params: { confirm_token: true, device_id: true, phone_number: true } } },
      sanitizeResponseLog: { body: { result: { clickpass_token: true, register_token: true } } }
    })
    if (getResultString(response, 'result.next_step') !== 'login') {
      throw new ClickApiError(undefined, 'CLICK API returned an unexpected registration step', 200)
    }
  } catch (error) {
    if (error instanceof ClickApiError && (error.code === -32006 || error.code === -32007)) {
      throw new InvalidOtpCodeError('Неверный код из СМС')
    }
    throw error
  }
}

export async function fetchLogin (phone: string, pin: string, auth: { deviceId: string, authToken: string }): Promise<string> {
  const time = Math.floor(new Date().getTime() / 1000)
  try {
    const response = await fetchApi('login', {
      app_version: APP_VERSION,
      datetime: time,
      device_id: auth.deviceId,
      password: encryptPinCode(auth.authToken, pin, time.toString()),
      phone_number: phone
    }, auth, {
      sanitizeRequestLog: { body: { params: { datetime: true, device_id: true, password: true, phone_number: true } } },
      sanitizeResponseLog: { body: { result: { session_key: true, user: { name: true } } } }
    })
    return getResultString(response, 'result.session_key')
  } catch (error) {
    if (error instanceof ClickApiError && error.code === -32000) {
      throw new InvalidPreferencesError('Неверный CLICK-PIN')
    }
    throw error
  }
}

export async function fetchGetCards (auth: Auth): Promise<unknown[]> {
  const response = await fetchApi('get.cards', {}, auth, {})
  return getResultArray(response)
}

export async function fetchGetBalance (accounts: number[], auth: Auth): Promise<unknown[]> {
  const response = await fetchApi('get.balance', { account_id: accounts }, auth, {})
  return getResultArray(response)
}

export async function fetchHistory (product: Product, from: Date, to: Date, auth: Auth): Promise<unknown[]> {
  const pageSize = 20
  let page = 1
  const result: unknown[] = []
  while (true) {
    const response = await fetchApi('get.synced.history', {
      account_id: parseInt(product.id),
      card_type: product.cardType,
      date_end: to.getTime(),
      date_start: from.getTime(),
      page_number: page++,
      page_size: pageSize
    }, auth, {})
    const resultPage = getResultArray(response)
    result.push(...resultPage)

    if (resultPage.length === 0 || resultPage.length !== pageSize) {
      return result
    }
  }
}
