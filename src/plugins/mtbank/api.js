import { defaultsDeep, flatMap } from 'lodash'
import { createDateIntervals as commonCreateDateIntervals } from '../../common/dateUtils'
import { fetchJson } from '../../common/network'
import { getDate } from './converters'

const baseUrl = 'https://mybank.by/api/v1/'

async function fetchApiJson (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  options = defaultsDeep(
    options,
    {
      sanitizeRequestLog: { headers: { Cookie: true } },
      sanitizeResponseLog: { headers: { 'set-cookie': true } }
    }
  )
  const response = await fetchJson(baseUrl + url, options)

  if (response.body && response.body.error) {
    if ([
      'phone'
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
      'INTERNAL_SERVER_ERROR'
    ].indexOf(response.body.error.code) >= 0) {
      const errorDescription = response.body.error.description || response.body.error.error_description
      const errorMessage = errorDescription + (response.body.error.lockedTime && response.body.error.lockedTime !== 'null' ? response.body.error.lockedTime : '')
      throw new TemporaryError(`Во время синхронизации произошла ошибка.\n\nСообщение от банка: ${errorMessage}`)
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
    const errorMessage = 'Ответ банка: ' + errorDescription + (response.body.error.lockedTime && response.body.error.lockedTime !== 'null' ? response.body.error.lockedTime : '')
    throw new TemporaryError(errorMessage)
  }

  return response
}

function validateResponse (response, predicate, error = (message) => console.assert(false, message)) {
  if (!predicate || !predicate(response)) {
    error('non-successful response')
  }
}

function cookies (response) {
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
}

export async function login (login, password) {
  let res = await fetchApiJson('login/userIdentityByPhone', {
    method: 'POST',
    body: { phoneNumber: login, loginWay: '1' },
    sanitizeRequestLog: { body: { phoneNumber: true } },
    sanitizeResponseLog: { body: { data: { smsCode: { phone: true } } } }
  }, response => response.body.success)
  let sessionCookies = cookies(res)

  res = await fetchApiJson('login/checkPassword2', {
    method: 'POST',
    headers: { 'Cookie': sessionCookies },
    body: { 'password': password, 'version': '2.1.4' },
    sanitizeRequestLog: { body: { password: true } }
  }, response => response.body.success)

  sessionCookies = cookies(res)

  await fetchApiJson('user/userRole', {
    method: 'POST',
    body: res.body.data.userInfo.dboContracts[0],
    sanitizeResponseLog: { body: { name: true, longname: true } }
  }, response => response.body.success)

  return sessionCookies
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
      }, response => response.body)
    })
  }))

  const operations = flatMap(responses, response => {
    if (response) {
      return flatMap(response.body.data, d => {
        return d.operations.map(op => {
          op.accountId = d.accountId
          if (op.description === null) {
            op.description = ''
          }
          return op
        })
      })
    }
  })

  const filteredOperations = operations.filter(function (op) {
    return op !== undefined && op.status !== 'E' && getDate(op.transDate) > fromDate && !op.description.includes('Гашение кредита в виде "овердрафт" по договору')
  })
  console.log(filteredOperations)

  console.log(`>>> Загружено ${filteredOperations.length} операций.`)
  return filteredOperations
}
