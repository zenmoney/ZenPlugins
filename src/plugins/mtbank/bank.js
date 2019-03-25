import * as network from '../../common/network'

const baseUrl = 'https://mybank.by/api/v1/'

async function fetchJson (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  const response = await network.fetchJson(baseUrl + url, options || {})
  if (predicate) {
    validateResponse(response, response => predicate(response), error)
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
      return cookies.replace(',', '')
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
    body: { phoneNumber: login, loginWay: '1' }
  }, response => response.success, message => new InvalidPreferencesError('Неверный номер телефона'))

  await fetchJson('login/checkPassword2', {
    method: 'POST',
    headers: { 'Cookie': sessionCookies },
    body: { 'password': password }
  }, response => response.success, message => new InvalidPreferencesError('Неверный пароль'))

  return sessionCookies
}

export async function fetchAccounts (sessionCookies) {
  const products = (await fetchJson('user/loadUser', {
    headers: { 'Cookie': sessionCookies }
  }, response => response.body && response.body.data && response.body.data.products,
  message => new TemporaryError(message))).body.data.products

  return products
}

function formatDate (date) {
  return date.toISOString().replace('T', ' ').split('.')[0]
}

function roundToDay (date) {
  date.setHours(0)
  date.setMinutes(0)
  date.setSeconds(0)
  date.setMilliseconds(0)

  return date
}

function createDateIntervals (fromDate, toDate) {
  const fromDay = roundToDay(fromDate)

  const toDay = roundToDay(toDate)
  toDay.setDate(toDate.getDate() + 1)

  const interval = 10 * 24 * 60 * 60 * 1000 // 5 days interval for fetching data

  const dates = []
  let time = fromDay.getTime()
  let prevTime = null
  while (time < toDay.getTime()) {
    if (prevTime !== null) {
      dates.push([new Date(prevTime), new Date(time - 24 * 60 * 60 * 1000)]) // time - 1 day, so that days are not intersecting
    }

    prevTime = time
    time = time + interval
  }
  dates.push([new Date(prevTime), toDay])

  return dates
}

export async function fetchTransactions (sessionCookies, accounts, fromDate, toDate = new Date()) {
  if (toDate === null) {
    toDate = new Date() // loading up to now
  }

  const dates = createDateIntervals(fromDate, toDate)

  const responses = await Promise.all(accounts.flatMap((account) => {
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

  return responses.flatMap(response => {
    return response.body.data.flatMap(d => {
      return d.operations.map(op => {
        op.accountId = d.accountId

        return op
      })
    })
  })
}
