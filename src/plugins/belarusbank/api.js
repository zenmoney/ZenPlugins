import cheerio from 'cheerio'
import { chunk, defaultsDeep } from 'lodash'
import padLeft from 'pad-left'
import { stringify } from 'querystring'
import { fetch } from '../../common/network'
import { retry, RetryError } from '../../common/retry'
import { BankMessageError, InvalidOtpCodeError, InvalidPreferencesError, TemporaryError, TemporaryUnavailableError } from '../../errors'

const baseUrl = 'https://ibank.asb.by'

async function fetchUrl (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  options = defaultsDeep(
    options,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
        'Accept-Language': 'ru'
      },
      sanitizeRequestLog: { headers: { Cookie: true } },
      sanitizeResponseLog: { headers: { 'set-cookie': true } }
    }
  )
  options.method = options.method || 'POST'
  options.stringify = stringify

  console.assert(url, 'NO url', url)
  console.assert(url.indexOf('undefined') === -1, 'undefined in url', url)

  let response

  try {
    response = await retry({
      getter: () => fetch(baseUrl + url, options),
      predicate: response => response.status < 500,
      maxAttempts: 3,
      delayMs: 4000
    })
  } catch (e) {
    if (e instanceof RetryError || /\[NTI]|\[NER]/.test(e.message)) {
      throw new TemporaryUnavailableError()
    } else {
      throw e
    }
  }

  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }

  const err = parseErrorMessage(response.body)
  if (err.indexOf('Сеанс работы с порталом завершен из-за длительного простоя') > -1) {
    throw new TemporaryError('Сессия завершена из-за длительного простоя. Запустите синхронизацию с банком заново.')
  }
  if (err.indexOf('Вы заблокированы из-за трёхкратного ошибочного ввод') >= 0) {
    throw new BankMessageError(err)
  }

  return response
}

function parseErrorMessage (html) {
  const $ = cheerio.load(html)
  return $('div[class="res"]')?.children('p#status_message.error')?.text() || ''
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
  let wrongCodes
  const codesRegexp = /^\s*(?:\d{4}[\s+]+){9}\d{4}\s*$/
  if (!prefs.codes0 || !codesRegexp.test(prefs.codes0)) {
    wrongCodes = '1-10'
  } else if (!prefs.codes1 || !codesRegexp.test(prefs.codes1)) {
    wrongCodes = '11-20'
  } else if (!prefs.codes2 || !codesRegexp.test(prefs.codes2)) {
    wrongCodes = '21-30'
  } else if (!prefs.codes3 || !codesRegexp.test(prefs.codes3)) {
    wrongCodes = '31-40'
  }
  if (wrongCodes) {
    throw new InvalidPreferencesError(`Неправильно введены коды ${wrongCodes}! Необходимо ввести 10 четырехзначных кодов через пробел или +.`)
  }

  let res
  let i = 0
  do {
    i++
    res = await fetchUrl('/wps/portal/ibank/', {
      method: 'GET'
    }, response => response.success || response.status === 502, message => new Error('Сайт не доступен'))
  } while (i < 5 && res.status === 502)
  if (res.status === 502) {
    throw new TemporaryUnavailableError()
  }

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
  const col = Math.floor(codenum / 10)
  const idx = codenum % 10
  const codes = prefs[`codes${col}`]
  if (!codes) {
    throw new InvalidPreferencesError(`Не введены коды ${col + 1}1-${col + 2}0`)
  }
  const code = codes.split(/\D+/g)[idx]

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

  // if (res.body.match(/Cмена пароля[^,]/)) {
  //   throw new BankMessageError('Закончился срок действия пароля. Задайте новый пароль в интернет-банке Беларусбанка')
  // }

  return res
}

