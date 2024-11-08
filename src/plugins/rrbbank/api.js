import { flatMap, sortBy } from 'lodash'
import { createDateIntervals as commonCreateDateIntervals } from '../../common/dateUtils'
import { fetchJson } from '../../common/network'
import { generateRandomString } from '../../common/utils'
import { card, deposit } from './converters'

const baseUrl = 'https://ibank.rrb.by/services/v2/'

export function generateDeviceID () { return generateRandomString(16) }

async function fetchApiJson (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  const response = await fetchJson(baseUrl + url, options)
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

export async function login (login, password) {
  if (ZenMoney.trustCertificates) {
    ZenMoney.trustCertificates([
      `-----BEGIN CERTIFICATE-----
MIIHODCCBiCgAwIBAgIMSYYg2BFzIz87GGB2MA0GCSqGSIb3DQEBCwUAMEwxCzAJ
BgNVBAYTAkJFMRkwFwYDVQQKExBHbG9iYWxTaWduIG52LXNhMSIwIAYDVQQDExlB
bHBoYVNTTCBDQSAtIFNIQTI1NiAtIEc0MB4XDTIzMTIyMDExMDEwOVoXDTI1MDEy
MDExMDEwOFowEzERMA8GA1UEAwwIKi5ycmIuYnkwggIiMA0GCSqGSIb3DQEBAQUA
A4ICDwAwggIKAoICAQDHQRmDoK8mprUlK4O1yV+6NkN/Q03INaf2C+obWTpP2ghT
k6TJRwj3WG6CNscn4/7AX080jVlgsvf5M4Lt9GEqDNHIsbq5Q/+3k0wI2Yt2KN/S
+OW3b3mDKnFJFYEyze+/aKLEOmtybnlk5ax4Dthqzlom/aseSUuH2BVw0SEp0j5H
TL2cT3lxyv1HIZfk1rQCnGEVIgvoOGSclhM7HdbfkuGUNzc0op+9r6X2J+qtM6Az
+YdGVivH1k7eIKOW1j77PhZAj1+zKiK1LbeXczTXXsYwFR40hifjdUBrBBk8qECp
4QVHkLG/HSxcBsGZZ+W0B465a0DTf4ZoeHmvF/CTsY5kcQBxoarhWZfX8CcKv+Ee
G0dsquELuhfOY/XUk4XDr1qRsR7aNqa28IVwrO/yadC55qB8x2+RjdilbJldObxy
XfRLCoPJxowyZwlxu6C/Fy17kZY81HPCGSjbyDbpzTYxuoJfaxos0ewrhEbyjD4H
LhNEyEtqQr3grQXNvWOYyZ+Tb0KujFqmFV6AtmW0VVMykjIXi12QjqT67GO9MTWm
LWrJrNTDNdi+MSrZbz6Fcs8hJr7lRmzKnvKvqn0ATQEVlN667DGNEqfYJm+3+Vg4
sZq0GwI9Uu4/zVUvCxSWSLfBU4GoD1JoQ5r19tGE1BrHAmyY6KY/jEA09ctXAQID
AQABo4IDUTCCA00wDgYDVR0PAQH/BAQDAgWgMAwGA1UdEwEB/wQCMAAwgZMGCCsG
AQUFBwEBBIGGMIGDMEYGCCsGAQUFBzAChjpodHRwOi8vc2VjdXJlLmdsb2JhbHNp
Z24uY29tL2NhY2VydC9hbHBoYXNzbGNhc2hhMjU2ZzQuY3J0MDkGCCsGAQUFBzAB
hi1odHRwOi8vb2NzcC5nbG9iYWxzaWduLmNvbS9hbHBoYXNzbGNhc2hhMjU2ZzQw
VwYDVR0gBFAwTjAIBgZngQwBAgEwQgYKKwYBBAGgMgoBAzA0MDIGCCsGAQUFBwIB
FiZodHRwczovL3d3dy5nbG9iYWxzaWduLmNvbS9yZXBvc2l0b3J5LzBBBgNVHR8E
OjA4MDagNKAyhjBodHRwOi8vY3JsLmdsb2JhbHNpZ24uY29tL2FscGhhc3NsY2Fz
aGEyNTZnNC5jcmwwGwYDVR0RBBQwEoIIKi5ycmIuYnmCBnJyYi5ieTAdBgNVHSUE
FjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwHwYDVR0jBBgwFoAUT8usqMLvq92Db2u/
zpg9XFgldhUwHQYDVR0OBBYEFB0Vi+soxWRjRy+yx6l5kCaJenByMIIBfQYKKwYB
BAHWeQIEAgSCAW0EggFpAWcAdwCi4wrkRe+9rZt+OO1HZ3dT14JbhJTXK14bLMS5
UKRH5wAAAYyG4vhTAAAEAwBIMEYCIQCcz+n7uxlgJXPdP51L24rSCvr1Vc+/TGl6
AD/1xDiZOgIhAJkNsPkQ6gd7lIHZtlFFyK+yLkBCBkW2IcNqDPRIT47uAHUA5tIx
Y0B3jMEQQQbXcbnOwdJA9paEhvu6hzId/R43jlAAAAGMhuL4UgAABAMARjBEAiBS
WRA1IDeEIVMVnG0LTmtlGgjLFYF2p03PqWOqDWMFFQIgI9CAolS04i9Z5+0X4RTA
zagk6GIjU0FEV7FglJLBO9YAdQBOdaMnXJoQwzhbbNTfP1LrHfDgjhuNacCx+mSx
Ypo53wAAAYyG4vgjAAAEAwBGMEQCIH+3dQaF0pWdPCylTIxaH+eopZWALlAlYZpA
saAj5M+eAiAIUoZP9xjMXqsthHHtoW+pSK3Y7GOC9qF+ien6ZzXaRDANBgkqhkiG
9w0BAQsFAAOCAQEAAUONhZL2VOvIssI0dKpnEdKBSxMlCr0+r5y5S5sHzMUgNTP7
ppyNo+biL667rKbks1R2PnWeIRb02ZJ1OppB7KOU6xg1g0KQzamawX5WWesr2sng
foUdNhV7mvZ/Y+GUNEic3Xmfrm0ezkYRYX0MxEzAoG8jeQRTdCLrVR6Dwgp9rAFZ
2m/Ck6J0GvPHDxKs3nVOK0f6ArboyY4b4vMmZsvG8pY21rpWYsU9NfN3EgNwl2MG
VjRcd5dSXDRC7yJlS1NA/5JxDjkzsR+6/ropcd3n94ARC7SNCqqp9VU+j/nRqkLS
I22nXcfivqzUU05yc/jg14s2elRbhTYsx/0//w==
-----END CERTIFICATE-----`
    ])
  }

  const deviceID = ZenMoney.getData('device_id') ? ZenMoney.getData('device_id') : generateDeviceID()
  ZenMoney.setData('device_id', deviceID)

  const res = await fetchApiJson('session/login', {
    method: 'POST',
    body: {
      applicID: '1',
      clientKind: '5',
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
  if (products.cardAccount) {
    cards = cards.concat(products.cardAccount)
  }
  if (products.corpoCardAccount) {
    cards = cards.concat(products.corpoCardAccount)
  }
  if (products.currentAccount) {
    cards = cards.concat(products.currentAccount)
  }
  return {
    cards,
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
          url = 'products/getFullStatementFromProcessing'
          accountType = '1'
          break
        case deposit:
          url = 'products/getDepositAccountStatement'
          accountType = '0'
          break
        default:
          return null
      }
      return fetchApiJson(url, {
        method: 'POST',
        headers: { session_token: token },
        body: {
          accountType,
          cardHash: account.cardHash,
          currencyCode: account.currencyCode,
          internalAccountId: account.id,
          reportData: {
            from: dates[0].getTime(),
            till: dates[1].getTime()
          }
        }
      }, response => {
        if (response.body.operations) {
          response.body.operations = response.body.operations.map(x => { return { accountNumber: account.id, ...x } })
        }
        return response.body
      })
    })
  }))
  const operations = flatMap(responses, response => {
    return flatMap(response.body.operations, d => d)
  })

  const filteredOperations = sortBy(operations.filter(function (op) {
    return op.transactionDate > fromDate && op.operationAmount !== 0
  }), 'operationDate')

  console.log(`>>> Загружено ${filteredOperations.length} операций.`)
  return filteredOperations
}
