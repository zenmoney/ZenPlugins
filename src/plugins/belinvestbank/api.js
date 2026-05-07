import { defaultsDeep, flatMap } from 'lodash'
import { stringify } from 'querystring'
import { createDateIntervals as commonCreateDateIntervals } from '../../common/dateUtils'
import { fetchJson } from '../../common/network'
import { InvalidOtpCodeError, InvalidPreferencesError, TemporaryError } from '../../errors'
import { APP_VERSION, BANK_CERT, getOrCreateDeviceFingerprint, mobileHeaders } from './fingerprint'

const LOGIN_API = 'https://login.belinvestbank.by/app_api'
const IBANK_API = 'https://ibank.belinvestbank.by/app_api'
const MOBILE_API = 'https://ibank.belinvestbank.by/simple/mobile-api/v1'
const dataUrl = IBANK_API

function extractPhpSessionId (response) {
  if (!response.headers) return null
  const setCookie = response.headers['set-cookie']
  if (!setCookie) return null
  const matches = setCookie.match(/PHPSESSID=([^;,\s]+)/g)
  if (!matches) return null
  for (let i = matches.length - 1; i >= 0; i--) {
    const val = matches[i].replace('PHPSESSID=', '')
    if (val !== 'deleted') return val
  }
  return null
}

function extractAuthTokenCookies (response) {
  if (!response.headers) return ''
  const setCookie = response.headers['set-cookie']
  if (!setCookie) return ''
  const parts = []
  const authMatch = setCookie.match(/auth_token=([^;,\s]+)/)
  if (authMatch && authMatch[1] !== 'deleted') parts.push(`auth_token=${authMatch[1]}`)
  const sessionMatch = setCookie.match(/session_type=([^;,\s]+)/)
  if (sessionMatch && sessionMatch[1] !== 'deleted') parts.push(`session_type=${sessionMatch[1]}`)
  return parts.length ? parts.join('; ') + ';' : ''
}

async function fetchApiJson (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  const fp = getOrCreateDeviceFingerprint()
  options = defaultsDeep(
    options,
    {
      headers: mobileHeaders(fp, options?.headers?.Cookie),
      sanitizeRequestLog: {
        headers: { Cookie: true },
        body: { password: true }
      },
      sanitizeResponseLog: { headers: { 'set-cookie': true } },
      stringify
    }
  )

  const response = await fetchJson(url, options)
  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }

  if (response.body && response.body.status && (response.body.status === 'ER' || response.body.status === 'SE') && response.body.message && !response.body.isNeedConfirmSessionKey) {
    const errorDescription = response.body.message
    const errorMessage = 'Ответ банка: ' + errorDescription
    if (errorDescription.indexOf('введены неверно') >= 0) { throw new InvalidPreferencesError(errorMessage) }
    console.assert(false, 'unexpected response', response)
  }

  return response
}

function validateResponse (response, predicate, error) {
  if (!predicate || !predicate(response)) {
    error('non-successful response')
  }
}

async function tryBindDevice (fp, sessionCookies) {
  try {
    const statusRes = await fetchJson(MOBILE_API + '/mobile/checkDeviceStatus', {
      method: 'GET',
      headers: mobileHeaders(fp, sessionCookies),
      sanitizeResponseLog: { headers: { 'set-cookie': true } }
    })
    if (statusRes.body?.objects?.deviceStatus === 1) return // Already bound

    // Request binding — triggers SMS
    await fetchJson(MOBILE_API + '/mobile/setDevice', {
      method: 'POST',
      headers: mobileHeaders(fp, sessionCookies),
      body: { deviceId: fp.deviceId },
      stringify,
      sanitizeResponseLog: { headers: { 'set-cookie': true } }
    })

    const bindCode = await ZenMoney.readLine(
      'Введите код из СМС для привязки устройства (для входа без SMS в будущем)',
      {
        time: 120000,
        inputType: 'number'
      }
    )
    if (!bindCode || !bindCode.trim()) return

    await fetchJson(MOBILE_API + '/mobile/setDevice', {
      method: 'POST',
      headers: mobileHeaders(fp, sessionCookies),
      body: {
        deviceId: fp.deviceId,
        code: bindCode.trim()
      },
      stringify,
      sanitizeResponseLog: { headers: { 'set-cookie': true } }
    })
    ZenMoney.setData('deviceBound', true)
    ZenMoney.saveData()
  } catch (e) {
    console.log('Device binding skipped:', e.message)
  }
}

