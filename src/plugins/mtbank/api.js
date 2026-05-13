import { defaultsDeep, flatMap } from 'lodash'
import { createDateIntervals as commonCreateDateIntervals } from '../../common/dateUtils'
import { fetchJson } from '../../common/network'
import { BankMessageError, InvalidOtpCodeError, TemporaryError } from '../../errors'
import { getDate } from './converters'

const baseUrl = 'https://mybank.by/api/v1/'
const statementRequestDelayMs = 50
const statementParallelWorkerCount = 2
const statementRetryCount = 2
const statementRetryDelayMs = 1000

async function fetchApiJson (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  options = defaultsDeep(
    options,
    {
      headers: {
        Origin: 'https://mybank.by',
        Referer: 'https://mybank.by/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': 'macOS'
      }
    },
    {
      sanitizeRequestLog: { headers: { Cookie: true } },
      sanitizeResponseLog: { headers: { 'set-cookie': true } }
    }
  )
  const response = await fetchJson(baseUrl + url, options)

  if (response.body && response.body.error) {
    if ([
      'phone',
      'USER_NOT_FOUND'
    ].indexOf(response.body.error.code) >= 0) {
      throw new InvalidPreferencesError('Неверный номер телефона')
    }
    if ([
      'PASSWORD_ERROR'
    ].indexOf(response.body.error.code) >= 0) {
      throw new InvalidPreferencesError('Неверный номер телефона или пароль')
    }
    if ([
      'USER_TEMP_LOCKED',
      'INTERNAL_SERVER_ERROR',
      'SMS_SENDING_LOCKED',
      'UNSUPPORTED_VERSION',
      'USER_BLOCKED',
      'ABS_ERROR'
    ].indexOf(response.body.error.code) >= 0) {
      const errorDescription = response.body.error.description || response.body.error.error_description
      const errorMessage = errorDescription + (response.body.error.lockedTime && response.body.error.lockedTime !== 'null' ? response.body.error.lockedTime : '')
      throw new BankMessageError(errorMessage)
    }
  }

  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }

  if (!response.body.success &&
    response.body.error &&
    response.body.error.description &&
    response.body.error.description.indexOf('Неверное значение contractCode') === 0) {
    const errorDescription = response.body.error.description
    if (errorDescription.indexOf('не принадлежит клиенту c кодом') >= 0 ||
      errorDescription.indexOf('Дата запуска/внедрения попадает в период запрашиваемой выписки') >= 0 ||
      errorDescription.indexOf('Получены не все обязательные поля') >= 0) {
      console.log('Ответ банка: ' + errorDescription)
      return false
    }
    const errorMessage = errorDescription + (response.body.error.lockedTime && response.body.error.lockedTime !== 'null' ? response.body.error.lockedTime : '')
    throw new BankMessageError(errorMessage)
  }

  return response
}

function validateResponse (response, predicate, error = (message) => new TemporaryError(message)) {
  if (!predicate || !predicate(response)) {
    const maybeError = error('non-successful response')
    throw maybeError !== undefined ? maybeError : new TemporaryError('non-successful response')
  }
}

function parseCookies (response) {
  const map = new Map()

  if (!response.headers) return map // for tests

  const cookieString = response.headers['set-cookie']

  if (!cookieString) return map

  const cookies = cookieString.split(/,\s*(?=[^;]+?=)/)

  for (const cookie of cookies) {
    const [pair] = cookie.split(';')
    const [key, value] = pair.split('=')
    if (key && value) {
      map.set(key.trim(), value.trim())
    }
  }

  return map
}

const mapToCookieHeader = (map) => [...map.entries()].map(([key, value]) => `${key}=${value}`).join('; ')
const cloneCookies = (map) => new Map(map)

function updateCookies (sessionCookies, response) {
  if (!response || !response.headers) return

  for (const [key, value] of parseCookies(response).entries()) {
    sessionCookies.set(key, value)
  }
}

async function fetchApiJsonWithSessionCookies (sessionCookies, url, options, predicate, error) {
  const response = await fetchApiJson(url, {
    ...options,
    headers: {
      ...options?.headers,
      Cookie: mapToCookieHeader(sessionCookies)
    }
  }, predicate, error)
  updateCookies(sessionCookies, response)
  return response
}

export async function login (login, password) {
  const cookies = new Map()

  let res = await fetchApiJson('login/userIdentityByPhone', {
    method: 'POST',
    body: { phoneNumber: login, loginWay: '1' },
    sanitizeRequestLog: { body: { phoneNumber: true } }
  }, response => response.body.success)
  updateCookies(cookies, res)

  res = await fetchApiJsonWithSessionCookies(
    cookies,
    'login/checkPassword4',
    {
      method: 'POST',
      body: { password, version: '2.1.18' },
      sanitizeRequestLog: { body: { password: true } },
      sanitizeResponseLog: {
        body: {
          data: {
            smsInfo: {
              phone: true
            },
            userInfo: true
          }
        }
      }
    },
    (response) => response.body.success
  )

  if (res.body.data.nextOperation === 'SMS') {
    // SMS-code confirmation needed
    const smsCode = await ZenMoney.readLine('Введите код из СМС сообщения', {
      time: 30000
    })
    if (!smsCode) {
      throw new InvalidOtpCodeError()
    }
    await fetchApiJsonWithSessionCookies(
      cookies,
      'login/checkSms',
      {
        method: 'POST',
        body: { smsCode },
        sanitizeRequestLog: { body: { smsCode: true } }
      },
      (response) => response.body.success
    )
  }

  await fetchApiJsonWithSessionCookies(
    cookies,
    'user/userRole',
    {
      method: 'POST',
      body: res.body.data.userInfo.dboContracts[0],
      sanitizeRequestLog: { body: true }
    },
    (response) => response.body.success,
    (message) => new TemporaryError(message)
  )

  return cookies
}

