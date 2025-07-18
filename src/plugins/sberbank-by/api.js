import { defaultsDeep } from 'lodash'
import forge from 'node-forge'
import { stringify } from 'querystring'
import { getByteStringFromString } from '../../common/byteStringUtils'
import { toISODateString } from '../../common/dateUtils'
import { fetchJson } from '../../common/network'
import { generateUUID } from '../../common/utils'
import { BankMessageError, InvalidLoginOrPasswordError, InvalidOtpCodeError, TemporaryUnavailableError } from '../../errors'

const host = 'digital.bps-sberbank.by'
const defaultKeyValueSeparator = ':'

export class AuthError {}

export function getAuthToken ({ login, password }) {
  return 'Basic ' + forge.util.encode64(getByteStringFromString(login) + defaultKeyValueSeparator + getByteStringFromString(password))
}

export function generateDevice (device) {
  if (!device) {
    return {
      androidId: generateUUID().split('-').join('').substring(0, 16),
      udid: generateUUID()
    }
  } else {
    return {
      androidId: device.androidId,
      udid: device.udid
    }
  }
}

async function callGate (url, options = {}) {
  const headers = {
    ...options.headers,
    Accept: 'application/json; charset=UTF-8',
    'X-Sbol-OS': 'android',
    'X-Sbol-Version': '3.8.3',
    'X-Sbol-Id': options.device.androidId,
    'User-Agent': 'sbol/3.8.3 (android 8.0.0) ' + ZenMoney.device.model,
    Host: host,
    Connection: 'Keep-Alive',
    'Accept-Encoding': 'gzip'
  }

  const response = await fetchJson(url, {
    stringify,
    ...options,
    headers,
    sanitizeRequestLog: defaultsDeep({ headers: { 'X-Sbol-Id': true } }, options && options.sanitizeRequestLog),
    sanitizeResponseLog: defaultsDeep({ body: { access_token: true, refresh_token: true } }, options && options.sanitizeResponseLog)
  })
  if (response.body && response.body.errorInfo && response.body.errorInfo.errorCode === '1') {
    throw new TemporaryUnavailableError() // Сервис временно недоступен
  }
  return response
}

async function prepareDevice (device) {
  return callGate(`https://${host}/SBOLServer/rest/registration/prepareDevice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    body: {
      udId: device.udid
    },
    sanitizeRequestLog: { body: { udId: true } },
    device,
    stringify: JSON.stringify
  })
}

async function trustDevice (smsCode, device) {
  return callGate(`https://${host}/SBOLServer/rest/registration/trustedDevice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    body: {
      smsCode,
      udId: device.udid
    },
    sanitizeRequestLog: { body: { smsCode: true, udId: true } },
    device,
    stringify: JSON.stringify
  })
}

async function initiateLoginSequence (auth, device) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      Authorization: getAuthToken(auth)
    },
    body: {
      client_id: auth.login,
      client_secret: auth.password,
      grant_type: 'client_credentials'
    },
    sanitizeRequestLog: { headers: { Authorization: true }, body: { client_id: true, client_secret: true } },
    device
  }
  const newDevice = generateDevice(device)
  let response = await callGate(`https://${host}/SBOLServer/oauth/token`, options)
  if (response.status === 401 && response.body.error === 'unauthorized') {
    if (response.body.error_description) {
      if ([
        'Invalid username or password',
        'Неверное имя пользователя или пароль'
      ].some(str => response.body.error_description.indexOf(str) >= 0)) {
        throw new InvalidLoginOrPasswordError()
      }
      if ([
        'Неверный имя пользователя или пароль',
        'Аккаунт временно заблокирован',
        'Попробуйте после'
      ].some(str => response.body.error_description.indexOf(str) >= 0)) {
        throw new InvalidPreferencesError(response.body.error_description)
      }
      if ([
        'Ожидается обработка Вашей заявки'
      ].some(str => response.body.error_description.indexOf(str) >= 0)) {
        throw new BankMessageError(response.body.error_description)
      }
      if ([
        /^.*blocked.*$/,
        /^.*Ваша учетная запись временно заблокирована.*$/,
        /^.*Необходимо подтвердить регистрацию.*$/
      ].some(regexp => response.body.error_description.match(regexp))) {
        throw new BankMessageError(response.body.error_description)
      }
      if (![
        'device',
        'неизвестного устройства'
      ].some(str => response.body.error_description.indexOf(str) >= 0)) {
        console.assert(false, 'Unknown login error')
      }
    }
    const optionsBearer = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        Authorization: 'Bearer null'
      },
      body: {
        client_id: auth.login,
        client_secret: auth.password,
        grant_type: 'client_credentials'
      },
      sanitizeRequestLog: { headers: { Authorization: true }, body: { client_id: true, client_secret: true } },
      device
    }
    response = await callGate(`https://${host}/SBOLServer/oauth/token`, optionsBearer)
    if (response.headers['sbol-udid'] && response.headers['sbol-status'] && response.headers['sbol-status'] === 'new_device') {
      newDevice.udid = response.headers['sbol-udid']
    }
    response = await prepareDevice(newDevice)
    console.assert(response.body.errorInfo.errorCode === '0', 'Error while registering device.', response)

    const code = await ZenMoney.readLine('Введите код из SMS')
    response = await trustDevice(code, newDevice)
    if (response.body.errorInfo.errorCode === '1') {
      throw new InvalidOtpCodeError()
    } else {
      console.assert(response.body.errorInfo.errorCode === '0', 'Error while registering device.', response)
    }

    response = await callGate(`https://${host}/SBOLServer/oauth/token`, options)
  }
  return {
    response,
    device: newDevice
  }
}

