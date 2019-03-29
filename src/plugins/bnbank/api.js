import { fetchJson } from '../../common/network'
import { flatMap } from 'lodash'
import { generateRandomString } from '../../common/utils'
import { deposit, card } from './converters'

const baseUrl = 'https://mb.bnb.by/services/v2/'

export function generateDeviceID () {
  return generateRandomString(16)
}

async function fetchApiJson (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  const response = await fetchJson(baseUrl + url, options)
  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }

  if (response.body.errorInfo.error !== '0' && response.body.errorInfo.errorText) {
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
  const deviceID = ZenMoney.getData('device_id') ? ZenMoney.getData('device_id') : generateDeviceID()
  ZenMoney.setData('device_id', deviceID)

  const res = await fetchApiJson('session/login', {
    method: 'POST',
    body: {
      applicID: '1.6',
      clientKind: '0',
      deviceUDID: deviceID,
      login: login,
      password: password
    }
  }, response => response.success, message => new InvalidPreferencesError('Неверный логин или пароль'))

  return res.body.sessionToken
}

export async function fetchAccounts (token) {
  console.log('>>> Загрузка списка счетов...')
  const products = (await fetchApiJson('products/getUserAccountsOverview', {
    method: 'POST',
    headers: { 'session_token': token } }, response => response.body && response.body.overviewResponse && (response.body.overviewResponse.cardAccount || response.body.overviewResponse.depositAccount), message => new TemporaryError(message))).body.overviewResponse

  return {
    cards: products.cardAccount,
    deposits: products.depositAccount
  }
}

export function createDateIntervals (fromDate, toDate) {
  const interval = 10 * 24 * 60 * 60 * 1000 // 10 days interval for fetching data
  const dates = []

  let time = fromDate.getTime()
  let prevTime = null
  while (time < toDate.getTime()) {
    if (prevTime !== null) {
      dates.push([new Date(prevTime), new Date(time - 1)])
    }

    prevTime = time
    time = time + interval
  }
  dates.push([new Date(prevTime), toDate])

  return dates
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
        default:
          return null
      }
      return fetchApiJson(url, {
        method: 'POST',
        headers: { 'session_token': token },
        body: {
          accountType: accountType,
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
    return op.operationDate > fromDate
  })
  console.log(filteredOperations)

  console.log(`>>> Загружено ${filteredOperations.length} операций.`)
  return filteredOperations
}
