import { defaultsDeep, flatMap } from 'lodash'
import { fetchJson } from '../../common/network'
import { generateRandomString } from '../../common/utils'
import { BankMessageError, InvalidOtpCodeError } from '../../errors'

// transaction - операция прошедшая по карте, operation - операция по счёту

const BASE_URL = 'https://online.bankdabrabyt.by/services/v2/'
const CARD_BALANCE_URL = 'card/getBalance'
const CARD_STATEMENT_URL = 'products/getCardAccountFullStatementWithBlockedAmounts'
const DEPOSIT_STATEMENT_URL = 'products/getDepositAccountStatement'
const CHECKING_STATEMENT_URL = 'products/getCurrentAccountStatement'
const CREDIT_STATEMENT_URL = 'products/getCreditAccountStatement'

function generateDeviceID () {
  return generateRandomString(16)
}

async function fetchApiJson (url, options, predicate = () => true, normalizeResponse = res => res.body, error = (message) => console.assert(false, message)) {
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

  return normalizeResponse(response)
}

function validateResponse (response, predicate, error = (message) => console.assert(false, message)) {
  if (!predicate || !predicate(response)) {
    error('non-successful response')
  }
}

export async function login (login, password) {
  let body = await loginReq(login, password)
  let code = ''
  switch (body.errorInfo.error) {
    case '10415':
      code = await ZenMoney.readLine('Введите код из СМС', {
        time: 120000,
        inputType: 'text'
      })
      if (!code || !code.trim()) {
        throw new InvalidOtpCodeError()
      }
      body = await loginReq(login, password, code)
      break
    case '10004':
      throw new InvalidPreferencesError('Неверный логин или пароль')
    case '0':
      break
    default:
      throw new BankMessageError(body.errorInfo.errorText)
  }

  return body.sessionToken
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
  }, response => response.success, res => res.body, () => new InvalidPreferencesError('bad request'))
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
  res => res.body,
  message => new TemporaryError(message))).overviewResponse

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
  res => res.body,
  message => new TemporaryError(message))).balance

  return Number.parseFloat(accountBalance)
}

export async function fetchCardTransactions (sessionToken, accounts, fromDate, toDate) {
  console.log('Загрузка списка транзакций по картам...')
  toDate = toDate || new Date()
  const responses = await Promise.all(flatMap(accounts, (account) => {
    return fetchApiJson(CARD_STATEMENT_URL, {
      method: 'POST',
      headers: { session_token: sessionToken },
      body: {
        accountType: account.accountType,
        cardHash: account.cardHash,
        currencyCode: account.currencyCode,
        internalAccountId: account.id,
        reportData: {
          from: fromDate.getTime(),
          till: toDate.getTime()
        },
        rkcCode: account.rkcCode
      }
    }, response => response.body, response => ({ accountNumber: account.id, ...response.body }), message => new TemporaryError(message))
  }))

  const transactions = flatMap(responses, response => {
    return flatMap(response.operations, op => {
      const operationSign = Number.parseInt(op.operationSign)
      const isProcessed = !!op.transactionDate
      return {
        id: op.transactionAuthCode,
        accountId: response.accountNumber,
        operationName: op.operationName || '',
        operationDate: isProcessed ? new Date(op.transactionDate) : null,
        operationCurrency: isProcessed ? op.operationCurrency : op.transactionCurrency,
        operationAmount: (isProcessed ? op.operationAmount : op.transactionAmount) * operationSign,
        transactionDate: new Date(op.operationDate),
        transactionAmount: (isProcessed ? op.transactionAmount : op.operationAmount) * operationSign,
        transactionCurrency: isProcessed ? op.transactionCurrency : op.operationCurrency,
        merchant: op.operationPlace || null,
        mcc: op.mcc || op.merchantId || null,
        hold: !isProcessed
      }
    })
  })

  const filteredTransactions = transactions.filter(tr => tr.operationAmount !== 0 && tr.transactionDate >= fromDate)

  console.log(`Загружено ${filteredTransactions.length} операций.`)

  return filteredTransactions
}

export async function fetchOperations (sessionToken, accounts, fromDate, toDate) {
  console.log('Загрузка списка транзакций по депозитам...')
  toDate = toDate || new Date()
  const responses = await Promise.all(flatMap(accounts, (account) => {
    const requestURL = getRequestURL(account.type)
    return fetchApiJson(requestURL, {
      method: 'POST',
      headers: { session_token: sessionToken },
      body: {
        accountType: account.accountType,
        currencyCode: account.currencyCode,
        internalAccountId: account.id,
        reportData: {
          from: fromDate.getTime(),
          till: toDate.getTime()
        }
      }
    }, response => response.body, res => res.body, message => new TemporaryError(message))
  }))

  const operations = flatMap(responses, response => {
    return flatMap(response.operations, op => {
      const operationSign = Number.parseInt(op.operationSign)
      return {
        id: op.transactionAuthCode,
        accountId: response.accountNumber,
        operationName: op.operationName,
        operationDate: new Date(op.transactionDate),
        operationCurrency: op.operationCurrency,
        transactionCurrency: op.transactionCurrency,
        operationAmount: op.operationAmount * operationSign,
        hold: !!op.transactionDate
      }
    })
  })

  const filteredOperations = operations.filter(op => op !== undefined && op.operationAmount !== 0 && op.operationDate >= fromDate)

  console.log(`Загружено ${filteredOperations.length} операций.`)

  return filteredOperations
}

function getRequestURL (accountType) {
  switch (accountType) {
    case 'deposit':
      return DEPOSIT_STATEMENT_URL
    case 'checking':
      return CHECKING_STATEMENT_URL
    case 'loan':
      return CREDIT_STATEMENT_URL
    default:
      return new TemporaryError('Unknown account type')
  }
}