export async function loginSMS (prefs) {
  let res
  let i = 0
  do {
    i++
    res = await fetchUrl('/wps/portal/ibank/', {
      method: 'GET'
    }, response => response.success || response.status === 502, message => new Error('Сайт не доступен'))
  } while (i < 5 && res.status === 502)
  if (res.status === 502) {
    console.assert('Сайт недоступен. Error 502')
  }

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
  let err = parseErrorMessage(res.body)
  if (err.indexOf('Необходимо настроить номер телефона для получения СМС') >= 0) {
    throw new BankMessageError(`${err}. Это можно сделать на сайте или в приложении Беларусбанка.`)
  }
  if (err.indexOf('Выбранный способ аутентификации отключён') >= 0) {
    throw new BankMessageError('Аутентификация по СМС отключена. Выберите в настройках аутентификацию по кодам или включите вход по СМС в приложении или на сайте банка.')
  }
  if (res.body.search(/Неправильно введён логин и\/или пароль/) >= 0) {
    throw new InvalidPreferencesError('Неверный логин или пароль от интернет-банка Беларусбанка')
  }

  const sms = await ZenMoney.readLine('Введите код из смс', {
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
  err = parseErrorMessage(res.body)
  if (err.indexOf('неправильный СМС-код') > -1) {
    throw new InvalidOtpCodeError()
  }

  // if (/мена пароля[^,]/.test(res.body)) {
  //   throw new BankMessageError('Закончился срок действия пароля. Задайте новый пароль в интернет-банке Беларусбанка')
  // }

  return res
}

export async function fetchURLAccounts (loginRequest) {
  console.log('>>> Загрузка страницы счетов...')
  const url = loginRequest.body.match(/href="\/([^"]+)">\s*Счета/i)
  const res = await fetchUrl('/' + url[1], {
    method: 'GET'
  }, response => response.success, message => new Error(''))

  const urlCards = res.body.match(/<a\s*href="([^"]+)".*Счета с карточкой.*<\/a>/i)
  const urlDeposits = res.body.match(/<a\s*href="([^"]+)".*Депозиты.*<\/a>/i)
  return {
    cards: urlCards[1],
    deposits: urlDeposits[1]
  }
}

function strDecoder (str) {
  if (str === null) {
    return null
  }
  let res = ''
  for (const s of str.split(';')) {
    const left = s.replace(/&.[0-9]{4}/i, '')

    res += left + String.fromCharCode(s.replace(`${left}&#`, ''))
  }
  return res
}

export async function fetchDeposits (url) {
  console.log('>>> Загрузка депозитов...')
  const res = await fetchUrl(url, {
    method: 'GET'
  }, response => response.success, message => new Error(''))

  return parseDeposits(res.body)
}

export async function fetchCards (url) {
  console.log('>>> Загрузка карточных/текущих аккаунтов...')
  const res = await fetchUrl(url, {
    method: 'GET'
  }, response => response.success, message => new Error(''))
  return parseCards(res.body)
}

export function parseCards (html) {
  html = html.replace(/\r?\n|\r/g, '')
  const accounts = []
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

    account.accountName = accountTable.children('td[class="tdAccountText"]').children('div').text()?.trim()
    if (
      account.accountName.indexOf('Новые карты') >= 0 ||
      !accountTable.children('td[class="tdAccountButton"]').children('a[title="Получить отчёт об операциях по счёту"]').toString()
    ) {
      return
    }
    account.accountNum = accountTable.children('td[class="tdId"]').children('div').text().replace(/\s+/g, '')

    const overdraftElem = $(elem).children('table[class="accountInfoTable"]').children('tbody').children('tr')
      .children('td[class="tdAccountDetails"]').children('div').children('span[class="tdAccountOverdraft"]')
    account.overdraftBalance = $(overdraftElem).children('nobr').text()
    account.overdraftCurrency = $(overdraftElem).text().split(' ').pop() || 'BYN'

    account.balance = accountTable.children('td[class="tdBalance"]').children('div').children('nobr').text() || null
    const currencyText = accountTable.children('td[class="tdBalance"]').children('div').text()
    account.currency = /Остаток временно недоступен/.test(currencyText)
      ? account.overdraftCurrency
      : currencyText.replace(account.balance, '').trim().split(' ')[0]
    account.transactionsData.additional = accountTable.children('td[class="tdAccountButton"]').children('a[title="Получить отчёт об операциях по счёту"]').attr('onclick').replace('return myfaces.oam.submitForm(', '').replace(');', '').match(/'(.[^']*)'/ig)
    account.accountId = account.transactionsData.additional[account.transactionsData.additional.length - 1].replace(/('|\\')/g, '')

    account.transactionsData.action = $('form[id="' + account.transactionsData.additional[0].replace(/'/g, '') + '"]').attr('action') || $('form').attr('action')

    // account.transactionsData.holdsData = accountTable.children('td[class="tdAccountButton"]').children('a[title="Получить отчёт по заблокированным операциям"]')
    //   .attr('onclick').replace('return myfaces.oam.submitForm(', '').replace(');', '').match(/'(.[^']*)'/ig)

    if (cardTable.children('td').length > 1) {
      account.type = 'ccard'
      account.cards = []
      cardTable.each(function (i, elem) {
        const card = {
          name: $(elem).children('td[class="tdNoPaddingBin"]').children('div').attr('title'),
          number: $(elem).children('td[class="tdNumber"]').children('div').text()?.trim(),
          id: $(elem).children('td[class="tdId"]').children('div').text()?.trim(),
          isActive: Boolean($(elem).children('td[class="tdNoPadding"]').children('div').attr('class') !== 'cellLable notActiveCard')
        }
        account.cards.push(card)
      })

      const hasActiveCards = account.cards.some(card => card.isActive)
      if (!hasActiveCards) {
        cardTable.each(function (i, elem) {
          const card = account.cards[i]
          if (!card.isActive) {
            const operations = $(elem).children('td[class="tdCardDropdown"]').find('option')
            const hasMiniStatement = operations.toArray().some(option => $(option).val().includes('miniStatement'))
            if (hasMiniStatement) {
              card.isActive = true
            }
          }
        })
      }
    } else {
      account.type = 'account'
    }
    accounts.push(account)
  })
  console.log(`>>> Загружено ${accounts.length} карточных/текущих аккаунтов.`)
  return accounts
}