export async function updateToken (auth) {
  const response = await callGate(`https://${host}/SBOLServer/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      Authorization: getAuthToken(auth)
    },
    body: {
      client_id: auth.login,
      client_secret: auth.password,
      grant_type: 'client_credentials'
    },
    sanitizeRequestLog: { headers: { Authorization: true }, body: { client_id: true, client_secret: true } },
    device: auth.device
  })
  console.assert(response.body.access_token, 'Error, while getting token.', response)
  return {
    ...auth,
    token: response.body.access_token
  }
}

async function fetchListMoneyBox (auth) {
  const response = await callGate(`https://${host}/SBOLServer/rest/client/getListMoneybox`, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + auth.token
    },
    sanitizeRequestLog: { headers: { Authorization: true } },
    device: auth.device
  })
  if (response.body.error === 'invalid_token') {
    throw new AuthError()
  }
  console.assert(response.body.moneyboxs, 'Error fetching MoneyBoxs List.', response)
  return response.body.moneyboxs
}

export async function login ({ login, password }, device) {
  if (ZenMoney.trustCertificates) {
    ZenMoney.trustCertificates([
      `-----BEGIN CERTIFICATE-----
MIIGlTCCBX2gAwIBAgIQDixfIHPvT9Zw1dqtnRc7eTANBgkqhkiG9w0BAQsFADBZ
MQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMTMwMQYDVQQDEypS
YXBpZFNTTCBUTFMgRFYgUlNBIE1peGVkIFNIQTI1NiAyMDIwIENBLTEwHhcNMjIw
MjA4MDAwMDAwWhcNMjMwMjA4MjM1OTU5WjAcMRowGAYDVQQDDBEqLmJwcy1zYmVy
YmFuay5ieTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMLlzMioTb9A
/0CuLm/u5YhAHjUOSQURNkB4ghcGiYA2BuF3vt0SqDm5REdlOHMNr+PhpojJXSnm
r0phWcBRG2/hlA83Wl+uMra02JGsdse2S+EtmP1AdbUt3ciMNl+qRUbYqWfR3aRC
haRwaQO5ZXLtUSWMermT+05EO7IJe7J5ZbCMLw7nqLm4d9jNTeUGB/zMqO36jB9u
OVgPnrovDa1P2GaGEdm8ciMSh8I2zRSq0JKuG3wd8ZGfZ7Kbrid+WWw6dSB1UZrH
VGDwPxcJBog3vAbIDcmzAa7pSR4nS+Omv1DjS8klz7O6C2fYRGMAgFEk/hgXWwgQ
RYFlckrY1JkCAwEAAaOCA5QwggOQMB8GA1UdIwQYMBaAFKSN5b58eeRwI20uKTSt
I1jc9TF/MB0GA1UdDgQWBBS0i/ZeW6DLnbrZEBANK67/8yDIxDAtBgNVHREEJjAk
ghEqLmJwcy1zYmVyYmFuay5ieYIPYnBzLXNiZXJiYW5rLmJ5MA4GA1UdDwEB/wQE
AwIFoDAdBgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwgZsGA1UdHwSBkzCB
kDBGoESgQoZAaHR0cDovL2NybDMuZGlnaWNlcnQuY29tL1JhcGlkU1NMVExTRFZS
U0FNaXhlZFNIQTI1NjIwMjBDQS0xLmNybDBGoESgQoZAaHR0cDovL2NybDQuZGln
aWNlcnQuY29tL1JhcGlkU1NMVExTRFZSU0FNaXhlZFNIQTI1NjIwMjBDQS0xLmNy
bDA+BgNVHSAENzA1MDMGBmeBDAECATApMCcGCCsGAQUFBwIBFhtodHRwOi8vd3d3
LmRpZ2ljZXJ0LmNvbS9DUFMwgYUGCCsGAQUFBwEBBHkwdzAkBggrBgEFBQcwAYYY
aHR0cDovL29jc3AuZGlnaWNlcnQuY29tME8GCCsGAQUFBzAChkNodHRwOi8vY2Fj
ZXJ0cy5kaWdpY2VydC5jb20vUmFwaWRTU0xUTFNEVlJTQU1peGVkU0hBMjU2MjAy
MENBLTEuY3J0MAkGA1UdEwQCMAAwggF9BgorBgEEAdZ5AgQCBIIBbQSCAWkBZwB2
AOg+0No+9QY1MudXKLyJa8kD08vREWvs62nhd31tBr1uAAABftlCiEMAAAQDAEcw
RQIgU5PNDKs44Z5uU7Oa4cp7tqNl5oG/pMCTR7NweZHa6ZwCIQD1kTdOxyGx58vy
Y/1liZClwAIyQWIipEg+WlE2I3DYZgB1ADXPGRu/sWxXvw+tTG1Cy7u2JyAmUeo/
4SrvqAPDO9ZMAAABftlCiE8AAAQDAEYwRAIgUzly3zRmNXnN9wm4u2HN9MN6qc8l
r3UECuV/QaolspMCIAcJcwvH5zvfOr0VTl1cWeRKdyvd7e7sc25UWhwvyvhbAHYA
s3N3B+GEUPhjhtYFqdwRCUp5LbFnDAuH3PADDnk2pZoAAAF+2UKIgwAABAMARzBF
AiBYoLNolLyeygDHkrcFjrze5HeYtEJFZ3epoWdNSINpagIhAKuTRqRSAde7EfpB
0MGEkrG5nn6cSnnTrnYSzr3XBdYcMA0GCSqGSIb3DQEBCwUAA4IBAQB4lqFA1bYo
kEBC0mGycV+UYJsrT03YIHRALRyOeZwGKkEDypIeOJkgtQrz3cKKPbEtBQ5T9Xc2
xpcbc0CpMCsJklyHHKHQJKUycdY1jJomLeXhrb2OEbDdesZXFaSJFiVgZytzd9ia
54DFLrNmXs0KHu8NbFnTtACGdfzjNdjPqe4GPagzu84xw0Oo3iOvrXXLMXJizKlK
hCNUpK9IN3mhx11jlYnUq2SXm+JBlcM8qwJK0DVkJkfVnoiwRjviJjXlJYjw3beD
GDuEVMZ6YPtmbdejtasHZ7MDeZinHlx/7G0DWQ7CDzw/Lo5dhjH1cFL0ApnxzQMs
+d8KdEFjsywZ
-----END CERTIFICATE-----`
    ])
  }
  if (password === login) {
    throw new InvalidPreferencesError('Логин и пароль не могут быть одинаковыми')
  }
  if (password.length < 8) {
    throw new InvalidPreferencesError('Пароль должен быть не менее 8 символов')
  }
  const loginResult = await initiateLoginSequence({
    login,
    password
  }, device)
  const accessToken = loginResult.response.body.access_token
  return {
    login,
    password,
    token: accessToken,
    device: loginResult.device
  }
}

