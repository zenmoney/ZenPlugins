import { fetchJson } from '../../common/network'
import { defaultsDeep, flatMap } from 'lodash'
import { generateRandomString } from '../../common/utils'
import { getDate } from './converters'

const baseUrl = 'https://insync2.alfa-bank.by/mBank256/v5/'

/**
 * @return {string}
 */
function DeviceID () {
  let deviceID = ZenMoney.getData('deviceID', generateRandomString(8) + '-' + generateRandomString(4) + '-' + generateRandomString(4) + '-' + generateRandomString(4) + '-' + generateRandomString(12))
  ZenMoney.setData('deviceID', deviceID)
  return deviceID
}

async function fetchApiJson (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  options = defaultsDeep(
    options,
    {
      headers: {
        'X-Client-App': 'Android/5.4.1',
        'Content-Type': 'application/json; charset=UTF-8',
        'User-Agent': 'okhttp/3.12.0'
      }
    }
  )
  const response = await fetchJson(baseUrl + url, options)
  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }

  if (!response.body.success && response.body.error && response.body.error.description) {
    const errorDescription = response.body.error.description
    const errorMessage = 'Ответ банка: ' + errorDescription + (response.body.error.lockedTime && response.body.error.lockedTime !== 'null' ? response.body.error.lockedTime : '')
    if (errorDescription.indexOf('Неверный пароль') >= 0) { throw new InvalidPreferencesError(errorMessage) }
    throw new TemporaryError(errorMessage)
  }

  return response
}

function validateResponse (response, predicate, error) {
  if (!predicate || !predicate(response)) {
    error('non-successful response')
  }
}

/* function cookies (response) {
  if (response.headers) {
    const cookies = response.headers['set-cookie']
    if (cookies) {
      const requiredValues = /(JSESSIONID=[^;]*;).*(TS[^=]*=[^;]*;)/
      return requiredValues.exec(cookies).slice(1).join(';')
    } else {
      return cookies
    }
  } else {
    return '' // tests not mocking headers, ignoring
  }
} */

export async function login (login, password) {
  let deviceID = DeviceID()
  await fetchApiJson('Authorization', {
    method: 'POST',
    body: {
      deviceId: deviceID,
      deviceName: 'unknown Android SDK built for x86_64',
      isResident: true,
      login: login,
      password: password,
      screenHeight: 1794,
      screenWidth: 1080
    },
    sanitizeRequestLog: { body: { login: true, password: true, deviceId: true } },
    sanitizeResponseLog: { body: { data: { smsCode: { phone: true } } } }
  }, response => response.status, message => new InvalidPreferencesError('Неверный логин или пароль'))

  return ''
}

export async function fetchAccounts (sessionCookies) {
  console.log('>>> Загрузка списка счетов...')
  return (await fetchApiJson('user/loadUser', {
    headers: { 'Cookie': sessionCookies }
  }, response => response.body && response.body.data && response.body.data.products,
  message => new TemporaryError(message))).body.data.products
}

function formatDate (date) {
  return date.toISOString().replace('T', ' ').split('.')[0]
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

export async function fetchTransactions (sessionCookies, accounts, fromDate, toDate = new Date()) {
  console.log('>>> Загрузка списка транзакций...')
  toDate = toDate || new Date()

  const dates = createDateIntervals(fromDate, toDate)
  const responses = await Promise.all(flatMap(accounts, (account) => {
    return dates.map(dates => {
      return fetchApiJson('product/loadOperationStatements', {
        method: 'POST',
        headers: { 'Cookie': sessionCookies },
        body: {
          contractCode: account.id,
          accountIdenType: account.productType,
          startDate: formatDate(dates[0]),
          endDate: formatDate(dates[1]),
          halva: false
        }
      }, response => response.body && response.body.data)
    })
  }))

  const operations = flatMap(responses, response => {
    return flatMap(response.body.data, d => {
      return d.operations.map(op => {
        op.accountId = d.accountId
        return op
      })
    })
  })

  const filteredOperations = operations.filter(function (op) {
    return op.status !== 'E' && getDate(op.transDate) > fromDate && !op.description.includes('Гашение кредита в виде "овердрафт" по договору')
  })

  console.log(`>>> Загружено ${filteredOperations.length} операций.`)
  return filteredOperations
}