export function parseDeposits (response) {
  const regex = /<td class="tdNoPadding" ><div.[^>]*><span.[^>]*>(.*?)<\/span><span.[^>]*>(.*?)<\/span><\/div><\/td><td class="tdNoPadding" ><div.[^>]*>(.*?)<\/div><\/td><td class="tdNoPadding" ><div.[^>]*><span.[^>]*>(.*?)<\/span><\/div><\/td><td class="tdNoPadding" ><div.[^>]*>(.*?)<\/div><\/td><td class="tdNoPadding" ><div.[^>]*>(.*?)<\/div><\/td>.*?X<\/a><div.[^>]*>(.*?)<\/div><\/div><\/div><\/td>/ig
  const deposits = []
  let m
  while ((m = regex.exec(response.replace(/\r?\n|\r/g, ''))) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++
    }
    if (/открыт/i.test(strDecoder(m[6]))) {
      deposits.push({
        id: (m[1] + m[2]).replace(/\s/g, ''),
        name: strDecoder(m[3]),
        balance: m[4],
        currency: m[5],
        details: strDecoder(m[7]),
        type: 'deposit'
      })
    }
  }
  return deposits
}

async function processPages (viewns, html, acc) {
  const match = html.match(/Страница \d+ из (\d+)/)
  const pages = match ? parseInt(match[1], 10) : null
  const transactions = /Наименование операции/.test(html) ? parseTransactions(html, acc.id) : []
  if (transactions.length === 0) {
    console.log('>>> Транзакции на 1й странице не найдены')
  }
  if (pages) {
    viewns = viewns.replace('accountStmtStartPageForm', 'AccountStmtForm')
    for (let i = 2; i <= pages; i++) {
      const $ = cheerio.load(html)
      let action = $(`form[id="${viewns}"]`).attr('action')
      if (!action) {
        viewns = $('form').attr('id')
        action = $('form').attr('action')
      }
      const encodedUrl = $('input[name="javax.faces.encodedURL"]').attr('value')
      const viewState = $('input[name="javax.faces.ViewState"]').attr('value')
      const idPage = `idx${i.toString()}`
      console.log(`>>> Загрузка транзакций по ${acc.title}. Страница ${i}`)
      const res = await getNextPage({ action, encodedUrl, viewState, viewns, idPage })
      transactions.push(...parseTransactions(res.body, acc.id))
    }
  }

  return transactions
}

function getTransactionsDates (fromDate, toDate) {
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
  const dateStart = padLeft(fromDate.getDate().toString(), 2, '0') + '.' +
    padLeft((fromDate.getMonth() + 1).toString(), 2, '0') + '.' +
    fromDate.getFullYear()
  const dateEnd = padLeft(toDate.getDate().toString(), 2, '0') + '.' +
    padLeft((toDate.getMonth() + 1).toString(), 2, '0') + '.' +
    toDate.getFullYear()

  return { dateStart, dateEnd }
}