export async function fetchAccounts (auth) {
  const response = await callGate(`https://${host}/SBOLServer/rest/client/contracts`, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + auth.token
    },
    sanitizeRequestLog: { headers: { Authorization: true } },
    device: auth.device
  })
  if (response.body.error === 'invalid_token') {
    throw new AuthError()
  }
  if (response.body.contracts) {
    const moneyBoxes = await fetchListMoneyBox(auth)
    const accounts = response.body.contracts
    await updateBalances(auth, accounts)
    return {
      accounts,
      moneyBoxes
    }
  }
  console.assert(false, 'Error fetching accounts.', response)
}

export async function updateBalances (auth, accounts) {
  await Promise.all(accounts.map(async (account) => {
    if (account.cardList && account.cardList.length > 0) {
      const card = account.cardList[0]
      const response = await callGate(`https://${host}/SBOLServer/rest/client/balance`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + auth.token,
          'Content-Type': 'application/json;charset=UTF-8'
        },
        body: {
          cardExpire: card.yearEnd + '-' + card.monthEnd + '-15',
          cardId: card.cardId,
          currency: +account.currencyCode
        },
        sanitizeRequestLog: { headers: { Authorization: true } }, // , body: { cardExpire: true, cardId: true, currency: true } },
        device: auth.device,
        stringify: JSON.stringify
      })
      console.assert(response.body.errorInfo && response.body.errorInfo.errorCode === '0', 'Error while getting actual balance for account', account)
      updateAccountBalance(account, response)
    }
  })
  )
}

export function updateAccountBalance (account, response) {
  account.amount = response.body.amount
  account.overdraftLimit = response.body.overdraft
}

export async function fetchTransactions (auth, products, fromDate, toDate, contractNumber = []) {
  const transactions = []
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      Authorization: 'Bearer ' + auth.token
    },
    sanitizeRequestLog: { headers: { Authorization: true } },
    device: auth.device,
    stringify: JSON.stringify
  }
  let response
  await Promise.all(products.map(async (product) => {
    response = await callGate(`https://${host}/SBOLServer/rest/client/holdEvents`, {
      ...options,
      body: {
        cardId: product.id
      }
    })
    if (response.body.error === 'invalid_token') {
      throw new AuthError()
    }
    if (response.body.event) {
      transactions.push(...response.body.event)
    }
  }))

  response = await callGate(`https://${host}/SBOLServer/rest/client/events`, {
    ...options,
    body: {
      contractNumber,
      endDate: toISODateString(toDate),
      startDate: toISODateString(fromDate)
    }
  })
  if (response.body.error === 'invalid_token') {
    throw new AuthError()
  }
  if (response.body.event) {
    transactions.push(...response.body.event)
    return transactions
  }
  console.assert(false, 'Error fetching transactions,', response)
}
