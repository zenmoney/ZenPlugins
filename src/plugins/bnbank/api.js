import { flatMap } from 'lodash'
import { createDateIntervals as commonCreateDateIntervals } from '../../common/dateUtils'
import { fetchJson } from '../../common/network'
import { generateRandomString } from '../../common/utils'
import { card, deposit } from './converters'

const baseUrl = 'https://mb.bnb.by/services/v2/'

export function generateDeviceID () {
  return generateRandomString(16)
}

async function fetchApiJson (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  const response = await fetchJson(baseUrl + url, options)
  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }

  if (response.body && response.body.errorInfo && response.body.errorInfo.error !== '0' && response.body.errorInfo.errorText) {
    const errorDescription = response.body.errorInfo.errorText
    const errorMessage = 'Ответ банка: ' + errorDescription
    if (errorDescription.indexOf('Некорректно введен логин или пароль') >= 0) {
      throw new InvalidPreferencesError(errorMessage)
    }
    throw new TemporaryError(errorMessage)
  }

  return response
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
      applicID: '1.14',
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
    body: {
      cardAccount: {
        withBalance: null
      },
      corpoCardAccount: {
        withBalance: null
      },
      creditAccount: {},
      currentAccount: {
        withBalance: null
      },
      depositAccount: {}
    },
    headers: { 'session_token': token } }, response => response.body && response.body.overviewResponse && (response.body.overviewResponse.cardAccount || response.body.overviewResponse.depositAccount || response.body.overviewResponse.currentAccount), message => new TemporaryError(message))).body.overviewResponse

  var cards = []
  if (products.cardAccount) {
    cards = cards.concat(products.cardAccount)
  }
  if (products.corpoCardAccount) {
    cards = cards.concat(products.corpoCardAccount)
  }
  if (products.currentAccount) {
    cards = cards.concat(products.currentAccount)
  }
  return {
    cards: cards,
    deposits: products.depositAccount
  }
}

export function createDateIntervals (fromDate, toDate) {
  const interval = 10 * 24 * 60 * 60 * 1000 // 10 days interval for fetching data
  const gapMs = 1000
  return commonCreateDateIntervals({
    fromDate,
    toDate,
    addIntervalToDate: date => new Date(date.getTime() + interval - gapMs),
    gapMs
  })
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

  const response = await fetchApiJson('products/getBlockedAmountStatement', {
    method: 'POST',
    headers: { 'session_token': token },
    body: {
      cards: [
        account.cardHash
      ],
      internalAccountId: account.internalAccountId
    }
  }, response => response.body)
  let operations = response.body.operations ? response.body.operations : []
  for (let i = 0; i < operations.length; i++) {
    operations[i].accountNumber = account.syncID[0]
  }

  console.log(`>>> Загружено ${operations.length} операций.`)
  return operations
}
