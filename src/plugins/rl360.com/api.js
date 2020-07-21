import cheerio from 'cheerio'
import { defaultsDeep } from 'lodash'
import { stringify } from 'querystring'
import { fetch } from '../../common/network'

const baseUrl = 'https://service.rl360.com/scripts/customer.cgi'

async function fetchUrl (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  options = defaultsDeep(
    options,
    {
      sanitizeRequestLog: { headers: { Cookie: true } },
      sanitizeResponseLog: { headers: { 'set-cookie': true } }
    }
  )
  options.method = options.method ? options.method : 'POST'
  options.stringify = stringify

  const response = await fetch(baseUrl + url, options)
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

export async function login (prefs) {
  const res = await fetchUrl('?option=login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: {
      USERNAME: prefs.login,
      PASSWORD: prefs.password,
      option: 'login'
    },
    sanitizeRequestLog: { body: { USERNAME: true, PASSWORD: true } }
  }, response => response.success, message => new Error('Сайт не доступен'))

  if (res.body.search(/The system could not log you in, please try again/) >= 0) {
    throw new InvalidPreferencesError('Неверный логин или пароль')
  }
  if (res.body.search(/Password expired/) >= 0) {
    throw new InvalidPreferencesError('Ваш пароль устарел. Перейдите на rl360.com и обновите его.')
  }

  return true
}

export async function fetchPolicies () {
  console.log('>>> Загрузка списка полиси...')
  const policies = []
  const res = await fetchUrl('/SC/', { method: 'GET' }, response => response.success, message => new Error(''))
  let html = res.body
  html = html.replace(/\r?\n|\r/g, '')

  let $ = cheerio.load(html)

  const policiesElements = $('div[class="level3"]').children('p').children('a[href*="../SC/servicing/summary.php?PolNumber="]')
  const ids = []
  policiesElements.each(function (i, policyObj) {
    ids.push($(policyObj).text())
  })

  for (let i = 0; i < ids.length; i++) {
    const res = await fetchUrl('/SC/servicing/summary.php?PolNumber=' + ids[i], { method: 'GET' }, response => response.success, message => new Error(''))
    let html = res.body
    html = html.replace(/\r?\n|\r/g, '')
    $ = cheerio.load(html)
    const balance = $('div[class="rightsa2"]').children('div').children('p[class="par100"]').text().trim().split(' ')

    policies.push({
      id: ids[i],
      currency: balance[0],
      balance: balance[1]
    })
  }
  return policies
}

export async function fetchTransactions (acc, fromDate, toDate) {
  console.log('>>> Загрузка транзакций по ' + acc.title)
  const transactions = []

  const res = await fetchUrl(
    '/SC/servicing/history.php?subtab=premiums&PolNumber=' + acc.id +
    '&day=' + fromDate.getDate() + '&month=' + (fromDate.getMonth() + 1) + '&year=' + fromDate.getFullYear() +
    '&eday=' + toDate.getDate() + '&emonth=' + (toDate.getMonth() + 1) + '&eyear=' + toDate.getFullYear() + '&continue=Continue',
    { method: 'GET' }, response => response.success, message => new Error(''))
  let html = res.body
  html = html.replace(/\r?\n|\r/g, '')
  const $ = cheerio.load(html)
  const rows = $('table').children('tbody').children('tr')
  rows.each(function (i, row) {
    const transaction = {
      date: $(row).children('td[id="t2header4"]').text().trim(),
      amount: $(row).children('td[id="t2header5"]').text().trim(),
      fee: $(row).children('td[id="t2header6"]').text().trim()
    }
    transactions.push(transaction)
  })

  return transactions.reverse()
}
