import { defaultsDeep, flatMap } from 'lodash'
import { createDateIntervals as commonCreateDateIntervals } from '../../common/dateUtils'
import { fetch, fetchJson } from '../../common/network'
import { getDate } from './converters'

const baseUrl = 'https://ibank.asb.by'
var querystring = require('querystring')

async function fetchUrl (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  options.method = options.method ? options.method : 'POST'
  options.stringify = querystring.stringify

  const response = await fetch(baseUrl + url, options)
  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }
  let err = response.body.match(/<p id ="status_message" class="error">(.*)<\/p>/i)
  if (err) {
    throw new TemporaryError(err[1])
  }
  return response
}
async function fetchApiJson (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  options = defaultsDeep(
    options,
    {
      sanitizeRequestLog: { headers: { Cookie: true } },
      sanitizeResponseLog: { headers: { 'set-cookie': true } }
    }
  )
  const response = await fetchJson(baseUrl + url, options)
  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }

  if (!response.body.success && response.body.error && response.body.error.description) {
    const errorDescription = response.body.error.description
    if (errorDescription.indexOf('не принадлежит клиенту c кодом') >= 0 ||
      errorDescription.indexOf('Дата запуска/внедрения попадает в период запрашиваемой выписки') >= 0 ||
      errorDescription.indexOf('Получены не все обязательные поля') >= 0) {
      console.log('Ответ банка: ' + errorDescription)
      return false
    }
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

export async function login (prefs) {
  if (!prefs.codes0 || !/^\s*(?:\d{4}\s+){9}\d{4}\s*$/.test(prefs.codes0)) {
    throw new InvalidPreferencesError('Неправильно введены коды 1-10! Необходимо ввести 10 четырехзначных кодов через пробел.')
  }
  if (!prefs.codes1 || !/^\s*(?:\d{4}\s+){9}\d{4}\s*$/.test(prefs.codes1)) {
    throw new InvalidPreferencesError('Неправильно введены коды 11-20! Необходимо ввести 10 четырехзначных кодов через пробел.')
  }
  if (!prefs.codes2 || !/^\s*(?:\d{4}\s+){9}\d{4}\s*$/.test(prefs.codes2)) {
    throw new InvalidPreferencesError('Неправильно введены коды 21-30! Необходимо ввести 10 четырехзначных кодов через пробел.')
  }
  if (!prefs.codes3 || !/^\s*(?:\d{4}\s+){9}\d{4}\s*$/.test(prefs.codes3)) {
    throw new InvalidPreferencesError('Неправильно введены коды 31-40! Необходимо ввести 10 четырехзначных кодов через пробел.')
  }
  var res = await fetchUrl('/wps/portal/ibank/', {
    method: 'GET'
  }, response => response.success, message => new InvalidPreferencesError('Сайт не доступен'))

  let url = res.body.match(/<form[^>]+action="([^"]*)"[^>]*name="LoginForm1"/i)
  res = await fetchUrl(res.headers['content-location'] + url[1], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: {
      bbIbUseridField: prefs.login,
      bbIbPasswordField: prefs.password,
      bbIbLoginAction: 'in-action',
      bbibCodeSMSField: 0,
      bbibUnblockAction: '',
      bbibChangePwdByBlockedClientAction_sendSMS: ''
    }
  }, response => response.success, message => new InvalidPreferencesError(''))

  let codenum = res.body.match(/Введите[^>]*>код [N№]\s*(\d+)/i)
  codenum = codenum[1] - 1 // Потому что у нас коды с 0 нумеруются
  var col = Math.floor(codenum / 10)
  var idx = codenum % 10
  var codes = prefs['codes' + col]
  if (!codes) {
    throw new InvalidPreferencesError('Не введены коды ' + (col + 1) + '1-' + (col + 2) + '0')
  }
  let code = codes.split(/\D+/g)[idx]

  url = res.body.match(/<form[^>]+action="([^"]*)"[^>]*name="LoginForm1"/i)
  res = await fetchUrl(res.headers['content-location'] + url[1], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: {
      cancelindicator: false,
      bbIbCodevalueField: code,
      bbIbLoginAction: 'in-action',
      bbIbCancelAction: '',
      field_1: res.body.match(/<input[^>]+name="field_1" value="(.[^"]*)" \/>/i)[1],
      field_2: res.body.match(/<input[^>]+name="field_2" value="(.[^"]*)" \/>/i)[1],
      field_3: res.body.match(/<input[^>]+name="field_3" value="(.[^"]*)" \/>/i)[1],
      field_4: res.body.match(/<input[^>]+name="field_4" value="(.[^"]*)" \/>/i)[1],
      field_5: res.body.match(/<input[^>]+name="field_5" value="(.[^"]*)" \/>/i)[1],
      code_number_expire_time: true
    }
  }, response => response.success, message => new InvalidPreferencesError(''))

  return res
}

