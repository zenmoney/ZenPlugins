import KSUID from 'ksuid'
import { stringify } from 'querystring'
import { fetchJson, ParseError } from '../../common/network'
import { generateRandomString } from '../../common/utils'
import { InvalidOtpCodeError, TemporaryUnavailableError } from '../../errors'
import config from './config.json'

export function generateDevice () {
  return {
    id: KSUID.randomSync().string
  }
}

function replaceCyrillicLettersIfPossible (str) {
  const mapping = {
    А: 'A',
    а: 'a',
    В: 'B',
    Е: 'E',
    е: 'e',
    К: 'K',
    М: 'M',
    Н: 'H',
    О: 'O',
    о: 'o',
    Р: 'P',
    р: 'p',
    С: 'C',
    с: 'c',
    Т: 'T',
    Х: 'X',
    х: 'x'
  }
  return str.split('').map(c => mapping[c] || c).join('')
}

export async function login ({ passportNumber, isResident, issueDate }, device, auth) {
  if (ZenMoney.trustCertificates) {
    ZenMoney.trustCertificates([
      `-----BEGIN CERTIFICATE-----
MIIGZDCCBUygAwIBAgIMRxUg09oaU1CwVnmsMA0GCSqGSIb3DQEBCwUAMFAxCzAJ
BgNVBAYTAkJFMRkwFwYDVQQKExBHbG9iYWxTaWduIG52LXNhMSYwJAYDVQQDEx1H
bG9iYWxTaWduIFJTQSBPViBTU0wgQ0EgMjAxODAeFw0yMjA1MDUxMTA1MzJaFw0y
MzA2MDYxMTA1MzFaMGsxCzAJBgNVBAYTAkJZMQ4wDAYDVQQIEwVNaW5zazEOMAwG
A1UEBxMFTWluc2sxCzAJBgNVBAsTAklUMRcwFQYDVQQKEw5DSlNDIEFsZmEtQmFu
azEWMBQGA1UEAwwNKi5hbGZhYmFuay5ieTCCASIwDQYJKoZIhvcNAQEBBQADggEP
ADCCAQoCggEBAMfssxzXIf6NK9gu4jvKbNr+4XjmUsQ76xL0URk4MyaNnqMWxjfq
r363R6UB+hHHdaKpnbc3Yz+4poHTXJLAUECiNnyYpjLvIInnO/vspmAbpF/5xXe2
pNF5Pjq4tAuhtsZWSp2ASrUspmUsmPMiKlwnTxb3uEVm/OB+uDWhd9DwJ6YHIOVt
km7oxfcklQFdZrNCNKuS+c0Nqv6Z+fQU6BVKhtiDdP/uASUSnXq6Mp7LcSR3aXb4
lGLMSGJ1GiEkSn016LT9RcEjtjjD9dHWFVZrqYwsRojgKG7yNZ3vZ99o0k4vlsAC
WQu3r0tM18S0vTsfCrOvB7BiNOF168SCuH8CAwEAAaOCAyEwggMdMA4GA1UdDwEB
/wQEAwIFoDCBjgYIKwYBBQUHAQEEgYEwfzBEBggrBgEFBQcwAoY4aHR0cDovL3Nl
Y3VyZS5nbG9iYWxzaWduLmNvbS9jYWNlcnQvZ3Nyc2FvdnNzbGNhMjAxOC5jcnQw
NwYIKwYBBQUHMAGGK2h0dHA6Ly9vY3NwLmdsb2JhbHNpZ24uY29tL2dzcnNhb3Zz
c2xjYTIwMTgwVgYDVR0gBE8wTTBBBgkrBgEEAaAyARQwNDAyBggrBgEFBQcCARYm
aHR0cHM6Ly93d3cuZ2xvYmFsc2lnbi5jb20vcmVwb3NpdG9yeS8wCAYGZ4EMAQIC
MAkGA1UdEwQCMAAwNgYDVR0RBC8wLYINKi5hbGZhYmFuay5ieYIPd3d3LmFsZmFi
YW5rLmJ5ggthbGZhYmFuay5ieTAdBgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUH
AwIwHwYDVR0jBBgwFoAU+O9/8s14Z6jeb48kjYjxhwMCs+swHQYDVR0OBBYEFDLk
AbFsTDD6MOrfBGyCxtgq360EMIIBfgYKKwYBBAHWeQIEAgSCAW4EggFqAWgAdgDo
PtDaPvUGNTLnVyi8iWvJA9PL0RFr7Otp4Xd9bQa9bgAAAYCT5YeGAAAEAwBHMEUC
IB2FYW0KykrHgLRcgciGQeLeMajBtGHDhkZ4iasL9s2UAiEA5H5eS3r2qtDwSeRU
u7Y87vPPboY6rPalmweaP6y3dKcAdgBvU3asMfAxGdiZAKRRFf93FRwR2QLBACkG
jbIImjfZEwAAAYCT5YW5AAAEAwBHMEUCIBlSBW2uQZsQToSAqIuy3Hjo0PZiUJ7R
ZxpPYFVQYiJcAiEA8QNKP4rHIo16b4Me0OP+gnTnmP2flSjXm9Lz+wh644MAdgBV
gdTCFpA2AUrqC5tXPFPwwOQ4eHAlCBcvo6odBxPTDAAAAYCT5YbFAAAEAwBHMEUC
IApAbvYWDYUjBGXLFj5boS55Y9SBPIEqGY7UnSyLBYANAiEAvpf8J1BLJQ5xF+Uj
sNSrS1AZaRnX2P+Xlq5N3J09u8owDQYJKoZIhvcNAQELBQADggEBAKVesim8aM2a
FYjQqhT0BG7inFT2GMyPwdfxQT48w4k0J590+b4KHqq2YDna77m+lIHORoOx5W2X
bGn2v+p0D372byoLSdw28ajmfhn8VV7ffHgRbDHTQynhVHlkp6PZ2+IkMB8irwOz
npUUL4xijSAEcR3embdhLVJMXxPdc4Xe2tYqoqgj/yCzwQYyNwGx45/1OFXwViSu
QQpTDVL+DICGdb4vvYH7mF+j8GGZYaBT8SAu+/Tcr1Yk+5CRZv1I5EudvUoK0As9
QIoYqW0Ai1787c1cDzDwhndCe8MKeKlnrwxnA1L2UdVWOHG4i6balXYMQkHomtiA
EeavOtbXPVE=
-----END CERTIFICATE-----`
    ])
  }

  if (auth && auth.login && auth.password) {
    auth = await getToken(auth)
    if (auth) {
      return auth
    }
  }
  passportNumber = replaceCyrillicLettersIfPossible(passportNumber)
  // если вход по личному номеру, дату не передаём
  if (issueDate && !/\d{7}[A-Z]\d{3}[A-Z]{2}\d/i.test(passportNumber)) {
    const match = issueDate.match(/^(\d{4})(\d{2})(\d{2})$/)
    const date = match ? new Date(`${match[1]}-${match[2]}-${match[3]}`) : new Date(NaN)
    if (isNaN(date.getTime())) {
      throw new InvalidPreferencesError('Неверная дата выдачи паспорта. Формат: ГГГГММДД. Пример: 20190422')
    }
    issueDate = `${match[1]}-${match[2]}-${match[3]}`
  } else {
    issueDate = null
  }
  // если вход по номеру паспорта, удаляем лидирующие буквы (важно для паспорта резидента страны)
  if (issueDate) {
    const shortPassNum = /^\D{2}(\d{7})$/.exec(passportNumber)
    if (shortPassNum) {
      passportNumber = shortPassNum[1]
    }
  }
  let response = await fetchJson('https://developerhub.alfabank.by:8273/individual/1.0.0/registration/registration', {
    method: 'POST',
    headers: {
      Host: 'developerhub.alfabank.by:8273'
    },
    body: issueDate
      ? {
          documentNum: passportNumber,
          issueDate,
          deviceId: device.id,
          isResident: false
        }
      : {
          personId: passportNumber,
          deviceId: device.id,
          isResident: isResident !== 'false'
        },
    sanitizeRequestLog: { body: { personId: true } }
  })
  if (response.status === 400 || response.status === 401) {
    throw new InvalidPreferencesError('Неверный номер паспорта. Повторите подключение синхронизации.')
  }
  console.assert(response.body.message && response.body.message.indexOf('смс с кодом подтверждения выслано пользователю') >= 0, 'unexpected login step', response)

  const code = await ZenMoney.readLine('Введите код из SMS')
  auth = {
    login: generateRandomString(20, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ-_0123456789'),
    password: generateRandomString(8) + generateRandomString(7, '!@#$%^*()-_=+[]{};:/?”.')
  }
  response = await fetchJson('https://developerhub.alfabank.by:8273/individual/1.0.0/registration/confirmRegistration', {
    method: 'POST',
    headers: {
      Host: 'developerhub.alfabank.by:8273'
    },
    body: {
      sms: code,
      login: auth.login,
      password: auth.password,
      deviceId: device.id,
      approve: true
    },
    sanitizeRequestLog: { body: { login: true, password: true } }
  })
  if (response.status === 400) {
    throw new InvalidOtpCodeError()
  }
  console.assert(response.status === 200, 'unexpected confirmRegistration response', response)

  return getToken(auth)
}

async function getToken ({ login, password }) {
  let response = null
  try {
    response = await fetchJson('https://developerhub.alfabank.by:8273/token', {
      method: 'POST',
      headers: {
        Host: 'developerhub.alfabank.by:8273',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: {
        grant_type: 'password',
        username: login,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        password,
        scope: 'accounts_individual',
        source: 'individual'
      },
      stringify,
      sanitizeRequestLog: { body: { username: true, client_id: true, client_secret: true, password: true } },
      sanitizeResponseLog: { body: { access_token: true, refresh_token: true } }
    })
  } catch (e) {
    if (e instanceof ParseError && response?.status === 500 && response?.body?.indexOf('Runtime Error') > 0) {
      throw new TemporaryUnavailableError()
    }
    throw e
  }
  if (response.status === 500 && response.body.error === 'server_error') {
    throw new TemporaryUnavailableError()
  }
  console.assert(response.body.access_token, 'unexpected token response', response)
  return {
    login,
    password,
    accessToken: response.body.access_token
  }
}

export async function fetchAccounts ({ accessToken }) {
  const accounts = []
  await Promise.all(['account', 'deposit', 'card', 'credit'].map(async type => {
    const response = await fetchJson(`https://developerhub.alfabank.by:8273/individual/1.0.0/accounts/products?type=${type}`, {
      method: 'GET',
      headers: {
        Host: 'developerhub.alfabank.by:8273',
        Authorization: `Bearer ${accessToken}`
      },
      sanitizeRequestLog: { headers: { Authorization: true } }
    })
    console.assert(Array.isArray(response.body.items), 'unexpected accounts response', response)
    accounts.push(...response.body.items)
  }))
  return accounts
}

function formatDate (date) {
  return date.toISOString().substring(0, 19)
}

export async function fetchTransactions ({ accessToken }, { id }, fromDate, toDate) {
  const limit = 50
  const transactions = []
  let i = 0
  let response
  do {
    i++
    const query = {
      pageNo: i,
      pageRowCount: limit,
      dateFrom: formatDate(fromDate),
      objectId: id
    }
    response = await fetchJson(`https://developerhub.alfabank.by:8273/individual/1.0.0/accounts/statement?${stringify(query)}`, {
      method: 'GET',
      headers: {
        Host: 'developerhub.alfabank.by:8273',
        Authorization: `Bearer ${accessToken}`
      },
      sanitizeRequestLog: { headers: { Authorization: true } }
    })
    console.assert(Array.isArray(response.body.items), 'unexpected transactions response', response)
    transactions.push(...response.body.items)
  } while (response.body.items.length >= limit)
  return transactions
}
