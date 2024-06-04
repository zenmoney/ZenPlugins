import { flatMap } from 'lodash'
import { createDateIntervals as commonCreateDateIntervals } from '../../common/dateUtils'
import { fetchJson } from '../../common/network'
import { generateRandomString } from '../../common/utils'
import { card, deposit, checking } from './converters'

const BASE_URL = 'https://mb.bnb.by/services/v2/'
const APP_VERSION = '1.53.1'

export function generateDeviceID () {
  return generateRandomString(16)
}

async function fetchApiJson (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  const response = await fetchJson(BASE_URL + url, options)
  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }

  if (response.body && response.body.errorInfo && response.body.errorInfo.error !== '0' && response.body.errorInfo.errorText) {
    const errorDescription = response.body.errorInfo.errorText
    const errorMessage = 'Ответ банка: ' + errorDescription
    if (errorDescription.indexOf('Некорректно введен логин или пароль') >= 0) {
      throw new InvalidPreferencesError(errorMessage)
    }
    throw new TemporaryError(errorMessage)
  }

  return response
}

function validateResponse (response, predicate, error) {
  if (!predicate || !predicate(response)) {
    error('non-successful response')
  }
}

export async function login (phone, password) {
  if (ZenMoney.trustCertificates) {
    ZenMoney.trustCertificates([
      `-----BEGIN CERTIFICATE-----
MIIGNzCCBR+gAwIBAgIMDIP82kEtgeH+7zKiMA0GCSqGSIb3DQEBCwUAMEwxCzAJ
BgNVBAYTAkJFMRkwFwYDVQQKExBHbG9iYWxTaWduIG52LXNhMSIwIAYDVQQDExlB
bHBoYVNTTCBDQSAtIFNIQTI1NiAtIEc0MB4XDTIzMDYwNTEwMDczMVoXDTI0MDcw
NjEwMDczMFowEzERMA8GA1UEAwwIKi5ibmIuYnkwggEiMA0GCSqGSIb3DQEBAQUA
A4IBDwAwggEKAoIBAQDPM3/YX0sPYaLUZsnOci6POa+VP/3jkorC977rZCEk9XI4
dfHbXoidVEOSD9ygnIcAaGW5kWp+QwGUz4la0U9Z4D7IotVg/R8bQCupOV6aOpJx
kA+LGl9VaRsxDiI1a5DLcS9jv2pi+XiPGbgpSwuH3zpvhsQTc2NjyaS4goGWjTH0
yPG/OEtpusWogiMV9r8qafJDWJcU2X+LLz9ifLNtp/VOeTYj4rIXvjvRCa1FqX1y
KRONpgoBrPnrXvkuhsVIK+vr+F54yuTF+9cxhmXnbRFtsUE+5hFN6xqVfEkal+4I
rBwux5zsKkBMAUIxcIyT9kiuBnZ6FKacWWb2rlnZAgMBAAGjggNQMIIDTDAOBgNV
HQ8BAf8EBAMCBaAwgZMGCCsGAQUFBwEBBIGGMIGDMEYGCCsGAQUFBzAChjpodHRw
Oi8vc2VjdXJlLmdsb2JhbHNpZ24uY29tL2NhY2VydC9hbHBoYXNzbGNhc2hhMjU2
ZzQuY3J0MDkGCCsGAQUFBzABhi1odHRwOi8vb2NzcC5nbG9iYWxzaWduLmNvbS9h
bHBoYXNzbGNhc2hhMjU2ZzQwVwYDVR0gBFAwTjAIBgZngQwBAgEwQgYKKwYBBAGg
MgoBAzA0MDIGCCsGAQUFBwIBFiZodHRwczovL3d3dy5nbG9iYWxzaWduLmNvbS9y
ZXBvc2l0b3J5LzAJBgNVHRMEAjAAMEEGA1UdHwQ6MDgwNqA0oDKGMGh0dHA6Ly9j
cmwuZ2xvYmFsc2lnbi5jb20vYWxwaGFzc2xjYXNoYTI1Nmc0LmNybDAbBgNVHREE
FDASgggqLmJuYi5ieYIGYm5iLmJ5MB0GA1UdJQQWMBQGCCsGAQUFBwMBBggrBgEF
BQcDAjAfBgNVHSMEGDAWgBRPy6yowu+r3YNva7/OmD1cWCV2FTAdBgNVHQ4EFgQU
Am5xfUxljla7HefOKdrBeGnGH/kwggF/BgorBgEEAdZ5AgQCBIIBbwSCAWsBaQB2
AO7N0GTV2xrOxVy3nbTNE6Iyh0Z8vOzew1FIWUZxH7WbAAABiIsGu/QAAAQDAEcw
RQIgZs2ByvgC4RUPbRxtiBM0dEfYPgtiKkiXt7BUrNX9wr0CIQDFPpGjo9p4QlC3
01Lr32QkCwfmFBFP/WI/uGpl8uRY1wB2AEiw42vapkc0D+VqAvqdMOscUgHLVt0s
gdm7v6s52IRzAAABiIsGvAUAAAQDAEcwRQIhAKg3o40qgzmFRVBw7KMuiRDdP1m5
NaCRcZNr+Y84rslEAiBZFboKw0Lj/47gVUhZg6k/sGJQcw1PeYlvaFd+anaWQwB3
ANq2v2s/tbYin5vCu1xr6HCRcWy7UYSFNL2kPTBI1/urAAABiIsGvDIAAAQDAEgw
RgIhAKzLjHls2KyGyWAmssILJtXJzTfPzCrXrp+1Wyjt/xhWAiEAxXvI9aLvJJJi
coyI+RGbm70cdz6mBtSE9X7ikIwqRqEwDQYJKoZIhvcNAQELBQADggEBAIpgVKgM
cMweq+lw/X7/PGf/qpyQkCP0h1w+GCx2Oo7eLY1LIzSr0n8gNMbPhxLVwQbXRpKr
GP5HuF1IpjG0n2PtzwTqW0veLT3Re0af0ho//0k9HyuZ3/7gclI9n7uRafTUKYlj
Xxf3+XmH4WeSAv3sTZUNgV8hy2yAC2nRGpvn7LIo0auAyD6al/7CAxpmSRIJWQrr
vz859BJ4hcKHEZjRj1tYQIlWOWc0PoEn17S/mmOO6/LPLb6ltEmNP1usf+0o0MYa
jVkxkvT5Zf5bWDz+c0CBiRUiUDUgM9dnpV9mxFWlBcD6N7s6faHvYxqLa19oC2e4
HQJpK9udyGXyYGc=
-----END CERTIFICATE-----`
    ])
  }

  let login = (phone || '').trim()
  if (!login) { throw new InvalidPreferencesError('Некорректный логин или номер телефона') }
  if (/\+\d+/.test(login)) {
    login = login.substring(1)
  }

  const deviceID = ZenMoney.getData('device_id') ? ZenMoney.getData('device_id') : generateDeviceID()
  ZenMoney.setData('device_id', deviceID)

  const res = await fetchApiJson('session/login', {
    method: 'POST',
    body: {
      applicID: APP_VERSION,
      clientKind: '0',
      browser: ZenMoney.device.manufacturer, // Build.DEVICE
      browserVersion: `${ZenMoney.device.model} (${ZenMoney.device.manufacturer})`, // Build.MODEL + " (" + Build.PRODUCT + ")"
      platform: 'Android',
      platformVersion: '10',
      agreement: true,
      deviceUDID: deviceID,
      login,
      password
    },
    sanitizeRequestLog: { body: { login: true, password: true } }
  }, response => response.success, message => new InvalidPreferencesError('Неверный логин или пароль'))

  return res.body.sessionToken
}