async function fetchTransactionsList (viewns, id, html, acc, fromDate, toDate) {
  viewns = viewns.replace('ClientCardsDataForm', 'accountStmtStartPageForm')
  const $ = cheerio.load(html)
  let action = $(`form[id="${viewns}"]`).attr('action')
  if (!action) {
    viewns = $('form').attr('id')
    action = $('form').attr('action')
  }
  const { dateStart, dateEnd } = getTransactionsDates(fromDate, toDate)
  const body = {
    'javax.faces.encodedURL': $('input[name="javax.faces.encodedURL"]').attr('value'),
    'javax.faces.ViewState': $('input[name="javax.faces.ViewState"]').attr('value')
  }
  body[`${viewns}_SUBMIT`] = 1
  body[`${viewns}:_idcl`] = id
  body[`${viewns}:SFPCalendarFromID`] = dateStart
  body[`${viewns}:SFPCalendarToID`] = dateEnd

  console.log('>>> Загрузка транзакций по ' + acc.title)
  const res = await fetchUrl(action, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  }, response => response.success, message => new Error(''))

  return res.body
}

async function getAccountsListPage (html, viewns) {
  console.log('>>> Возврат к списку счетов')
  const $ = cheerio.load(html)
  let action = $(`form[id="${viewns}"]`).attr('action')
  if (!action) { // нет операций в истории или только 1 страница в истории
    viewns = $('form').attr('id')
    action = $('form').attr('action')
  }
  const body = {
    'javax.faces.encodedURL': $('input[name="javax.faces.encodedURL"]').attr('value'),
    'javax.faces.ViewState': $('input[name="javax.faces.ViewState"]').attr('value')
  }
  body[`${viewns}_SUBMIT`] = 1
  const id = html.match(/ id="(.{1,200})">Вернуться к списку счетов<\/a>/)
  body[`${viewns}:_idcl`] = id ? id[1] : html.match(/ id="(.{1,200})">Назад<\/a>/)[1]

  return await fetchUrl(action, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  }, response => response.success, message => new Error(''))
}

// async function processHolds (html, viewns, acc) {
//   const $ = cheerio.load(html)
//   viewns = acc.raw.transactionsData.holdsData[0].replace(/'/g, '')
//   let action = $(`form[id="${viewns}"]`).attr('action')
//   if (!action) {
//     viewns = $('form').attr('id')
//     action = $('form').attr('action')
//   }
//   const body = {
//     'javax.faces.encodedURL': $('input[name="javax.faces.encodedURL"]').attr('value'),
//     accountNumber: acc.raw.transactionsData.holdsData[3].replace(/'/g, ''),
//     'javax.faces.ViewState': $('input[name="javax.faces.ViewState"]').attr('value')
//   }
//
//   body[`${viewns}:acctIdSelField`] = acc.raw.accountName.replace('Счёт №', '')
//   body[`${viewns}_SUBMIT`] = 1
//   body[`${viewns}:_idcl`] = acc.raw.transactionsData.holdsData[1].replace(/'/g, '')
//
//   console.log('>>> Загрузка холдов по ' + acc.title)
//   const res = await fetchUrl(action, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/x-www-form-urlencoded'
//     },
//     body
//   }, response => response.success, message => new Error(''))
//   return await processPages(viewns, res.body, acc)
// }