export async function fetchURLAccounts (loginRequest) {
  console.log('>>> Загрузка страницы счетов...')
  let url = loginRequest.body.match(/href="\/([^"]+)">\s*Счета/i)
  let res = await fetchUrl('/' + url[1], {
    method: 'GET'
  }, response => response.success, message => new InvalidPreferencesError(''))

  let urlCards = res.body.match(/<a\s*href="([^"]+)".*Счета с карточкой.*<\/a>/i)
  let urlDeposits = res.body.match(/<a\s*href="([^"]+)".*Депозиты.*<\/a>/i)
  return {
    cards: urlCards[1],
    deposits: urlDeposits[1]
  }
}

function strDecoder (str) {
  if (str === null) { return null }
  var str2 = str.split(';')
  var res = ''
  str2.forEach(function (s) {
    let left = s.replace(/&.[0-9]{4}/i, '')

    res += left + String.fromCharCode(s.replace(left + '&#', ''))
  })

  return res
}

export async function fetchDeposits (url) {
  console.log('>>> Загрузка депозитов...')
  let res = await fetchUrl(url, {
    method: 'GET'
  }, response => response.success, message => new InvalidPreferencesError(''))

  let regex = /<td class="tdNoPadding" ><div.[^>]*><span.[^>]*>(.*?)<\/span><span.[^>]*>(.*?)<\/span><\/div><\/td><td class="tdNoPadding" ><div.[^>]*>(.*?)<\/div><\/td><td class="tdNoPadding" ><div.[^>]*><span.[^>]*>(.*?)<\/span><\/div><\/td><td class="tdNoPadding" ><div.[^>]*>(.*?)<\/div><\/td>.*?X<\/a><div.[^>]*>(.*?)<\/div><\/div><\/div><\/td>/ig
  let m

  var deposits = []
  while ((m = regex.exec(res.body.replace(/\r?\n|\r/g, ''))) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++
    }
    deposits.push({
      id: (m[1] + m[2]).replace(/\s/g, ''),
      name: strDecoder(m[3]),
      balance: m[4],
      currency: m[5],
      details: strDecoder(m[6]),
      type: 'deposit'
    })
  }
  return deposits
}

export async function fetchCards (url) {
  console.log('>>> Загрузка картсчетов...')
  let res = await fetchUrl(url, {
    method: 'GET'
  }, response => response.success, message => new InvalidPreferencesError(''))

  let regex = /cellLable">(.[^>]*)<\/div><\/td><td class="tdBalance">.*<nobr>(.*)<\/nobr> (.[A-Z]*).*<td class="tdNumber"><div class="cellLable">(.[0-9*]*)<\/div>/ig
  let m

  var cards = []
  while ((m = regex.exec(res.body.replace(/\r?\n|\r/g, ''))) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++
    }
    cards.push({
      id: (m[1]).replace(/\s/g, ''),
      balance: m[2],
      currency: m[3],
      cardNum: m[4],
      type: 'card'
    })
  }
  return cards
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
