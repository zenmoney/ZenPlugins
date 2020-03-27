import { defaultsDeep } from 'lodash'
import { fetch } from '../../common/network'
import { BankMessageError, InvalidOtpCodeError } from '../../errors'
import padLeft from 'pad-left'

const baseUrl = 'https://ibank.asb.by'
var querystring = require('querystring')

async function fetchUrl (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  options = defaultsDeep(
    options,
    {
      sanitizeRequestLog: { headers: { Cookie: true } },
      sanitizeResponseLog: { headers: { 'set-cookie': true } }
    }
  )
  options.method = options.method ? options.method : 'POST'
  options.stringify = querystring.stringify

  const response = await fetch(baseUrl + url, options)
  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }
  let err = response.body.match(/<p id ="status_message" class="error">(.[^/]*)</i)
  if (err && err[1].indexOf('СМС-код отправлен на номер телефона') === -1) {
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
  if (prefs.viaSMS !== 'false') {
    return loginSMS(prefs)
  }
  return loginCodes(prefs)
}

export async function loginCodes (prefs) {
  if (!prefs.codes0 || !/^\s*(?:\d{4}[\s+]+){9}\d{4}\s*$/.test(prefs.codes0)) {
    throw new InvalidPreferencesError('Неправильно введены коды 1-10! Необходимо ввести 10 четырехзначных кодов через пробел или +.')
  }
  if (!prefs.codes1 || !/^\s*(?:\d{4}[\s+]+){9}\d{4}\s*$/.test(prefs.codes1)) {
    throw new InvalidPreferencesError('Неправильно введены коды 11-20! Необходимо ввести 10 четырехзначных кодов через пробел или +.')
  }
  if (!prefs.codes2 || !/^\s*(?:\d{4}[\s+]+){9}\d{4}\s*$/.test(prefs.codes2)) {
    throw new InvalidPreferencesError('Неправильно введены коды 21-30! Необходимо ввести 10 четырехзначных кодов через пробел или +.')
  }
  if (!prefs.codes3 || !/^\s*(?:\d{4}[\s+]+){9}\d{4}\s*$/.test(prefs.codes3)) {
    throw new InvalidPreferencesError('Неправильно введены коды 31-40! Необходимо ввести 10 четырехзначных кодов через пробел или +.')
  }
  var res = await fetchUrl('/wps/portal/ibank/', {
    method: 'GET'
  }, response => response.success, message => new Error('Сайт не доступен'))

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
    },
    sanitizeRequestLog: { body: { bbIbUseridField: true, bbIbPasswordField: true } }
  }, response => response.success, message => new Error(''))

  if (res.body.search(/Неправильно введён логин и\/или пароль/) >= 0) {
    throw new InvalidPreferencesError('Неверный логин или пароль от интернет-банка Беларусбанка')
  }

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
    },
    sanitizeRequestLog: { body: { bbIbCodevalueField: true } }
  }, response => response.success, message => new Error(''))

  if (res.body.search(/Смена пароля/) >= 0) {
    throw new BankMessageError('Закончился срок действия пароля. Задайте новый пароль в интернет-банке Беларусбанка')
  }

  return res
}

