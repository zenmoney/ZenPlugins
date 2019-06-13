import { fetch } from '../../common/network'

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

  let regex = /<form id="viewns.*action="(.[^"]*)".*name="javax\.faces\.encodedURL" value="(.[^"]*)".*cellLable">(.[^>]*)<\/div><\/td><td class="tdBalance">.*return myfaces\.oam\.submitForm\((.*)\);.*title="Получить отчёт по заблокированным операциям.*<nobr>(.*)<\/nobr> (.[A-Z]*).*<td class="tdNumber"><div class="cellLable">(.[0-9*]*)<\/div>.*id="javax\.faces\.ViewState" value="(.[^"]*)/ig
  let m

  var cards = []
  while ((m = regex.exec(res.body.replace(/\r?\n|\r/g, ''))) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++
    }
    cards.push({
      id: m[3],
      balance: m[5],
      currency: m[6],
      cardNum: m[7],
      type: 'card',
      transactionsData: {
        action: m[1],
        encodedURL: m[2],
        additional: m[4].match(/'(.[^']*)'/ig),
        viewState: m[8]
      }
    })
  }
  return cards
}

export async function fetchCardsTransactions (acc) {
  console.log('>>> Загрузка транзакций по ' + acc.title)

  let body = {
    'javax.faces.encodedURL': acc.raw.transactionsData.encodedURL,
    'accountNumber': acc.raw.transactionsData.additional[3].replace(/'/g, ''),
    'javax.faces.ViewState': acc.raw.transactionsData.viewState
  }
  body[acc.raw.transactionsData.additional[0].replace(/'/g, '') + ':acctIdSelField'] = acc.raw.id
  body[acc.raw.transactionsData.additional[0].replace(/'/g, '') + '_SUBMIT'] = 1
  body[acc.raw.transactionsData.additional[0].replace(/'/g, '') + ':_idcl'] = acc.raw.transactionsData.additional[1].replace(/'/g, '')
  let res = await fetchUrl(acc.raw.transactionsData.action, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body
  }, response => response.success, message => new InvalidPreferencesError(''))

  console.log(res)
  return []
}
