import * as setCookie from 'set-cookie-parser'
import { fetchJson } from '../../common/network'
import { retry } from '../../common/retry'
import { BankMessageError, InvalidLoginOrPasswordError, InvalidOtpCodeError, TemporaryUnavailableError } from '../../errors'

const baseUrl = 'https://ib.sinara.ru/json/'
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36'

function readCookies () {
  const cookies = ZenMoney.getData('cookies', {})
  let cookiesString = ''
  for (const name in cookies) {
    const value = cookies[name]
    if (cookiesString) {
      cookiesString += '; '
    }
    cookiesString += name + '=' + value
  }
  return cookiesString
}

function updateCookies (setCookieString) {
  const cookiesObj = ZenMoney.getData('cookies', {})
  const setCookies = setCookie.parse(setCookie.splitCookiesString(setCookieString))
  for (const cookie of setCookies) {
    cookiesObj[cookie.name] = cookie.value
  }
  ZenMoney.setData('cookies', cookiesObj)
  ZenMoney.saveData()
}

async function fetchApiJson (url, options = {}, ignoreClientErrors = false) {
  const cookies = readCookies()
  options.headers = {
    'User-Agent': userAgent,
    'Sec-Fetch-Site': 'same-site',
    'Sec-Fetch-Mode': 'cors',
    Referer: 'https://ib.sinara.ru/',
    ...cookies && { Cookie: cookies },
    ...options.headers
  }
  options.sanitizeRequestLog = { headers: { Cookie: true }, body: { login: true, password: true } }
  options.sanitizeResponseLog = { headers: { 'set-cookie': true } }
  const response = await retry({
    getter: () => fetchJson(baseUrl + url, options),
    predicate: response => response.status < 500,
    maxAttempts: 3
  })
  if (response.status >= 500) {
    throw new TemporaryUnavailableError()
  }
  if (!ignoreClientErrors && Array.isArray(response.body)) {
    const bankMessage = response.body.map(item => item.message).join('.')
    throw new BankMessageError(bankMessage)
  }
  if (response.headers && response.headers['set-cookie']) {
    updateCookies(response.headers['set-cookie'])
  }
  return response
}

export async function login (login, password) {
  await fetchApiJson('get_session_ttl', {}, true)
  const pingResponse = await fetchApiJson('ping', {}, true)
  if (pingResponse.status === 200 && pingResponse.body.result === 'ok') {
    return
  }
  const loginResponse = await fetchApiJson('login', {
    method: 'POST',
    body: {
      bank: 'SKB',
      login,
      password,
      osType: 'web'
    }
  })
  if (loginResponse.status === 400) {
    throw new InvalidLoginOrPasswordError()
  }
  console.assert(loginResponse.status === 200, 'Не удалось залогиниться', { loginResponse })

  const sms = await ZenMoney.readLine('Введите код из смс')
  if (sms === '') {
    throw new InvalidOtpCodeError()
  }
  const authResponse = await fetchApiJson('auth', {
    method: 'POST',
    body: {
      auth_code: sms
    }
  })
  if (authResponse.status === 400) {
    throw new InvalidOtpCodeError()
  }
  console.assert(authResponse.status === 200, 'Не удалось проверить sms-код', { authResponse })
}

export async function fetchProducts () {
  const productsResp = await fetchApiJson('v2/products?getAll=true')
  console.assert(productsResp.status === 200, 'Не удалось получить список счетов', { productsResp })
  return productsResp.body
}

/**
 * Возвращает true для тех операций из листинга, для которых не хватает какой-то информации, и нужно
 * запросить отдельным запросом детали.
 * @param op объект операции из ответа
 * @returns {boolean}
 */
function needOperationDetails (op) {
  return (
    // Транзакция и сумма в иностранной валюте, нужно узнать сумму списания (пополнения?) в рублях
    op.view.amounts.currency !== 'RUB' ||

    // Транзакция без аккаунта (такое бывает при стягивании с других карт),
    // дополнительные идентификаторы будут в деталях.
    !op.view.productAccount ||

    // Переводы между счетами.
    // В краткой сводке не хватает информации о том, на какой счет ушел перевод.
    op.view.direction === 'internal'
  )
}

export async function fetchTransactions (fromDate, toDate = null) {
  const chunkSize = 50
  const transactions = []
  let offset = 0
  let stopIterate = false
  while (!stopIterate) {
    const operationsResp = await fetchApiJson('customer/operation/physical/list?max=' + chunkSize + '&offset=' + offset)
    console.assert(operationsResp.status === 200, 'Не удалось получить список операций', { operationsResp })
    for (const op of operationsResp.body.operations) {
      const opDate = Date.parse(op.view.dateCreated)
      if (toDate && opDate > toDate.getTime()) {
        // Пропускаем слишком новые транзакции
        continue
      }
      if (fromDate && opDate < fromDate.getTime()) {
        // Транзакция уже слишком старая, остальные будут еще старее, выходим из внешнего цикла
        stopIterate = true
        break
      }
      if (needOperationDetails(op)) {
        const detailsResp = await fetchApiJson('operations/' + op.info.operationType + '_details?id=' + op.info.id)
        console.assert(detailsResp.status === 200, 'Не удалось получить транзакцию #' + op.info.id, { detailsResp })
        op.details = detailsResp.body
      }
      transactions.push(op)
    }
    if (operationsResp.body.operations.length < chunkSize) {
      break
    }
    offset += chunkSize
  }
  return transactions
}
