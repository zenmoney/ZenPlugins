import { flatMap } from 'lodash'
import { createDateIntervals as commonCreateDateIntervals } from '../../common/dateUtils'
import { fetchJson } from '../../common/network'
import { generateRandomString } from '../../common/utils'
import { card, deposit, checking } from './converters'
import { TemporaryError } from '../../errors'

const BASE_URL = 'https://mb.bnb.by/services/v2/'
const APP_VERSION = '1.56.1'

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
    if (errorDescription.indexOf('Для авторизации на устройстве необходимо ввести код, отправленный на доверенное устройство') >= 0) {
      return response
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
  if (typeof ZenMoney.trustCertificates === 'function') {
    ZenMoney.trustCertificates([
      `-----BEGIN CERTIFICATE-----
MIIGSTCCBTGgAwIBAgIMdSTTalkelmYt8TryMA0GCSqGSIb3DQEBCwUAMFUxCzAJ
BgNVBAYTAkJFMRkwFwYDVQQKExBHbG9iYWxTaWduIG52LXNhMSswKQYDVQQDEyJH
bG9iYWxTaWduIEdDQyBSNiBBbHBoYVNTTCBDQSAyMDIzMB4XDTI1MDUxNjA2NTUz
MVoXDTI2MDYxNzA2NTUzMFowEzERMA8GA1UEAwwIKi5ibmIuYnkwggEiMA0GCSqG
SIb3DQEBAQUAA4IBDwAwggEKAoIBAQDPM3/YX0sPYaLUZsnOci6POa+VP/3jkorC
977rZCEk9XI4dfHbXoidVEOSD9ygnIcAaGW5kWp+QwGUz4la0U9Z4D7IotVg/R8b
QCupOV6aOpJxkA+LGl9VaRsxDiI1a5DLcS9jv2pi+XiPGbgpSwuH3zpvhsQTc2Nj
yaS4goGWjTH0yPG/OEtpusWogiMV9r8qafJDWJcU2X+LLz9ifLNtp/VOeTYj4rIX
vjvRCa1FqX1yKRONpgoBrPnrXvkuhsVIK+vr+F54yuTF+9cxhmXnbRFtsUE+5hFN
6xqVfEkal+4IrBwux5zsKkBMAUIxcIyT9kiuBnZ6FKacWWb2rlnZAgMBAAGjggNZ
MIIDVTAOBgNVHQ8BAf8EBAMCBaAwDAYDVR0TAQH/BAIwADCBmQYIKwYBBQUHAQEE
gYwwgYkwSQYIKwYBBQUHMAKGPWh0dHA6Ly9zZWN1cmUuZ2xvYmFsc2lnbi5jb20v
Y2FjZXJ0L2dzZ2NjcjZhbHBoYXNzbGNhMjAyMy5jcnQwPAYIKwYBBQUHMAGGMGh0
dHA6Ly9vY3NwLmdsb2JhbHNpZ24uY29tL2dzZ2NjcjZhbHBoYXNzbGNhMjAyMzBX
BgNVHSAEUDBOMAgGBmeBDAECATBCBgorBgEEAaAyCgEDMDQwMgYIKwYBBQUHAgEW
Jmh0dHBzOi8vd3d3Lmdsb2JhbHNpZ24uY29tL3JlcG9zaXRvcnkvMEQGA1UdHwQ9
MDswOaA3oDWGM2h0dHA6Ly9jcmwuZ2xvYmFsc2lnbi5jb20vZ3NnY2NyNmFscGhh
c3NsY2EyMDIzLmNybDAbBgNVHREEFDASgggqLmJuYi5ieYIGYm5iLmJ5MB0GA1Ud
JQQWMBQGCCsGAQUFBwMBBggrBgEFBQcDAjAfBgNVHSMEGDAWgBS9BbfzipM8c8t5
+g+FEqF3lhiRdDAdBgNVHQ4EFgQUAm5xfUxljla7HefOKdrBeGnGH/kwggF8Bgor
BgEEAdZ5AgQCBIIBbASCAWgBZgB1AGQRxGykEuyniRyiAi4AvKtPKAfUHjUnq+r+
1QPJfc3wAAABltfgecIAAAQDAEYwRAIgXluD26yEOIP3BOZE3npInFtbOgQAoPsG
Nrpe6xfic/kCICuvOfQZJy3dNemtjW0Vhleocrrkk+bMMYglesSNcUlFAHYAyzj3
FYl8hKFEX1vB3fvJbvKaWc1HCmkFhbDLFMMUWOcAAAGW1+B4WAAABAMARzBFAiEA
8/Rc5cR/3Oi+vEGQPMVGzp63XEXmtx4iWIpN76iHlo4CIGiAzeTE/zhMwlIi4Pag
yeawv0g7bzMBzin8A41zFvzGAHUASZybad4dfOz8Nt7Nh2SmuFuvCoeAGdFVUvvp
6ynd+MMAAAGW1+B58wAABAMARjBEAiAHcgmp92tQC0+ceZKgr1EZbZt5MhSoo8lj
JHoNq4/P/QIgTbHF18gVGfyYlNcLJf2msPzVu0OvHCf/QsuCD0kxMV4wDQYJKoZI
hvcNAQELBQADggEBAICzH136Tzh1BrZq73Dghh0xk0PUk+7YOHntuiiE24ZfZpXx
uvG2htXQo2UQD7qYOsg6CcPL+//ZsdrVe8dHcX7uxI30PDxwZ44KMplIKUR+VhZV
usARc/Gmja10Iw2zQ7macNzXig9WzFKVmgZS8WyQ9lHmdhyYHBoUMQpi9yr6d/B6
Ios1mr50fiZqyWn6nQxVY86QKb4R8Mrewl4+ClCV19VB6k+f6Jo8+Bylmm0awcCw
tja9AP434+ezEwx2DIyZ3NpRBYT/f/qgyNENE5jSIS2mtqIGeRVH7peZfclfzPdo
2y75S/O0e2tuBMBVLuEJMrPoKbV6rSApHfqoCa4=
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
  }, response => response.success || (response.body.errorInfo && response.body.errorInfo.error === '10027'), message => new TemporaryError(message))

  if (res.body.errorInfo && res.body.errorInfo.error === '10027') {
    // SMS-code confirmation needed
    const smsCode = await ZenMoney.readLine('Подтвердите вход из приложения BNB Bank, после чего введите код из СМС', {
      time: 30000
    })
    if (!smsCode) {
      throw new TemporaryError('No SMS Code received')
    }
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
        password,
        confirmationData: smsCode
      },
      sanitizeRequestLog: { body: { login: true, password: true } }
    }, response => response.success, message => new TemporaryError(message))
    return res.body.sessionToken
  }

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

  const response = await fetchApiJson('products/getCardTransactions', {
    method: 'POST',
    headers: { session_token: token },
    body: {
      cards: [
        account.cardHash
      ],
      reportData: {
        from: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).getTime(),
        till: new Date().getTime()
      },
      internalAccountId: account.id
    }
  }, response => response.body)
  const transactions = response.body.transactions || []
  const operations = flatMap(transactions, t => t.operations || [])
  for (let i = 0; i < operations.length; i++) {
    operations[i].accountNumber = account.syncID[0]
  }

  console.log(`>>> Загружено ${operations.length} операций.`)
  return operations
}