export async function fetchCardsTransactions (acc, fromDate, toDate) {
  console.log(`>>> Выбор дат для загрузки транзакций по ${acc.title}`)

  const body = {
    'javax.faces.encodedURL': acc.raw.transactionsData.encodedURL,
    accountNumber: acc.raw.transactionsData.additional[3].replace(/'/g, ''),
    'javax.faces.ViewState': acc.raw.transactionsData.viewState
  }
  const viewns = acc.raw.transactionsData.additional[0].replace(/'/g, '')
  body[`${viewns}:acctIdSelField`] = acc.raw.accountName.replace('Счёт №', '')
  body[`${viewns}_SUBMIT`] = 1
  body[`${viewns}:_idcl`] = acc.raw.transactionsData.additional[1].replace(/'/g, '')

  let res = await fetchUrl(acc.raw.transactionsData.action, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  }, response => response.success, message => new Error(''))

  let transactions = []
  const match = res.body.match(/ id="(.{1,200})">Продолжить<\/a>/)
  if (match) {
    const transactionsViewns = viewns.replace('ClientCardsDataForm', 'accountStmtStartPageForm')
    const transactionsHtml = await fetchTransactionsList(transactionsViewns, match[1], res.body, acc, fromDate, toDate)
    transactions = await processPages(transactionsViewns, transactionsHtml, acc)

    res = await getAccountsListPage(transactionsHtml, viewns)
  }

  // const transactionsWithHolds = await processHolds(res.body, viewns, acc)
  //
  // return uniqWith(transactions.concat(transactionsWithHolds), isEqual)

  return transactions
}

async function getNextPage ({ action, encodedUrl, viewState, viewns, idPage }) {
  const body = {
    'javax.faces.encodedURL': encodedUrl,
    'javax.faces.ViewState': viewState
  }
  body[`${viewns}_SUBMIT`] = 1
  body[`${viewns}:_idcl`] = `${viewns}::scroller_BYN${idPage}`
  body[`${viewns}:scroller_BYN`] = idPage
  const res = await fetchUrl(action, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  }, response => response.success, message => new Error(''))
  return res
}

export function parseTransactions (html, accID) {
  const match = html.replace(/\r?\n|\r/g, '').match(/<tbody><span .*?<\/tbody>/)
  if (!match) {
    console.log('>>> No matching transacions/holds!')
    return []
  }

  const $ = cheerio.load(html)
  const $table = $('table[class="ibTable simple"]').children('tbody')

  const transactionsBlocks = $table.children('tr').toArray().filter(tr => {
    const filteredByOperationType = !tr.attribs.class ||
      tr.attribs.class.indexOf('operResultOk') > -1 ||
      tr.attribs.class.indexOf('operResultProcess') > -1
    return filteredByOperationType && !$(tr).children('td')?.children('table[class=clarOtherTable]')?.length
  })

  const thead = $('table[class="ibTable simple"]').children('thead').children('tr').children('th')
  const firstColumnIndex = $(thead).length && $(thead[0]).children('span')?.text() ? 0 : 1
  const transactions = chunk(transactionsBlocks, 2).map((transactionBlock) => {
    const status = $(transactionBlock[0])[0].attribs?.class || 'operResultOk'
    const transaction = $(transactionBlock[0]).children('td').toArray()
      .slice(firstColumnIndex, firstColumnIndex + 4)
      .reduce((accum, txDataPart, index) => {
        let dateTime
        switch (index) {
          case 0:
            dateTime = $(txDataPart).children('span').text().split(' ')
            accum.date = dateTime[0]
            accum.time = dateTime[1]
            break
          case 1:
            accum.debitFlag = $(txDataPart).children('span').text()
            break
          case 2:
            accum.operationSum = $(txDataPart).children('span').text()
            accum.operationCurrency = $(txDataPart).children('div').children('span').text()
            break
          case 3:
            accum.inAccountSum = $(txDataPart).children('span').text()
            accum.inAccountCurrency = $(txDataPart).children('div').children('span').text()
            break
          default:
            break
        }
        return accum
      }, {
        accountID: accID,
        status: status.replace(/[\\']/g, '')
      })
    const additionalInfo = $(transactionBlock[1]).children('td').children('div').toArray()
    for (const txDataPart of additionalInfo) {
      if (!transaction.comment) {
        const comment = $(txDataPart).children('span').text()?.match(/Наименование операции: (.+)/i)
        if (comment && comment.length > 1) {
          transaction.comment = comment[1]
          continue
        }
      }
      if (!transaction.place) {
        const place = $(txDataPart).children('span').text()?.match(/точк. обслуживания: (.+)/i)
        if (place && place.length > 1) {
          transaction.place = place[1]
          continue
        }
      }
      if (!transaction.fee) {
        const fee = $(txDataPart).children('span').text()?.match(/Сумма комиссии[^:]+: ?([0-9.,]+)/i)
        if (fee && fee.length > 1) {
          transaction.fee = fee[1]
          continue
        }
      }
    }
    return transaction
  })

  console.log(`>>> Загружено ${transactions.length} операций`)
  return transactions
}