export async function fetchAccounts (token) {
  console.log('>>> Загрузка списка счетов...')
  const products = (await fetchApiJson('products/getUserAccountsOverview', {
    method: 'POST',
    body: {
      cardAccount: {
        withBalance: null
      },
      corpoCardAccount: {
        withBalance: null
      },
      creditAccount: {},
      currentAccount: {
        withBalance: null
      },
      depositAccount: {}
    },
    headers: { session_token: token }
  }, response => response.body && response.body.overviewResponse && (response.body.overviewResponse.cardAccount || response.body.overviewResponse.depositAccount || response.body.overviewResponse.currentAccount), message => new TemporaryError(message))).body.overviewResponse

  let cards = []
  let checkingAccounts = []
  if (products.cardAccount) {
    cards = cards.concat(products.cardAccount)
  }
  if (products.corpoCardAccount) {
    cards = cards.concat(products.corpoCardAccount)
  }
  if (products.currentAccount) {
    checkingAccounts = [...products.currentAccount]
  }
  return {
    cards,
    checkingAccounts,
    deposits: products.depositAccount
  }
}

export function createDateIntervals (fromDate, toDate) {
  const interval = 10 * 24 * 60 * 60 * 1000 // 10 days interval for fetching data
  const gapMs = 1000
  return commonCreateDateIntervals({
    fromDate,
    toDate,
    addIntervalToDate: date => new Date(date.getTime() + interval - gapMs),
    gapMs
  })
}

export async function fetchTransactions (token, accounts, fromDate, toDate = new Date()) {
  console.log('>>> Загрузка списка транзакций...')
  toDate = toDate || new Date()

  const dates = createDateIntervals(fromDate, toDate)
  const responses = await Promise.all(flatMap(accounts, (account) => {
    return dates.map(dates => {
      let url = ''
      let accountType = ''
      switch (account.type) {
        case card:
          url = 'products/getCardAccountFullStatement'
          accountType = '1'
          break
        case deposit:
          url = 'products/getDepositAccountStatement'
          accountType = '0'
          break
        case checking:
          url = 'products/getCurrentAccountStatement'
          accountType = '5'
          break
        default:
          return null
      }
      return fetchApiJson(url, {
        method: 'POST',
        headers: { session_token: token },
        body: {
          accountType,
          bankCode: '288',
          currencyCode: account.currencyCode,
          internalAccountId: account.id,
          reportData: {
            from: dates[0].getTime(),
            till: dates[1].getTime()
          },
          rkcCode: account.rkcCode
        }
      }, response => response.body)
    })
  }))
  const operations = flatMap(responses, response => {
    return flatMap(response.body.operations, d => d)
  })

  const filteredOperations = operations.filter(function (op) {
    return op.transactionDate > fromDate
  })

  console.log(`>>> Загружено ${filteredOperations.length} операций.`)
  return filteredOperations
}

export async function fetchLastCardTransactions (token, account) {
  console.log('>>> Загрузка списка последних транзакций для карты ' + account.title)

  const response = await fetchApiJson('products/getBlockedAmountStatement', {
    method: 'POST',
    headers: { session_token: token },
    body: {
      cards: [
        account.cardHash
      ],
      internalAccountId: account.id
    }
  }, response => response.body)
  const operations = response.body.operations ? response.body.operations : []
  for (let i = 0; i < operations.length; i++) {
    operations[i].accountNumber = account.syncID[0]
  }

  console.log(`>>> Загружено ${operations.length} операций.`)
  return operations
}
