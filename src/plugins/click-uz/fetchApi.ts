import { fetch } from '../../common/network'
import { randomInt } from '../../common/utils'
import { APP_VERSION, Auth } from './models'
import { getArray, getOptNumber, getString } from '../../types/get'
import { InvalidOtpCodeError, InvalidPreferencesError } from '../../errors'
import forge from 'node-forge'
import { defaultsDeep } from 'lodash'

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

async function fetchApi (method: string, params: unknown, auth: { sessionKey?: string, deviceId?: string },
  sanitizeOptions: { sanitizeRequestLog?: unknown, sanitizeResponseLog?: unknown }): Promise<unknown> {
  const id = new Date().getTime() + randomInt(0, 1000)
  const response = await fetch('https://api.click.uz/evo/', {
    method: 'POST',
    headers: {
      'Accept-Language': 'ru',
      'User-Agent': 'okhttp/3.12.1',
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
  return response.body
}

export async function fetchDeviceRegister (phone: string, imei: string): Promise<string> {
  const deviceName = `${ZenMoney.device.manufacturer} ${ZenMoney.device.model}`
  const response = await fetchApi('device.register.request', {
    app_version: APP_VERSION,
    device_info: `29|10|${deviceName}|Rooted: false1qq33`,
    device_name: deviceName,
    device_type: 1,
    imei,
    phone_number: phone
  }, {}, {
    sanitizeRequestLog: { body: { params: { phone_number: true, imei: true } } },
    sanitizeResponseLog: { body: { result: { device_id: true } } }
  })
  return getString(response, 'result.device_id')
}

export async function fetchConfirmRegister (phone: string, smsCode: string, auth: { deviceId: string }): Promise<void> {
  const response = await fetchApi('device.register.confirm', {
    confirm_token: encryptSmsCode(phone, smsCode, auth.deviceId),
    device_id: auth.deviceId,
    phone_number: phone
  }, auth, {
    sanitizeRequestLog: { body: { params: { confirm_token: true, device_id: true, phone_number: true } } },
    sanitizeResponseLog: { body: { result: { clickpass_token: true } } }
  })
  if (getOptNumber(response, 'error.code') === -32006) {
    throw new InvalidOtpCodeError()
  }
  assert(getString(response, 'result.next_step') === 'login', 'unexpected next step', response)
}

export async function fetchLogin (phone: string, pin: string, auth: { deviceId: string, authToken: string }): Promise<string> {
  const time = Math.floor(new Date().getTime() / 1000)
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

  if (getOptNumber(response, 'error.code') === -32000) {
    throw new InvalidPreferencesError('Неверный CLICK-PIN')
  }
  return getString(response, 'result.session_key')
}

export async function fetchGetCards (auth: Auth): Promise<unknown[]> {
  const response = await fetchApi('get.cards', {}, auth, {})
  return getArray(response, 'result')
}

export async function fetchGetBalance (accounts: number[], auth: Auth): Promise<unknown[]> {
  const response = await fetchApi('get.balance', { account_id: accounts }, auth, {})
  return getArray(response, 'result')
}

export async function fetchHistory (productId: string, from: Date, to: Date, auth: Auth): Promise<unknown[]> {
  const pageSize = 20
  let page = 1
  const result: unknown[] = []
  while (true) {
    const response = await fetchApi('history', {
      account_id: parseInt(productId),
      date_start: from.getTime(),
      date_end: to.getTime(),
      page_number: page++,
      page_size: pageSize
    }, auth, {})
    const resultPage = getArray(response, 'result')
    result.push(...resultPage)

    if (resultPage.length === 0 || resultPage.length !== pageSize) {
      return result
    }
  }
}
