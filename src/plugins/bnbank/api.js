import { fetchJson, parseXml } from '../../common/network'
import { flatMap } from 'lodash'
import { generateRandomString } from '../../common/utils'
import { deposit, card } from './converters'

const baseUrl = 'https://mb.bnb.by/services/v2/'

export function generateDeviceID () {
  return generateRandomString(16)
}

async function fetchApiJson (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  const response = await fetchJson(baseUrl + url, options)
  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }

  if (response.body.errorInfo.error !== '0' && response.body.errorInfo.errorText) {
    const errorDescription = response.body.errorInfo.errorText
    const errorMessage = 'Ответ банка: ' + errorDescription
    if (errorDescription.indexOf('Некорректно введен логин или пароль') >= 0) {
      throw new InvalidPreferencesError(errorMessage)
    }
    throw new TemporaryError(errorMessage)
  }

  return response
}

async function fetchXMLApi (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  const response = await fetchApiJson(url, options, predicate, error)
  return parseXml(response.body.komplatResponse[0].response)
}

function validateResponse (response, predicate, error) {
  if (!predicate || !predicate(response)) {
    error('non-successful response')
  }
}

export async function login (login, password) {
  const deviceID = ZenMoney.getData('device_id') ? ZenMoney.getData('device_id') : generateDeviceID()
  ZenMoney.setData('device_id', deviceID)

  const res = await fetchApiJson('session/login', {
    method: 'POST',
    body: {
      applicID: '1.6',
      clientKind: '0',
      deviceUDID: deviceID,
      login: login,
      password: password
    },
    sanitizeRequestLog: { body: { login: true, password: true } }
  }, response => response.success, message => new InvalidPreferencesError('Неверный логин или пароль'))

  return res.body.sessionToken
}

export async function fetchAccounts (token) {
  console.log('>>> Загрузка списка счетов...')
  const products = (await fetchApiJson('products/getUserAccountsOverview', {
    method: 'POST',
    headers: { 'session_token': token } }, response => response.body && response.body.overviewResponse && (response.body.overviewResponse.cardAccount || response.body.overviewResponse.depositAccount), message => new TemporaryError(message))).body.overviewResponse

  return {
    cards: products.cardAccount,
    deposits: products.depositAccount
  }
}

export function createDateIntervals (fromDate, toDate) {
  const interval = 10 * 24 * 60 * 60 * 1000 // 10 days interval for fetching data
  const dates = []

  let time = fromDate.getTime()
  let prevTime = null
  while (time < toDate.getTime()) {
    if (prevTime !== null) {
      dates.push([new Date(prevTime), new Date(time - 1000)])
    }

    prevTime = time
    time = time + interval
  }
  dates.push([new Date(prevTime), toDate])

  return dates
}

export async function fetchTransactions (token, accounts, fromDate, toDate = new Date()) {
  console.log('>>> Загрузка списка транзакций...')
  toDate = toDate || new Date()

  const dates = createDateIntervals(fromDate, toDate)
  const responses = await Promise.all(flatMap(accounts, (account) => {
    return dates.map(dates => {
      let url = ''
      let accountType = ''
      switch (account.type) {
        case card:
          url = 'products/getCardAccountFullStatement'
          accountType = '1'
          break
        case deposit:
          url = 'products/getDepositAccountStatement'
          accountType = '0'
          break
        default:
          return null
      }
      return fetchApiJson(url, {
        method: 'POST',
        headers: { 'session_token': token },
        body: {
          accountType: accountType,
          bankCode: '288',
          currencyCode: account.currencyCode,
          internalAccountId: account.id,
          reportData: {
            from: dates[0].getTime(),
            till: dates[1].getTime()
          },
          rkcCode: account.rkcCode
        }
      }, response => response.body)
    })
  }))
  const operations = flatMap(responses, response => {
    return flatMap(response.body.operations, d => d)
  })

  const filteredOperations = operations.filter(function (op) {
    return op.transactionDate > fromDate
  })

  console.log(`>>> Загружено ${filteredOperations.length} операций.`)
  return filteredOperations
}

export async function fetchLastCardTransactions (token, account) {
  console.log('>>> Загрузка списка последних транзакций для карты ' + account.title)
  let today = new Date()
  let monthAgo = new Date(today - 30 * 24 * 60 * 60 * 1000)

  const response = await fetchXMLApi('payment/simpleExcute', {
    method: 'POST',
    headers: { 'session_token': token },
    body: {
      komplatRequests: [
        {
          request: '<?xml version="1.0" encoding="Windows-1251" standalone="yes"?><PS_ERIP><GetExtractCardRequest><TerminalID>@{terminal_id_mb}</TerminalID><Version>3</Version><PAN Expiry="  #{' + account.cardHash + '@[card_expire]}">#{' + account.cardHash + '@[card_number]}</PAN><TypePAN>MS</TypePAN><DateFrom>' + getDate(monthAgo) + '</DateFrom> <DateTo>' + getDate(today) + '</DateTo> <MaxRecords>500</MaxRecords><RequestType>11</RequestType>/></GetExtractCardRequest></PS_ERIP>'
        }
      ]
    }
  }, response => response.body)
  const operations = flatMap(response.PS_ERIP.GetExtractCardResponse.BPC.OperationList.oper, d => {
    d.accountNumber = account.id
    return d
  })

  console.log(`>>> Загружено ${operations.length} операций.`)
  return operations
}

function getDate (time) {
  return String(time.getDate() + '/' + ('0' + (time.getMonth() + 1)).slice(-2) + '/' + String(time.getFullYear()) + ' ' + time.getHours() + ':' + time.getMonth() + ':' + time.getSeconds())
}