export async function loginSMS (prefs) {
  var res = await fetchUrl('/wps/portal/ibank/', {
    method: 'GET'
  }, response => response.success, message => new Error('Сайт не доступен'))

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
      bbibCodeSMSField: 1,
      bbibUnblockAction: '',
      bbibChangePwdByBlockedClientAction_sendSMS: ''
    },
    sanitizeRequestLog: { body: { bbIbUseridField: true, bbIbPasswordField: true } }
  }, response => response.success, message => new Error(''))

  if (res.body.search(/Неправильно введён логин и\/или пароль/) >= 0) {
    throw new InvalidPreferencesError('Неверный логин или пароль от интернет-банка Беларусбанка')
  }

  let sms = await ZenMoney.readLine('Введите код из смс', {
    time: 120000
  })
  if (sms === '') {
    throw new InvalidOtpCodeError()
  }

  url = res.body.match(/<form[^>]+action="([^"]*)"[^>]*name="LoginForm1"/i)
  res = await fetchUrl(res.headers['content-location'] + url[1], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: {
      cancelindicator: false,
      bbIbCodeSmsvalueField: sms,
      bbIbLoginAction: 'in-action',
      bbIbCancelAction: '',
      field_1: res.body.match(/<input[^>]+name="field_1" value="(.[^"]*)" \/>/i)[1],
      field_2: res.body.match(/<input[^>]+name="field_2" value="(.[^"]*)" \/>/i)[1],
      field_7: res.body.match(/<input[^>]+name="field_7" value="(.[^"]*)" \/>/i)[1],
      field_5: res.body.match(/<input[^>]+name="field_5" value="(.[^"]*)" \/>/i)[1]
    },
    sanitizeRequestLog: { body: { bbIbCodeSmsvalueField: true } }
  }, response => response.success, message => new Error(''))

  if (res.body.search(/Смена пароля/) >= 0) {
    throw new BankMessageError('Закончился срок действия пароля. Задайте новый пароль в интернет-банке Беларусбанка')
  }

  return res
}

export async function fetchURLAccounts (loginRequest) {
  console.log('>>> Загрузка страницы счетов...')
  let url = loginRequest.body.match(/href="\/([^"]+)">\s*Счета/i)
  let res = await fetchUrl('/' + url[1], {
    method: 'GET'
  }, response => response.success, message => new Error(''))

  let urlCards = res.body.match(/<a\s*href="([^"]+)".*Счета с карточкой.*<\/a>/i)
  let urlDeposits = res.body.match(/<a\s*href="([^"]+)".*Депозиты.*<\/a>/i)
  return {
    cards: urlCards[1],
    deposits: urlDeposits[1]
  }
}

function strDecoder (str) {
  if (str === null) {
    return null
  }
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
  }, response => response.success, message => new Error(''))

  return parseDeposits(res.body)
}

export async function fetchCards (url) {
  console.log('>>> Загрузка карточных/текущих аккаунтов...')
  let res = await fetchUrl(url, {
    method: 'GET'
  }, response => response.success, message => new Error(''))
  return parseCards(res.body)
}

