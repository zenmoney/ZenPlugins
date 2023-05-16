import { Base64 } from 'jshashes'
import { defaultsDeep, flatMap } from 'lodash'
import { stringify } from 'querystring'
import { createDateIntervals as commonCreateDateIntervals } from '../../common/dateUtils'
import { fetchJson } from '../../common/network'
import { generateRandomString } from '../../common/utils'
import { InvalidOtpCodeError } from '../../errors'

const base64 = new Base64()
const loginUrl = 'https://login.belinvestbank.by/app_api'
const dataUrl = 'https://ibank.belinvestbank.by/app_api'

const APP_VERSION = '2.15.2'

export function getDevice () {
  const deviceID = ZenMoney.getData('deviceId', generateRandomString(16))
  ZenMoney.setData('deviceId', deviceID)
  const deviceToken = ZenMoney.getData('token', base64.encode(generateRandomString(203)))
  ZenMoney.setData('token', deviceToken)
  return {
    id: deviceID,
    token: deviceToken
  }
}

async function fetchApiJson (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  options = defaultsDeep(
    options,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Android',
        DEVICE_TOKEN: 123456,
        Connection: 'Keep-Alive',
        'Accept-Encoding': 'gzip'
      },
      sanitizeRequestLog: { headers: { Cookie: true } },
      sanitizeResponseLog: { headers: { 'set-cookie': true } },
      stringify
    }
  )

  const response = await fetchJson(url, options)
  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }

  if (response.body.status && (response.body.status === 'ER' || response.body.status === 'SE') && response.body.message && !response.body.isNeedConfirmSessionKey) {
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

function cookies (response) {
  if (response.headers) {
    const cookies = response.headers['set-cookie']
    if (cookies) {
      const requiredValues = /(PHPSESSID=[^;]*;)/g
      return cookies.match(requiredValues)[cookies.match(requiredValues).length - 1]
    } else {
      return cookies
    }
  } else {
    return '' // tests not mocking headers, ignoring
  }
}

export async function login (login, password) {
  if (ZenMoney.trustCertificates) {
    ZenMoney.trustCertificates([
      `-----BEGIN CERTIFICATE-----
MIIGUzCCBTugAwIBAgIMTGWX/YRoKcy161yWMA0GCSqGSIb3DQEBCwUAMEwxCzAJ
BgNVBAYTAkJFMRkwFwYDVQQKExBHbG9iYWxTaWduIG52LXNhMSIwIAYDVQQDExlB
bHBoYVNTTCBDQSAtIFNIQTI1NiAtIEc0MB4XDTIzMDQyNjEyNTYxMloXDTI0MDUy
NzEyNTYxMVowHTEbMBkGA1UEAwwSKi5iZWxpbnZlc3RiYW5rLmJ5MIIBIjANBgkq
hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwyGdRWFd5xeApdnnvHD/jzfCFg0xoHPQ
jJDQQVrbtvf1QWnl5ZS1aNmMxWHWfUzseJBMVLgpjtHxi5+SGX9M9H/8jbG2rZzU
Xoy7uae7W+9o9q+gbluY5oMOt0swbH+/bZ/Jatxy6AFWPZzSIIDz6SBGWnzJkh+d
k0JEIx6trQTdxLZPtOCy173Tqld6gW/iauIfbFbGWO+B/7Pb32kydCwa2xDttDf8
a/HukSJMSvnBxKdPGHSNgzU/jCfVWtlL8eOpAGfDGYjVTzAMKZ6KToaWwmvlalQ6
SC06i63dEq0yyc2zHSS7RGY6Sy4L6DA7AULzMYbw/HK+Jd4TAN+o8QIDAQABo4ID
YjCCA14wDgYDVR0PAQH/BAQDAgWgMIGTBggrBgEFBQcBAQSBhjCBgzBGBggrBgEF
BQcwAoY6aHR0cDovL3NlY3VyZS5nbG9iYWxzaWduLmNvbS9jYWNlcnQvYWxwaGFz
c2xjYXNoYTI1Nmc0LmNydDA5BggrBgEFBQcwAYYtaHR0cDovL29jc3AuZ2xvYmFs
c2lnbi5jb20vYWxwaGFzc2xjYXNoYTI1Nmc0MFcGA1UdIARQME4wCAYGZ4EMAQIB
MEIGCisGAQQBoDIKAQMwNDAyBggrBgEFBQcCARYmaHR0cHM6Ly93d3cuZ2xvYmFs
c2lnbi5jb20vcmVwb3NpdG9yeS8wCQYDVR0TBAIwADBBBgNVHR8EOjA4MDagNKAy
hjBodHRwOi8vY3JsLmdsb2JhbHNpZ24uY29tL2FscGhhc3NsY2FzaGEyNTZnNC5j
cmwwLwYDVR0RBCgwJoISKi5iZWxpbnZlc3RiYW5rLmJ5ghBiZWxpbnZlc3RiYW5r
LmJ5MB0GA1UdJQQWMBQGCCsGAQUFBwMBBggrBgEFBQcDAjAfBgNVHSMEGDAWgBRP
y6yowu+r3YNva7/OmD1cWCV2FTAdBgNVHQ4EFgQUyuef7y3E7vbbty/xDEweQXHb
1DQwggF9BgorBgEEAdZ5AgQCBIIBbQSCAWkBZwB2AO7N0GTV2xrOxVy3nbTNE6Iy
h0Z8vOzew1FIWUZxH7WbAAABh72i3ssAAAQDAEcwRQIhAK+urBOo3Cjk7bXaAEX7
n0LWNkEBUrw2ue1TqN6ipZvFAiB3V49/RH6IbRARfw9NQPqfJQRtJnvkTWN31i22
06j5qgB2AEiw42vapkc0D+VqAvqdMOscUgHLVt0sgdm7v6s52IRzAAABh72i3toA
AAQDAEcwRQIgcranm84nePyV4/mgCaseOovjKlulymZtQiNpGtQ/uccCIQCg3uIU
+HdNmH3qxCFFdbe5mZhh6/O5A2DE5fQyIO+EeAB1ANq2v2s/tbYin5vCu1xr6HCR
cWy7UYSFNL2kPTBI1/urAAABh72i3wYAAAQDAEYwRAIgDQ7prrMlrHP1qjUfjPKo
ug1w7k+cwx2qP0CopSjKavACIHM44RlC5Ws+NUjwQKL9YfdAi2fOqIF8tg6pMoth
AXJmMA0GCSqGSIb3DQEBCwUAA4IBAQBMC+ujGTyasVS/xIDiCzHh18joFVXWeW2x
oz39/RPrCNStjBLA7HxavytnQmxbT80ezbobzy1ow2Hq5FiVMubmpWiZhhXI+Mx+
BvQ9erhe96jQG6UWriHYUEbtwy/M3GJYm1gWY1g0Ztci/YAVxkbPRAtdKkzWgij9
QMfKNrv4JrCCi2DuQs21bKSsYgchAHNxxK68z+itGSEZa7GSd9oG74Cdwvn/Q2YS
8t1ezDjQwK8w3i/JOiEXqUtt6SdfZm6/uQ2GSHfn0jtVxtjUsYp7xedvprT3ctnL
6fBvjH54zyqtVIgeyrG3A85Qh5UyxuSvYntxZ2I3k3kIGU63CVr7
-----END CERTIFICATE-----`
    ])
  }

  const device = getDevice()
  let res = (await fetchApiJson(loginUrl, {
    method: 'POST',
    body: {
      section: 'account',
      method: 'signin',
      login,
      password,
      deviceId: device.id,
      versionApp: APP_VERSION,
      os: 'Android',
      device_token: device.token,
      device_token_type: 'ANDROID'
    },
    sanitizeRequestLog: { body: { login: true, password: true } }
  }, response => response.success, message => new InvalidPreferencesError('Неверный логин или пароль')))
  let sessionCookies = cookies(res)

  if (res.body.isNeedConfirmSessionKey) {
    res = (await fetchApiJson(loginUrl, {
      method: 'POST',
      body: {
        section: 'account',
        method: 'confirmationCloseSession'
      }
    }, response => response.success, message => new InvalidPreferencesError('bad request')))
  }

  let isNeededSaveDevice = false
  if (res.body.values && !res.body.values.authCode) {
    // Значит нужно подтверджать смс
    const code = await ZenMoney.readLine('Введите код из СМС', {
      time: 120000,
      inputType: 'number'
    })
    if (!code || !code.trim()) {
      throw new InvalidOtpCodeError()
    }

    res = (await fetchApiJson(loginUrl, {
      method: 'POST',
      headers: { Cookie: sessionCookies },
      body: {
        section: 'account',
        method: 'signin2',
        action: 1,
        key: code,
        device_token: device.token,
        device_token_type: 'ANDROID'
      }
    }, response => response.success && response.body.status && response.body.status === 'OK', message => new InvalidPreferencesError('bad request')))

    isNeededSaveDevice = true
  }

  res = (await fetchApiJson(dataUrl, {
    method: 'POST',
    body: {
      section: 'account',
      method: 'authCallback',
      auth_code: res.body.values.authCode
    }
  }, response => response.success && response.body.status && response.body.status === 'OK', message => new InvalidPreferencesError('bad request')))
  sessionCookies = cookies(res)

  if (isNeededSaveDevice) {
    await fetchApiJson(dataUrl, {
      method: 'POST',
      headers: { Cookie: sessionCookies },
      body: {
        section: 'mobile',
        method: 'setDeviceId',
        deviceId: device.id,
        os: 'Android'
      }
    }, response => response.success && response.body.status && response.body.status === 'OK', message => new InvalidPreferencesError('bad request'))
  }

  return sessionCookies
}

export async function fetchAccounts (sessionCookies) {
  console.log('>>> Загрузка списка счетов...')
  const accounts = (await fetchApiJson(dataUrl, {
    method: 'POST',
    headers: { Cookie: sessionCookies },
    body: {
      section: 'payments',
      method: 'index'
    }
  }, response => response.success && response.body.status && response.body.status === 'OK',
  message => new InvalidPreferencesError('bad request')))
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
  console.log('>>> Загрузка списка транзакций...')
  toDate = toDate || new Date()

  const dates = createDateIntervals(fromDate, toDate)
  const responses = await Promise.all(dates.map(dates => fetchApiJson(dataUrl, {
    method: 'POST',
    headers: { Cookie: sessionCookies },
    body: {
      section: 'cards',
      method: 'history',
      cardId: account.id,
      dateFrom: formatDate(dates[0]),
      dateTo: formatDate(dates[1])
    }
  }, response => response.body && response.body.values && response.body.values.history && response.body.values.history.length > 0,
  message => new InvalidPreferencesError('bad request'))
  ))

  const operations = flatMap(responses, response => {
    return flatMap(response.body.values.history, op => {
      return op
    })
  })

  console.log(`>>> Загружено ${operations.length} операций.`)
  return operations
}
