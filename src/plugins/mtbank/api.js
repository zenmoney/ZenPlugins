import * as network from '../../common/network'
import * as _ from 'lodash'

const baseUrl = 'https://mybank.by/api/v1/'

async function fetchJson (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  options = _.defaultsDeep(
    options,
    {
      sanitizeRequestLog: { headers: { Cookie: true } },
      sanitizeResponseLog: { headers: { 'set-cookie': true } }
    }
  )
  const response = await network.fetchJson(baseUrl + url, options)
  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }

  if (!response.body.success && response.body.error && response.body.error.description) {
    const errorDescription = response.body.error.description
    const errorMessage = 'Ответ банка: ' + errorDescription + response.body.error.lockedTime
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
  const sessionCookies = cookies(await fetchJson('', {},
    response => cookies(response),
    message => new TemporaryError(message)))

  await fetchJson('login/userIdentityByPhone', {
    method: 'POST',
    headers: { 'Cookie': sessionCookies },
    body: { phoneNumber: login, loginWay: '1' },
    sanitizeRequestLog: { body: { phoneNumber: true } },
    sanitizeResponseLog: { body: { data: { smsCode: { phone: true } } } }
  }, response => response.success, message => new InvalidPreferencesError('Неверный номер телефона'))

  await fetchJson('login/checkPassword2', {
    method: 'POST',
    headers: { 'Cookie': sessionCookies },
    body: { 'password': password },
    sanitizeRequestLog: { body: { password: true } }
  }, response => response.success, message => new InvalidPreferencesError('Неверный пароль'))

  return sessionCookies
}

export async function fetchAccounts (sessionCookies) {
  console.log('>>> Загрузка списка счетов...')
  const products = (await fetchJson('user/loadUser', {
    headers: { 'Cookie': sessionCookies }
  }, response => response.body && response.body.data && response.body.data.products,
  message => new TemporaryError(message))).body.data.products

  return products
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
  const responses = await Promise.all(_.flatMap(accounts, (account) => {
    return dates.map(dates => {
      return fetchJson('product/loadOperationStatements', {
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

  const operations = _.flatMap(responses, response => {
    return _.flatMap(response.body.data, d => {
      return d.operations.map(op => {
        op.accountId = d.accountId
        return op
      })
    })
  })

  const filteredOperations = operations.filter(function (op) {
    return op.status !== 'E' && new Date(op.transDate) > fromDate && !op.description.includes('Гашение кредита в виде "овердрафт" по договору')
  })

  console.log(`>>> Загружено ${filteredOperations.length} операций.`)
  return filteredOperations
}
