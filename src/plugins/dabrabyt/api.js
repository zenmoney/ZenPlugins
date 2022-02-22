import { defaultsDeep } from 'lodash'
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
    login,
    password
  }
  if (smsCode !== '') {
    body.confirmationData = smsCode
  }
  return (await fetchApiJson('session/login', {
    method: 'POST',
    body,
    sanitizeRequestLog: { body: { login: true, password: true, deviceUDID: true, confirmationData: true } },
    sanitizeResponseLog: { body: { sessionToken: true } }
  }, response => response.success, () => new InvalidPreferencesError('bad request'))).body
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

  const cardAccounts = accounts.cardAccount || []

  for (const acc of cardAccounts) {
    const cardHash = acc.cards?.[0].cardHash
    if (cardHash) {
      acc.balance = await fetchCardAccountBalance(sessionToken, cardHash)
    }
  }

  const corporateCardAccount = accounts.corporateCardAccount || []

  for (const acc of corporateCardAccount) {
    const cardHash = acc.corpoCards?.[0].cardHash
    if (cardHash) {
      acc.balance = await fetchCardAccountBalance(sessionToken, cardHash)
    }
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

export async function fetchTransactions (sessionToken, product, fromDate, toDate) {
  switch (product.type) {
    case 'ccard': {
      const response = await fetchApiJson(CARD_STATEMENT_URL, {
        method: 'POST',
        headers: { session_token: sessionToken },
        body: {
          accountType: product.accountType,
          cardHash: product.cardHash,
          currencyCode: product.currencyCode,
          internalAccountId: product.id,
          reportData: {
            from: fromDate.getTime(),
            till: toDate.getTime()
          },
          rkcCode: product.rkcCode
        }
      }, response => response.body.operations, message => new TemporaryError(message))
      return response.body?.operations || []
    }
    case 'deposit':
    case 'checking':
    case 'loan': {
      const requestURL = getRequestURL(product.type)
      const response = await fetchApiJson(requestURL, {
        method: 'POST',
        headers: { session_token: sessionToken },
        body: {
          accountType: product.accountType,
          currencyCode: product.currencyCode,
          internalAccountId: product.id,
          reportData: {
            from: fromDate.getTime(),
            till: toDate.getTime()
          }
        }
      }, response => response.body.operations, message => new TemporaryError(message))
      return response.body?.operations || []
    }
    default: {
      console.assert(false, 'unknown account type')
    }
  }
}