export async function login (login, password) {
  if (ZenMoney.trustCertificates) {
    ZenMoney.trustCertificates([BANK_CERT])
  }

  const fp = getOrCreateDeviceFingerprint()

  // Try reusing saved session
  const savedCookies = ZenMoney.getData('sessionCookies', null)
  if (savedCookies) {
    try {
      const testRes = await fetchApiJson(dataUrl, {
        method: 'POST',
        headers: { Cookie: savedCookies },
        body: {
          section: 'payments',
          method: 'index'
        }
      }, response => response.ok && response.body?.status === 'OK',
      () => { throw new Error('Session invalid') })
      if (testRes.body.status === 'OK') return savedCookies
    } catch (e) {
      ZenMoney.setData('sessionCookies', null)
    }
  }

  // Step 1: Pre-login to ibank — establish PHPSESSID
  const preLoginRes = await fetchApiJson(dataUrl, {
    method: 'POST',
    body: {
      section: 'info',
      method: 'isApprovedVersionApp',
      versionApp: APP_VERSION
    }
  }, () => true, () => null)
  const ibankSessionId = extractPhpSessionId(preLoginRes)
  if (!ibankSessionId) throw new TemporaryError('Не удалось получить сессию ibank')

  // Step 2: Sign in via mobile API
  const signinRes = await fetchJson(LOGIN_API, {
    method: 'POST',
    headers: mobileHeaders(fp),
    body: {
      section: 'account',
      method: 'signin',
      login,
      password,
      deviceId: fp.deviceId,
      versionApp: APP_VERSION,
      deviceName: fp.deviceName,
      os: 'Android',
      AndroidVersion: fp.androidVersion,
      device_token: fp.fcmToken,
      device_token_type: 'ANDROID',
      typeSessionKey: '0'
    },
    stringify,
    sanitizeRequestLog: {
      headers: { Cookie: true },
      body: {
        password: true,
        login: true
      }
    },
    sanitizeResponseLog: { headers: { 'set-cookie': true } }
  })

  let loginSessionId = extractPhpSessionId(signinRes)
  let authCode = null
  let loginCompleted = false
  let authTokenStr = extractAuthTokenCookies(signinRes)
  let needSms = false

  if (signinRes.body.status === 'OK') {
    authCode = signinRes.body.values?.authCode
    loginCompleted = signinRes.body.values?.loginCompleted === true
    if (!loginCompleted || !authCode) needSms = true
  } else if (signinRes.body.status === 'ER' || signinRes.body.status === 'SE') {
    if (signinRes.body.isNeedConfirmSessionKey === '1') {
      // Session conflict — close old session and retry
      const closeRes = await fetchJson(LOGIN_API, {
        method: 'POST',
        headers: mobileHeaders(fp, loginSessionId ? `PHPSESSID=${loginSessionId};` : undefined),
        body: {
          section: 'account',
          method: 'confirmationCloseSession'
        },
        stringify,
        sanitizeRequestLog: { headers: { Cookie: true } },
        sanitizeResponseLog: { headers: { 'set-cookie': true } }
      })
      loginSessionId = extractPhpSessionId(closeRes) || loginSessionId
      authCode = closeRes.body?.values?.authCode
      loginCompleted = closeRes.body?.values?.loginCompleted === true
      authTokenStr = extractAuthTokenCookies(closeRes) || authTokenStr
      if (!loginCompleted || !authCode) needSms = true
    } else {
      const msg = signinRes.body.message || 'Ошибка входа'
      if (msg.indexOf('введены неверно') >= 0) throw new InvalidPreferencesError('Ответ банка: ' + msg)
      throw new TemporaryError('Ответ банка: ' + msg)
    }
  }

  // Step 3: SMS verification (only if device is NOT bound)
  if (needSms) {
    const otpCode = await ZenMoney.readLine('Введите код из СМС для входа в Белинвестбанк', {
      time: 120000,
      inputType: 'number'
    })
    if (!otpCode || !otpCode.trim()) throw new InvalidOtpCodeError()

    const signin2Res = await fetchJson(LOGIN_API, {
      method: 'POST',
      headers: mobileHeaders(fp, loginSessionId ? `PHPSESSID=${loginSessionId};` : undefined),
      body: {
        section: 'account',
        method: 'signin2',
        action: '1',
        key: otpCode.trim(),
        device_token: fp.fcmToken,
        device_token_type: 'ANDROID'
      },
      stringify,
      sanitizeRequestLog: {
        headers: { Cookie: true },
        body: { key: true }
      },
      sanitizeResponseLog: { headers: { 'set-cookie': true } }
    })

    if (signin2Res.body.status !== 'OK') {
      throw new InvalidOtpCodeError()
    }
    authCode = signin2Res.body.values?.authCode
    authTokenStr = extractAuthTokenCookies(signin2Res) || authTokenStr
  }

  if (!authCode) throw new TemporaryError('Не удалось получить код авторизации')

  // Step 4: Auth callback on ibank — bridge login → ibank session
  let ibankCookies = `PHPSESSID=${ibankSessionId};`
  if (authTokenStr) ibankCookies += ' ' + authTokenStr

  const authCallbackRes = await fetchApiJson(dataUrl, {
    method: 'POST',
    headers: { Cookie: ibankCookies },
    body: {
      section: 'account',
      method: 'authCallback',
      auth_code: authCode
    }
  }, response => response.body?.status === 'OK',
  () => { throw new TemporaryError('Ошибка авторизации через authCallback') })

  const finalSessionId = extractPhpSessionId(authCallbackRes) || ibankSessionId
  const sessionCookies = `PHPSESSID=${finalSessionId};`
  ZenMoney.setData('sessionCookies', sessionCookies)
  ZenMoney.saveData()

  // Step 5: Bind device for future SMS-free logins (only on first SMS login)
  if (needSms && !ZenMoney.getData('deviceBound')) {
    await tryBindDevice(fp, sessionCookies)
  }

  return sessionCookies
}