export async function fetchAccounts (sessionCookies) {
  console.log('>>> Загрузка списка счетов...')

  const response = await fetchApiJsonWithSessionCookies(sessionCookies, 'user/loadUser', {}, response => response.body && response.body.data && response.body.data.products,
    message => new TemporaryError(message))

  return response.body.data.products
}

function formatDate (date) {
  return date.toISOString().replace('T', ' ').split('.')[0]
}

function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isRetriableStatementError (error) {
  const message = String(error && error.message ? error.message : error)
  return message.includes('[NTI]') ||
    message.includes('[NER]') ||
    message.includes('Request timed out')
}

function getStatementContext (account, startDate, endDate) {
  return `счет ${account.id}, период ${formatDate(startDate)} - ${formatDate(endDate)}`
}

function validateStatementResponse (response, account, startDate, endDate) {
  const context = getStatementContext(account, startDate, endDate)

  if (!response || !response.body || response.body.success !== true || !Array.isArray(response.body.data)) {
    throw new TemporaryError(`Банк вернул некорректный ответ при загрузке операций (${context})`)
  }

  for (const statement of response.body.data) {
    if (!statement || !Array.isArray(statement.operations)) {
      throw new TemporaryError(`Банк вернул некорректный ответ при загрузке операций (${context})`)
    }
  }
}

async function fetchStatementOperations (sessionCookies, account, startDate, endDate) {
  const context = getStatementContext(account, startDate, endDate)

  for (let attempt = 0; attempt <= statementRetryCount; attempt++) {
    try {
      const response = await fetchApiJsonWithSessionCookies(sessionCookies, 'product/loadOperationStatements', {
        method: 'POST',
        body: {
          contractCode: account.id,
          accountIdenType: account.productType,
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          halva: false
        }
      }, response => response.body)

      if (!response) {
        return []
      }

      validateStatementResponse(response, account, startDate, endDate)

      return flatMap(response.body.data, statement => statement.operations.map(operation => ({
        ...operation,
        accountId: statement.accountId,
        description: operation.description || ''
      })))
    } catch (error) {
      if (!isRetriableStatementError(error) || attempt === statementRetryCount) {
        if (error instanceof BankMessageError) {
          throw error
        }
        throw new TemporaryError(`Не удалось загрузить операции (${context}): ${error.message || error}`)
      }

      const retryDelayMs = statementRetryDelayMs * Math.pow(2, attempt)
      console.log(`>>> Повтор загрузки операций (${context}), попытка ${attempt + 2}/${statementRetryCount + 1} через ${retryDelayMs} мс...`)
      await delay(retryDelayMs)
    }
  }

  return []
}

async function fetchAccountOperations (sessionCookies, account, intervals) {
  const operations = []

  for (const [intervalIndex, [startDate, endDate]] of intervals.entries()) {
    operations.push(...await fetchStatementOperations(sessionCookies, account, startDate, endDate))

    if (statementRequestDelayMs > 0 && intervalIndex < intervals.length - 1) {
      await delay(statementRequestDelayMs)
    }
  }

  return operations
}

async function fetchTransactionsSequentially (sessionCookies, accounts, intervals) {
  const operations = []

  for (const account of accounts) {
    operations.push(...await fetchAccountOperations(sessionCookies, account, intervals))
  }

  return operations
}

function shouldUseParallelAccountWorkers (accounts) {
  return accounts.length > 1
}

async function fetchTransactionsWithParallelAccountWorkers (sessionCookies, accounts, intervals) {
  const workerCount = Math.min(statementParallelWorkerCount, accounts.length)
  let nextAccountIndex = 0
  let workerError = null

  const workers = Array.from({ length: workerCount }, async () => {
    const workerCookies = cloneCookies(sessionCookies)
    const workerOperations = []

    while (!workerError) {
      const accountIndex = nextAccountIndex++
      if (accountIndex >= accounts.length) {
        break
      }

      try {
        workerOperations.push(...await fetchAccountOperations(workerCookies, accounts[accountIndex], intervals))
      } catch (error) {
        workerError = workerError || error
      }
    }

    return workerOperations
  })

  const workerResults = await Promise.all(workers)

  if (workerError) {
    throw workerError
  }

  return flatMap(workerResults, operations => operations)
}

export function createDateIntervals (fromDate, toDate) {
  const interval = 20 * 24 * 60 * 60 * 1000 // 20-day interval for fetching data
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

  const intervals = createDateIntervals(fromDate, toDate || new Date())
  const sessionCookiesSnapshot = cloneCookies(sessionCookies)
  let operations

  if (shouldUseParallelAccountWorkers(accounts)) {
    console.log(`>>> Параллельная загрузка операций по счетам (${Math.min(statementParallelWorkerCount, accounts.length)} workers)...`)
    try {
      operations = await fetchTransactionsWithParallelAccountWorkers(sessionCookiesSnapshot, accounts, intervals)
    } catch (error) {
      console.log(`>>> Параллельная загрузка операций не удалась, повторяем последовательно: ${error.message || error}`)
      operations = await fetchTransactionsSequentially(cloneCookies(sessionCookiesSnapshot), accounts, intervals)
    }
  } else {
    operations = await fetchTransactionsSequentially(sessionCookiesSnapshot, accounts, intervals)
  }

  const filteredOperations = operations.filter(function (op) {
    const date = op.transDate ? getDate(op.transDate) : getDate(`${op.operationDate} 00:00:00`)
    return op !== undefined && op.status !== 'E' && date > fromDate && !op.description.includes('Гашение кредита в виде "овердрафт" по договору')
  })

  console.log(`>>> Загружено ${filteredOperations.length} операций.`)
  return filteredOperations
}
