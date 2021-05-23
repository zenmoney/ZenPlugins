import { defaultsDeep, flatMap } from 'lodash'
import { fetchJson } from '../../common/network'
import { generateRandomString } from '../../common/utils'
import { BankMessageError, InvalidOtpCodeError } from '../../errors'

// transaction - операция прошедшая по карте, operation - операция по счёту

const BASE_URL = 'https://online.bankdabrabyt.by/services/v2/'
const CARD_BALANCE_URL = 'card/getBalance'
const CARD_STATEMENT_URL = 'products/getCardAccountFullStatement'

function generateDeviceID () {
  return generateRandomString(16)
}

async function fetchApiJson (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  options = defaultsDeep(
    options,
    {
      sanitizeRequestLog: { headers: { session_token: true } }
    }
  )
  const response = await fetchJson(BASE_URL + url, options)

  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }

  return response
}

function validateResponse (response, predicate, error = (message) => console.assert(false, message)) {
  if (!predicate || !predicate(response)) {
    error('non-successful response')
  }
}

export async function login (login, password) {
  let res = await loginReq(login, password)
  let code = ''
  switch (res.body.errorInfo.error) {
    case '10415':
      code = await ZenMoney.readLine('Введите код из СМС', {
        time: 120000,
        inputType: 'text'
      })
      if (!code || !code.trim()) {
        throw new InvalidOtpCodeError()
      }
      res = await loginReq(login, password, code)
      break
    case '10004':
      throw new InvalidPreferencesError('Неверный логин или пароль')
    case '0':
      break
    default:
      throw new BankMessageError(res.body.errorInfo.errorText)
  }

  return res.body.sessionToken
}

async function loginReq (login, password, smsCode) {
  let deviceID = ZenMoney.getData('device_id')
  if (!deviceID) {
    deviceID = generateDeviceID()
    ZenMoney.setData('device_id', deviceID)
  }

  const body = {
    applicID: '1.37',
    clientKind: 1,
    deviceUDID: deviceID,
    login: login,
    password: password
  }
  if (smsCode !== '') {
    body.confirmationData = smsCode
  }
  return fetchApiJson('session/login', {
    method: 'POST',
    body: body,
    sanitizeRequestLog: { body: { login: true, password: true, deviceUDID: true, confirmationData: true } },
    sanitizeResponseLog: { body: { sessionToken: true } }
  }, response => response.success, message => new InvalidPreferencesError('bad request'))
}

export async function fetchAccounts (sessionToken) {
  console.log('>>> Загрузка счетов...')
  const accounts = (await fetchApiJson('products/getUserAccountsOverview', {
    method: 'POST',
    headers: { session_token: sessionToken },
    body: {
      cardAccount: {
        withBalance: 'null'
      },
      corpoCardAccount: {},
      creditAccount: {},
      currentAccount: {},
      depositAccount: {},
      additionCardAccount: {}
    }
  }, response => response.body && response.body.overviewResponse,
  message => new TemporaryError(message))).body.overviewResponse

  const cardAccounts = accounts.cardAccount

  for (let i = 0; i < cardAccounts.length; i++) {
    cardAccounts[i].balance = await fetchCardAccountBalance(sessionToken, cardAccounts[i].cards[0].cardHash)
  }

  return accounts
}

export async function fetchCardAccountBalance (sessionToken, cardHash) {
  console.log('>>> Загрузка баланса карточного счёта')
  const accountBalance = (await fetchApiJson(CARD_BALANCE_URL, {
    method: 'POST',
    headers: { session_token: sessionToken },
    body: {
      cardHash
    }
  }, response => response.body && response.body.balance,
  message => new TemporaryError(message))).body.balance

  return Number.parseFloat(accountBalance)
}

export async function fetchCardTransactions (sessionToken, accounts, fromDate, toDate) {
  console.log('Загрузка списка транзакций...')
  toDate = toDate || new Date()
  const responses = await Promise.all(flatMap(accounts, (account) => {
    return fetchApiJson(CARD_STATEMENT_URL, {
      method: 'POST',
      headers: { session_token: sessionToken },
      body: {
        accountType: account.accountType,
        cardHash: account.cardHash,
        currencyCode: account.instrumentCode,
        internalAccountId: account.id,
        reportData: {
          from: fromDate.getTime(),
          till: toDate.getTime()
        },
        rkcCode: account.rkcCode
      }
    }, response => response.body)
  }))

  const operations = flatMap(responses, response => {
    let counter = 1
    return flatMap(response.body.operations, op => {
      const operationSign = Number.parseInt(op.operationSign)
      return {
        id: op.transactionAuthCode || counter++,
        account_id: op.accountNumber,
        operationName: op.operationName,
        operationDate: new Date(op.transactionDate), // подумать надо ли
        operationCurrencyCode: op.operationCurrency, // подумать надо ли
        operationAmount: op.operationAmount * operationSign, // подумать надо ли
        transactionDate: new Date(op.operationDate), // подумать надо ли
        transactionAmount: op.transactionAmount * operationSign, // подумать надо ли
        transactionCurrencyCode: op.transactionCurrency,
        merchant: op.operationPlace || null,
        hold: false // надо проверить
      }
    })
  })

  const filteredOperations = operations.filter(op => op !== undefined && op.operationAmount !== 0 && op.transactionDate >= fromDate)

  console.log(`Загружено ${filteredOperations.length} операций.`)

  return filteredOperations
}