export async function fetchAccounts (sessionCookies) {
  const accounts = (await fetchApiJson(dataUrl, {
    method: 'POST',
    headers: { Cookie: sessionCookies },
    body: {
      section: 'payments',
      method: 'index'
    }
  }, response => response.ok && response.body?.status === 'OK',
  () => { throw new InvalidPreferencesError('bad request') }))
  return accounts.body.values.cards
}

function formatDate (date) {
  return ('0' + date.getDate()).slice(-2) + '.' + ('0' + (date.getMonth() + 1)).slice(-2) + '.' + date.getFullYear()
}

export function createDateIntervals (fromDate, toDate) {
  const interval = 10 * 24 * 60 * 60 * 1000 // 10 days interval for fetching data
  const gapMs = 1
  return commonCreateDateIntervals({
    fromDate,
    toDate,
    addIntervalToDate: date => new Date(date.getTime() + interval - gapMs),
    gapMs
  })
}

export async function fetchTransactions (sessionCookies, account, fromDate, toDate = new Date()) {
  toDate = toDate || new Date()

  const dates = createDateIntervals(fromDate, toDate)
  const operations = []
  let summaryData = null
  let msCardId = null
  for (const [dateFrom, dateTo] of dates) {
    const response = await fetchApiJson(dataUrl, {
      method: 'POST',
      headers: { Cookie: sessionCookies },
      body: {
        section: 'cards',
        method: 'history',
        cardId: account.id,
        dateFrom: formatDate(dateFrom),
        dateTo: formatDate(dateTo)
      }
    }, () => true, () => null).catch(() => null)
    const history = response?.body?.values?.history
    if (response?.body?.values?.summaryData) summaryData = response.body.values.summaryData
    if (!msCardId) {
      const cards = response?.body?.values?.cards
      if (cards && cards.length > 0 && cards[0].msCardId) msCardId = cards[0].msCardId
    }
    if (history) operations.push(...flatMap(history, op => op))
  }
  return {
    history: operations,
    summaryData,
    msCardId
  }
}

export async function fetchCardBalance (sessionCookies, msCardId) {
  const ibankUrl = 'https://ibank.belinvestbank.by/cards/balance-by-card'
  const response = await fetchApiJson(ibankUrl, {
    method: 'POST',
    headers: { Cookie: sessionCookies },
    body: { msCardId }
  }, () => true, () => null).catch(() => null)
  if (response?.body?.status === 'OK' && response.body.balance != null) {
    return response.body.balance
  }
  return null
}
