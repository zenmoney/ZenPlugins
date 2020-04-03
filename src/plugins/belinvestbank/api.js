import { Base64 } from 'jshashes'
import { defaultsDeep, flatMap } from 'lodash'
import { createDateIntervals as commonCreateDateIntervals } from '../../common/dateUtils'
import { fetchJson } from '../../common/network'
import { generateRandomString } from '../../common/utils'
import { InvalidOtpCodeError } from '../../errors'

const base64 = new Base64()
var querystring = require('querystring')
const loginUrl = 'https://login.belinvestbank.by/app_api'
const dataUrl = 'https://ibank.belinvestbank.by/app_api'

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
      stringify: querystring.stringify
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
    throw new TemporaryError(errorMessage)
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
MIIG7jCCBdagAwIBAgIQA/6UPgCBLuOWOLZxsKc8tjANBgkqhkiG9w0BAQsFADBh
MQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3
d3cuZGlnaWNlcnQuY29tMSAwHgYDVQQDExdHZW9UcnVzdCBFViBSU0EgQ0EgMjAx
ODAeFw0xOTEwMjIwMDAwMDBaFw0yMTEwMjExMjAwMDBaMIHAMR0wGwYDVQQPDBRQ
cml2YXRlIE9yZ2FuaXphdGlvbjETMBEGCysGAQQBgjc8AgEDEwJCWTESMBAGA1UE
BRMJODA3MDAwMDI4MQswCQYDVQQGEwJCWTEOMAwGA1UEBxMFTWluc2sxGjAYBgNV
BAoTEUJlbGludmVzdGJhbmsgSlNDMRwwGgYDVQQLExNTZWN1cml0eSBEZXBhcnRt
ZW50MR8wHQYDVQQDExZsb2dpbi5iZWxpbnZlc3RiYW5rLmJ5MIIBIjANBgkqhkiG
9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvRfjLb/QCl5ThzC4FnnWv3UpQ4bzwCQuS6Dz
rO4sJ6OvkZDvVPjfypCZpGh2c7Ml7aKrDCjaTR9OAllcqAk945jdTAL/nFhdS0IJ
neh5k51rf9+XEPiqsbSPaZBc0zSE9N/qzZMvEtXqWLtNzKpJT021DmLbHjW2wuA0
aIHQuKNS1LQqFuN3H5xNvALOOxLghzqSKoZ4RFzfX9Gi+RVfG7U04bdgVXFCvEK3
g972jhMpe6nM7X4ZUU0nkdCR9BxqEkCgcy+El6PAxGHQNwadJSEhwSCSueqOSCNR
DqjhYoADV9/jBPw+N7mFBl6yJrwbRXeW9RPa0J9GrCkN2vc5JwIDAQABo4IDQDCC
AzwwHwYDVR0jBBgwFoAUypJnUmHervy6Iit/HIdMJftvmVgwHQYDVR0OBBYEFJuO
diNmebr7ukOWLslORKxoIYhfMDcGA1UdEQQwMC6CFmxvZ2luLmJlbGludmVzdGJh
bmsuYnmCFGFwaS5iZWxpbnZlc3RiYW5rLmJ5MA4GA1UdDwEB/wQEAwIFoDAdBgNV
HSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwQAYDVR0fBDkwNzA1oDOgMYYvaHR0
cDovL2NkcC5nZW90cnVzdC5jb20vR2VvVHJ1c3RFVlJTQUNBMjAxOC5jcmwwSwYD
VR0gBEQwQjA3BglghkgBhv1sAgEwKjAoBggrBgEFBQcCARYcaHR0cHM6Ly93d3cu
ZGlnaWNlcnQuY29tL0NQUzAHBgVngQwBATB3BggrBgEFBQcBAQRrMGkwJgYIKwYB
BQUHMAGGGmh0dHA6Ly9zdGF0dXMuZ2VvdHJ1c3QuY29tMD8GCCsGAQUFBzAChjNo
dHRwOi8vY2FjZXJ0cy5nZW90cnVzdC5jb20vR2VvVHJ1c3RFVlJTQUNBMjAxOC5j
cnQwCQYDVR0TBAIwADCCAX0GCisGAQQB1nkCBAIEggFtBIIBaQFnAHUApLkJkLQY
WBSHuxOizGdwCjw1mAT5G9+443fNDsgN3BAAAAFt8xvrUQAABAMARjBEAiAhrERp
2//FlpKrEH14q81uPXxEEvc571SJ1JxiAW57fQIgQIPXd4FVSO7C1li+d8DRuXUU
KmLQgN9zOxhgDCICFg4AdQBWFAaaL9fC7NP14b1Esj7HRna5vJkRXMDvlJhV1onQ
3QAAAW3zG+vVAAAEAwBGMEQCIBeZzTMsGlvCSeATO7WUdX+fr/NpRGQE9KxfVTo0
YarpAiAu/Vp779b0NU7/hDxQBi7wc7YwPPF5w8miOAhgrrHEkgB3ALvZ37wfinG1
k5Qjl6qSe0c4V5UKq1LoGpCWZDaOHtGFAAABbfMb60wAAAQDAEgwRgIhAK1ZhIEA
R3yGap2YnhyElXNvq6tSM5v+KLGRptEvfLatAiEAk4LlEaoshvBDve76fBzHNZB0
nObafEmSoBilWOLSA+QwDQYJKoZIhvcNAQELBQADggEBAFh8nT+BycmyZN+rq/x1
d9As7BJ1WXTkni6gCuYlik2cEYcpYfrlqt0dGqfMit2XGC/0ir8YWtMVZV0+F0GW
fBkJHqGhKaSHgoigN9meADrXoDlG6tmp362LNTCAEE6je9FT8Ujwa3VeOigJ3dbs
LQZ316d5RiVoNROCF155V8BSerU+K15gMl4/kz8FAZL3+r8EoG9zQ3UPX4XZ0oJK
WFVQZfSgoL+ezvz+SYbXTx8KHRmK329jHOmrZ5hG2HKq5aHeYzM0NKrK7BQaIili
SpFwSgq41zuaYjVAf8JDh7ZvN7Q8GQZV1yI9Wr1/GbU+q74F6+wkdVBpgUyG0HIf
kro=
-----END CERTIFICATE-----`
    ])
  }

  const device = getDevice()
  let res = (await fetchApiJson(loginUrl, {
    method: 'POST',
    body: {
      section: 'account',
      method: 'signin',
      login: login,
      password: password,
      deviceId: device.id,
      versionApp: '2.1.7',
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

export async function fetchTransactions (sessionCookies, accounts, fromDate, toDate = new Date()) {
  console.log('>>> Загрузка списка транзакций...')
  toDate = toDate || new Date()

  const dates = createDateIntervals(fromDate, toDate)
  const responses = await Promise.all(flatMap(accounts, (account) => {
    return dates.map(dates => {
      return fetchApiJson(dataUrl, {
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
    })
  }))

  const operations = flatMap(responses, response => {
    return flatMap(response.body.values.history, op => {
      return op
    })
  })

  console.log(`>>> Загружено ${operations.length} операций.`)
  return operations
}
