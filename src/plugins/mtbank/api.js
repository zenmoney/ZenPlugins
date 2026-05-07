import { defaultsDeep, flatMap } from 'lodash'
import { createDateIntervals as commonCreateDateIntervals } from '../../common/dateUtils'
import { fetchJson } from '../../common/network'
import { BankMessageError, InvalidOtpCodeError } from '../../errors'
import { getDate } from './converters'

const baseUrl = 'https://mybank.by/api/v1/'

async function fetchApiJson (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  options = defaultsDeep(
    options,
    {
      headers: {
        Origin: 'https://mybank.by',
        Referer: 'https://mybank.by/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': 'macOS'
      }
    },
    {
      sanitizeRequestLog: { headers: { Cookie: true } },
      sanitizeResponseLog: { headers: { 'set-cookie': true } }
    }
  )
  const response = await fetchJson(baseUrl + url, options)

  if (response.body && response.body.error) {
    if ([
      'phone',
      'USER_NOT_FOUND'
    ].indexOf(response.body.error.code) >= 0) {
      throw new InvalidPreferencesError('Неверный номер телефона')
    }
    if ([
      'PASSWORD_ERROR'
    ].indexOf(response.body.error.code) >= 0) {
      throw new InvalidPreferencesError('Неверный номер телефона или пароль')
    }
    if ([
      'USER_TEMP_LOCKED',
      'INTERNAL_SERVER_ERROR',
      'SMS_SENDING_LOCKED',
      'UNSUPPORTED_VERSION',
      'USER_BLOCKED',
      'ABS_ERROR'
    ].indexOf(response.body.error.code) >= 0) {
      const errorDescription = response.body.error.description || response.body.error.error_description
      const errorMessage = errorDescription + (response.body.error.lockedTime && response.body.error.lockedTime !== 'null' ? response.body.error.lockedTime : '')
      throw new BankMessageError(errorMessage)
    }
  }

  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }

  if (!response.body.success &&
    response.body.error &&
    response.body.error.description &&
    response.body.error.description.indexOf('Неверное значение contractCode') === 0) {
    const errorDescription = response.body.error.description
    if (errorDescription.indexOf('не принадлежит клиенту c кодом') >= 0 ||
      errorDescription.indexOf('Дата запуска/внедрения попадает в период запрашиваемой выписки') >= 0 ||
      errorDescription.indexOf('Получены не все обязательные поля') >= 0) {
      console.log('Ответ банка: ' + errorDescription)
      return false
    }
    const errorMessage = errorDescription + (response.body.error.lockedTime && response.body.error.lockedTime !== 'null' ? response.body.error.lockedTime : '')
    throw new BankMessageError(errorMessage)
  }

  return response
}

function validateResponse (response, predicate, error = (message) => console.assert(false, message)) {
  if (!predicate || !predicate(response)) {
    error('non-successful response')
  }
}

function parseCookies (response) {
  const map = new Map()

  if (!response.headers) return map // for tests

  const cookieString = response.headers['set-cookie']

  if (!cookieString) return map

  const cookies = cookieString.split(/,\s*(?=[^;]+?=)/)

  for (const cookie of cookies) {
    const [pair] = cookie.split(';')
    const [key, value] = pair.split('=')
    if (key && value) {
      map.set(key.trim(), value.trim())
    }
  }

  return map
}

const mapToCookieHeader = (map) => [...map.entries()].map(([key, value]) => `${key}=${value}`).join('; ')

export async function login (login, password) {
  let res = await fetchApiJson('login/userIdentityByPhone', {
    method: 'POST',
    body: { phoneNumber: login, loginWay: '1' },
    sanitizeRequestLog: { body: { phoneNumber: true } }
  }, response => response.body.success)
  const cookies = parseCookies(res)

  res = await fetchApiJson(
    'login/checkPassword4',
    {
      method: 'POST',
      headers: { Cookie: mapToCookieHeader(cookies) },
      body: { password, version: '2.1.18' },
      sanitizeRequestLog: { body: { password: true } },
      sanitizeResponseLog: {
        body: {
          data: {
            smsInfo: {
              phone: true
            },
            userInfo: true
          }
        }
      }
    },
    (response) => response.body.success
  )

  if (res.body.data.nextOperation === 'SMS') {
    // SMS-code confirmation needed
    const smsCode = await ZenMoney.readLine('Введите код из СМС сообщения', {
      time: 30000
    })
    if (!smsCode) {
      throw new InvalidOtpCodeError()
    }
    await fetchApiJson(
      'login/checkSms',
      {
        method: 'POST',
        headers: { Cookie: mapToCookieHeader(cookies) },
        body: { smsCode },
        sanitizeRequestLog: { body: { smsCode: true } }
      },
      (response) => response.body.success
    )
  }

  await fetchApiJson(
    'user/userRole',
    {
      method: 'POST',
      body: res.body.data.userInfo.dboContracts[0],
      sanitizeRequestLog: { body: true }
    },
    (response) => response.body.success
  )

  return cookies
}

export async function fetchAccounts (sessionCookies) {
  console.log('>>> Загрузка списка счетов...')

  const response = await fetchApiJson('user/loadUser', {
    headers: { Cookie: mapToCookieHeader(sessionCookies) }
  }, response => response.body && response.body.data && response.body.data.products,
  message => new TemporaryError(message))

  // Update session cookies with new values
  for (const [key, value] of parseCookies(response).entries()) {
    sessionCookies.set(key, value)
  }

  return response.body.data.products
}

function formatDate (date) {
  return date.toISOString().replace('T', ' ').split('.')[0]
}

export function createDateIntervals (fromDate, toDate) {
  const interval = 20 * 24 * 60 * 60 * 1000 // 20-day interval for fetching data
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

  const intervals = createDateIntervals(fromDate, toDate || new Date())
  const operations = []

  for (const account of accounts) {
    const responses = await Promise.all(intervals.map(([startDate, endDate]) => {
      return fetchApiJson('product/loadOperationStatements', {
        method: 'POST',
        headers: { Cookie: mapToCookieHeader(sessionCookies) },
        body: {
          contractCode: account.id,
          accountIdenType: account.productType,
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          halva: false
        }
      }, response => response.body)
    }))

    for (const response of responses) {
      if (!response) continue

      operations.push(...flatMap(response.body.data, d => d.operations.map(op => ({
        ...op,
        accountId: d.accountId,
        description: op.description || ''
      }))))
    }
  }

  const filteredOperations = operations.filter(function (op) {
    const date = op.transDate ? getDate(op.transDate) : getDate(`${op.operationDate} 00:00:00`)
    return op !== undefined && op.status !== 'E' && date > fromDate && !op.description.includes('Гашение кредита в виде "овердрафт" по договору')
  })

  console.log(`>>> Загружено ${filteredOperations.length} операций.`)
  return filteredOperations
}