export function parseCards (html) {
  html = html.replace(/\r?\n|\r/g, '')
  const accounts = []
  const cheerio = require('cheerio')
  const $ = cheerio.load(html)

  const formEncodedUrl = $('input[name="javax.faces.encodedURL"]').attr('value')
  const formViewState = $('input[name="javax.faces.ViewState"]').attr('value')

  const accountBlocks = $('table[class="accountContainer"]').children('tbody').children('tr').children('td')
  accountBlocks.each(function (i, elem) {
    const account = {
      transactionsData: {
        encodedURL: formEncodedUrl,
        viewState: formViewState
      }
    }
    const accountTable = $(elem).children('table[class="accountTable"]').children('tbody').children('tr')
    const cardTable = $(elem).children('table[class="ibTable"]').children('tbody').children('tr')

    account.accountName = accountTable.children('td[class="tdAccountText"]').children('div').text()
    if (account.accountName.indexOf('Новые карты') >= 0) return // move to the next iteration
    account.accountNum = accountTable.children('td[class="tdId"]').children('div').text().replace(/\s+/g, '')
    account.balance = accountTable.children('td[class="tdBalance"]').children('div').children('nobr').text()
    account.currency = accountTable.children('td[class="tdBalance"]').children('div').text().replace(account.balance, '').trim().split(' ')[0]
    account.overdraftBalance = $(elem).children('table[class="accountInfoTable"]').children('tbody').children('tr')
      .children('td[class="tdAccountDetails"]').children('div').children('span[class="tdAccountOverdraft"]').children('nobr').text()
    account.overdraftCurrency = $(elem).children('table[class="accountInfoTable"]').children('tbody').children('tr')
      .children('td[class="tdAccountDetails"]').children('div').children('span[class="tdAccountOverdraft"]').text().split(' ').pop()
    account.transactionsData.additional = accountTable.children('td[class="tdAccountButton"]').children('a[title="Получить отчёт об операциях по счёту"]')
      .attr('onclick').replace('return myfaces.oam.submitForm(', '').replace(');', '').match(/'(.[^']*)'/ig)
    account.accountId = account.transactionsData.additional[account.transactionsData.additional.length - 1].replace(/'/g, '')

    account.transactionsData.action = $('form[id="' + account.transactionsData.additional[0].replace(/'/g, '') + '"]').attr('action')
    account.transactionsData.holdsData = accountTable.children('td[class="tdAccountButton"]').children('a[title="Получить отчёт по заблокированным операциям"]')
      .attr('onclick').replace('return myfaces.oam.submitForm(', '').replace(');', '').match(/'(.[^']*)'/ig)

    if (cardTable.children('td').length > 1) {
      account.type = 'ccard'
      account.cards = []
      cardTable.each(function (i, elem) {
        const card = {
          name: $(elem).children('td[class="tdNoPaddingBin"]').children('div').attr('title'),
          number: $(elem).children('td[class="tdNumber"]').children('div').text(),
          id: $(elem).children('td[class="tdId"]').children('div').text(),
          isActive: Boolean($(elem).children('td[class="tdNoPadding"]').children('div').attr('class') !== 'cellLable notActiveCard')
        }
        account.cards.push(card)
      })
    } else {
      account.type = 'account'
    }
    accounts.push(account)
  })
  console.log(`>>> Загружено ${accounts.length} карточных/текущих аккаунтов.`)
  return accounts
}

export function parseDeposits (response) {
  const regex = /<td class="tdNoPadding" ><div.[^>]*><span.[^>]*>(.*?)<\/span><span.[^>]*>(.*?)<\/span><\/div><\/td><td class="tdNoPadding" ><div.[^>]*>(.*?)<\/div><\/td><td class="tdNoPadding" ><div.[^>]*><span.[^>]*>(.*?)<\/span><\/div><\/td><td class="tdNoPadding" ><div.[^>]*>(.*?)<\/div><\/td>.*?X<\/a><div.[^>]*>(.*?)<\/div><\/div><\/div><\/td>/ig
  const deposits = []
  let m
  while ((m = regex.exec(response.replace(/\r?\n|\r/g, ''))) !== null) {
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

export async function fetchCardsTransactions (acc, fromDate, toDate) {
  console.log('>>> Загрузка транзакций по ' + acc.title)

  let body = {
    'javax.faces.encodedURL': acc.raw.transactionsData.encodedURL,
    'accountNumber': acc.raw.transactionsData.additional[3].replace(/'/g, ''),
    'javax.faces.ViewState': acc.raw.transactionsData.viewState
  }
  let viewns = acc.raw.transactionsData.additional[0].replace(/'/g, '')
  body[viewns + ':acctIdSelField'] = acc.raw.accountName.replace('Счёт №', '')
  body[viewns + '_SUBMIT'] = 1
  body[viewns + ':_idcl'] = acc.raw.transactionsData.additional[1].replace(/'/g, '')
  let res = await fetchUrl(acc.raw.transactionsData.action, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body
  }, response => response.success, message => new Error(''))

  viewns = viewns.replace('ClientCardsDataForm', 'accountStmtStartPageForm')
  const cheerio = require('cheerio')
  let $ = cheerio.load(res.body)
  let action = $('form[id="' + viewns + '"]').attr('action')

  body = {
    'javax.faces.encodedURL': $('input[name="javax.faces.encodedURL"]').attr('value'),
    'javax.faces.ViewState': $('input[name="javax.faces.ViewState"]').attr('value')
  }
  body[viewns + '_SUBMIT'] = 1
  body[viewns + ':_idcl'] = res.body.match(/ id="(.{1,200})">Продолжить<\/a>/)[1]

  fromDate = new Date(fromDate.toISOString().slice(0, 10) + 'T00:00:00+00:00')
  toDate = new Date(toDate.toISOString().slice(0, 10) + 'T00:00:00+00:00')
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00+00:00')
  const days90 = 90 * 24 * 60 * 60 * 1000
  if (today.getTime() - toDate.getTime() > days90) {
    fromDate = new Date(today.getTime() - days90)
    toDate = today
  } else if (today.getTime() - fromDate.getTime() > days90) {
    fromDate = new Date(today.getTime() - days90)
  }

  const dateStart =
    padLeft(fromDate.getDate().toString(), 2, '0') + '.' +
    padLeft((fromDate.getMonth() + 1).toString(), 2, '0') + '.' +
    fromDate.getFullYear()
  const dateEnd =
    padLeft(toDate.getDate().toString(), 2, '0') + '.' +
    padLeft((toDate.getMonth() + 1).toString(), 2, '0') + '.' +
    toDate.getFullYear()

  body[viewns + ':SFPCalendarFromID'] = dateStart
  body[viewns + ':SFPCalendarToID'] = dateEnd
  res = await fetchUrl(action, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body
  }, response => response.success, message => new Error(''))

  const transactions = parseTransactions(res.body, acc.id, 'operResultOk')
  let pages = res.body.match(/Страница \d+ из (\d+)/) && parseInt(res.body.match(/Страница \d+ из (\d+)/)[1])

  viewns = viewns.replace('accountStmtStartPageForm', 'AccountStmtForm')
  for (let i = 2; i <= pages; i++) {
    $ = cheerio.load(res.body)
    action = $('form[id="' + viewns + '"]').attr('action')
    const encodedUrl = $('input[name="javax.faces.encodedURL"]').attr('value')
    const viewState = $('input[name="javax.faces.ViewState"]').attr('value')
    const idPage = 'idx' + i.toString()
    res = await getNextPage({ action, encodedUrl, viewState, viewns, idPage })
    const transOnPage = parseTransactions(res.body, acc.id, 'operResultOk')
    transactions.push(...transOnPage)
  }

  // возврат к списку счетов
  $ = cheerio.load(res.body)
  action = $('form[id="' + viewns + '"]').attr('action')
  body = {
    'javax.faces.encodedURL': $('input[name="javax.faces.encodedURL"]').attr('value'),
    'javax.faces.ViewState': $('input[name="javax.faces.ViewState"]').attr('value')
  }
  body[viewns + '_SUBMIT'] = 1
  body[viewns + ':_idcl'] = res.body.match(/ id="(.{1,200})">Вернуться к списку счетов<\/a>/)[1]
  res = await fetchUrl(action, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body
  }, response => response.success, message => new Error(''))

  console.log('>>> Загрузка холдов по ' + acc.title)
  $ = cheerio.load(res.body)
  viewns = acc.raw.transactionsData.holdsData[0].replace(/'/g, '')
  action = $('form[id="' + viewns + '"]').attr('action')
  body = {
    'javax.faces.encodedURL': $('input[name="javax.faces.encodedURL"]').attr('value'),
    'accountNumber': acc.raw.transactionsData.holdsData[3].replace(/'/g, ''),
    'javax.faces.ViewState': $('input[name="javax.faces.ViewState"]').attr('value')
  }

  body[viewns + ':acctIdSelField'] = acc.raw.accountName.replace('Счёт №', '')
  body[viewns + '_SUBMIT'] = 1
  body[viewns + ':_idcl'] = acc.raw.transactionsData.holdsData[1].replace(/'/g, '')
  res = await fetchUrl(action, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body
  }, response => response.success, message => new Error(''))

  const holds = parseTransactions(res.body, acc.id, 'hold')

  pages = res.body.match(/Страница \d+ из (\d+)/) && parseInt(res.body.match(/Страница \d+ из (\d+)/)[1])
  viewns = viewns.replace('accountStmtStartPageForm', 'AccountStmtForm')
  for (let i = 2; i <= pages; i++) {
    $ = cheerio.load(res.body)
    action = $('form[id="' + viewns + '"]').attr('action')
    const encodedUrl = $('input[name="javax.faces.encodedURL"]').attr('value')
    const viewState = $('input[name="javax.faces.ViewState"]').attr('value')
    const idPage = 'idx' + i.toString()
    res = await getNextPage({ action, encodedUrl, viewState, viewns, idPage })
    const holdsOnPage = parseTransactions(res.body, acc.id, 'hold')
    holds.push(...holdsOnPage)
  }

  transactions.push(...holds)
  return transactions
}

async function getNextPage ({ action, encodedUrl, viewState, viewns, idPage }) {
  const body = {
    'javax.faces.encodedURL': encodedUrl,
    'javax.faces.ViewState': viewState
  }
  body[viewns + '_SUBMIT'] = 1
  body[viewns + ':_idcl'] = viewns + ':scroller_BYN' + idPage
  body[viewns + ':scroller_BYN'] = idPage
  const res = await fetchUrl(action, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body
  }, response => response.success, message => new Error(''))
  return res
}

export function parseTransactions (html, accID, operationType) {
  const match = html.replace(/\r?\n|\r/g, '').match(/<tbody><span .*?<\/tbody>/)
  if (!match) {
    return []
  }
  const table = match[0]

  const div = '(?:</?div[^>]*>)*'
  const tr = '<span [^<]*</?tr></span>'
  const td = '<span [^<]*</?td></span>'
  const tdCardNumber = '<span [^<]*</?td>[^<]*</?td></span>'
  const dateTime = '<span [^>]*>(.[0-9.]*) (.[0-9:]*)</span>'
  const debitFlag = '<span [^>]*>(.[+-]*)</span>'
  const sum = '<span [^>]*>(.[0-9 .]*)</span>'
  const currency = '<span [^>]*>(.[A-Z]*)</span>'
  const tdColspan = '<span [^<]*<td colspan=[^>]*></span>'
  const comment = '<span [^>]*>Наименование операции: ([^<]*)</span>'
  const place = '(?:<span [^>]*>(?:Точка|Наименование/MCC-код точки) обслуживания: ([^<]*)</span>)?'
  const textFee = '<span [^>]*>Сумма комиссии [^<]*</span>'
  const textFeeComment = '(?:<span [^>]*>Комиссия за: [^<]*</span>)?'

  let regex
  if (operationType === 'operResultOk') {
    regex = new RegExp(tr + div + td + div +
      dateTime + div +
      td + div + td + div +
      debitFlag + div +
      td + div + td + div +
      sum + div +
      currency + div +
      td + div + td + div +
      sum + div +
      currency + div +
      td + div + tdCardNumber + div +
      tr + div + tr + div + tdColspan + div +
      comment + div +
      place + div +
      textFeeComment + div +
      textFee + div +
      sum + div +
      currency + div +
      td + div + tr,
    'ig'
    )
  } else {
    const trResult = '<span [^<]*<tr class=\'operResultProcess\'></span>'
    const authCode = '<span [^>]*>Код авторизации: [^<]*</span>'
    regex = new RegExp(trResult + div + td + div + td + td +
      dateTime + div +
      td + div + td + div +
      debitFlag + div +
      td + div + td + div +
      sum + div +
      currency + div +
      td + div + td + div +
      sum + div +
      currency + div +
      td + div + tdCardNumber + div +
      tr + div + trResult + div + tdColspan + div +
      comment + div +
      place + div +
      authCode + div +
      textFeeComment + div +
      textFee + div +
      sum + div +
      currency + div +
      td + div + tr,
    'ig'
    )
  }

  let m
  const transactions = []
  while ((m = regex.exec(table.replace(/\r?\n|\r/g, ''))) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++
    }
    transactions.push({
      accountID: accID,
      status: operationType,
      date: m[1],
      time: m[2],
      debitFlag: m[3],
      operationSum: m[4], // В валюте операции
      operationCurrency: m[5],
      inAccountSum: m[6], // В валюте счета
      inAccountCurrency: m[7],
      comment: m[8],
      place: m[9],
      fee: m[10]
    })
  }
  const opType = operationType === 'operResultOk' ? 'операций' : 'холдов'
  console.log(`>>> Загружено ${transactions.length} ${opType}.`)
  return transactions
}
