/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import { parse, splitCookiesString } from 'set-cookie-parser'
import { fetchJson } from '../../common/network'

let apiUri = ''
let xXSrfToken = 'undefined'

const httpSuccessStatus = 200

const setApiUri = (uri) => {
  apiUri = uri
}

const setXXSrfToken = (value) => {
  xXSrfToken = value
}

const createHeaders = (rid) => {
  return {
    'channel': 'web',
    'platform': 'web',
    'Sec-Fetch-Mode': 'cors',
    'X-Request-Id': rid,
    'X-XSRF-TOKEN': xXSrfToken,
    'Connection': 'Keep-Alive',
    'Referer': apiUri.match(/(https?:\/\/[^/]+)/)[1] + '/',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36'
  }
}

async function auth (cardNumber, password) {
  let rid = generateHash()

  let response = await fetchJson(`${apiUri}/v0001/authentication/auth-by-secret?${makeQueryString(rid)}`, {
    log: true,
    method: 'POST',
    body: {
      principal: cardNumber,
      secret: password,
      type: 'AUTO'
    },
    headers: createHeaders(rid),
    sanitizeRequestLog: {
      body: {
        principal: true,
        secret: true
      }
    },
    sanitizeResponseLog: {
      headers: true
    }
  })

  if (response.status === httpSuccessStatus) {
    setTokenFromResponce(response)

    const s = response.body.status

    if (s === 'OTP_REQUIRED') {
      rid = generateHash()

      const code = await ZenMoney.readLine('Введите код из SMS или push-уведомления', {
        time: 120000,
        inputType: 'number'
      })

      const otpResponse = await fetchJson(`${apiUri}/v0001/authentication/confirm?${makeQueryString(rid)}`, {
        log: true,
        method: 'POST',
        body: {
          otp: code,
          principal: cardNumber
        },
        headers: createHeaders(rid),
        sanitizeRequestLog: {
          body: {
            otp: true,
            principal: true
          }
        },
        sanitizeResponseLog: {
          headers: true
        }
      })

      assertResponseSuccess(otpResponse)

      setTokenFromResponce(otpResponse)
    } else if (s === 'OK') {
      let reason
      const reasonUnknownCardNumber = 'неверный номер карты'
      const reasonWrongPassword = 'неверный номер карты или пароль'
      const reasonLocked = 'доступ временно запрещен'
      const reasonTechnicalWorks = 'технические работы в банке'

      const statusesUnknownCardNumber = [
        'CANNOT_FIND_SUBJECT',
        'PRINCIPAL_IS_EMPTY',
        'CANNOT_FOUND_AUTHENTICATION_PROVIDER',
        'CARD_IS_ARCHIVED'
      ]
      const statusesWrongPassword = [
        'AUTH_WRONG',
        'EMPTY_SECRET_NOT_ALLOWED'
      ]
      const statusesLocked = [
        'AUTH_LOCKED_TEMPORARY'
      ]
      const statusesTechnicalWorks = [
        'CORE_NOT_AVAILABLE_ERROR',
        'CORE_UNAVAILABLE'
      ]

      const codesWrongEan = [
        'EAN_OUT_OF_RANGE',
        'EAN_MUST_HAVE_13_SYMBOLS'
      ]

      if (statusesUnknownCardNumber.indexOf(s) !== -1) {
        reason = reasonUnknownCardNumber
      } else if (s === 'VALIDATION_FAIL' && codesWrongEan.indexOf(response.body.messages[0].code) !== -1) {
        reason = reasonUnknownCardNumber
      } else if (statusesWrongPassword.indexOf(s) !== -1) {
        reason = reasonWrongPassword
      } else if (statusesLocked.indexOf(s) !== -1) {
        reason = reasonLocked
      } else if (statusesTechnicalWorks.indexOf(s) !== -1) {
        reason = reasonTechnicalWorks
      } else {
        reason = null
      }
      if (reason) {
        throw new TemporaryError(`Не удалось авторизоваться: ${reason}`)
      } else {
        console.assert(false, 'Не удалось авторизоваться', response)
      }
    } else {
      console.assert(false, 'Не удалось авторизоваться', response)
    }
  } else {
    console.assert(false, 'Не удалось авторизоваться', response)
  }
}

async function checkSession () {
  const rid = generateHash()

  const response = await fetchJson(`${apiUri}/v0001/ping/session?${makeQueryString(rid)}`, {
    log: true,
    headers: createHeaders(rid)
  })

  assertResponseSuccess(response)

  setTokenFromResponce(response)

  return response.body.data.authenticated
}

async function fetchCards () {
  const rid = generateHash()

  const response = await fetchJson(`${apiUri}/v0002/cards?${makeQueryString(rid)}`, {
    log: true,
    headers: createHeaders(rid),
    sanitizeRequestLog: {},
    sanitizeResponseLog: {
      body: {
        data: {
          bankInfo: true,
          phone: true
        }
      }
    }
  })

  assertResponseSuccess(response)

  return response.body.data
}

async function fetchCredits () {
  const rid = generateHash()

  const response = await fetchJson(`${apiUri}/v0001/credit?${makeQueryString(rid)}`, {
    log: true,
    headers: createHeaders(rid),
    sanitizeRequestLog: {},
    sanitizeResponseLog: {
      body: {
        data: {
          bankAcc: true,
          creditContractNumber: true
        }
      }
    }
  })

  assertResponseSuccess(response, [
    'OK',
    'CREDIT_NOT_FOUND_ERROR'
  ])

  return response.body.hasOwnProperty('data')
    ? response.body.data
    : []
}

async function fetchWallets () {
  const rid = generateHash()

  const response = await fetchJson(`${apiUri}/v0001/wallets?${makeQueryString(rid)}`, {
    log: true,
    headers: createHeaders(rid),
    sanitizeRequestLog: {},
    sanitizeResponseLog: {}
  })

  assertResponseSuccess(response)

  return response.body.hasOwnProperty('data') && response.body.data.hasOwnProperty('wallets')
    ? response.body.data.wallets
    : []
}

async function fetchTransactions (dateFrom, contractIds) {
  let transactions = []

  for (const item of contractIds) {
    let data = await fetchTransactionsByContractId(dateFrom, item)
    for (const item of data) {
      transactions.push(item)
    }
  }

  return transactions
}

async function fetchTransactionsByContractId (dateFrom, contractId) {
  let isFirstPage = true
  let transactions = []

  const lastSyncTime = new Date(dateFrom).getTime()
  const pagination = {
    limit: 20,
    offset: 0,
    total: null
  }

  let searchAfter = ''

  console.debug('last sync: ' + lastSyncTime + ' (' + dateFrom + ')')

  while (isFirstPage || pagination.offset < pagination.total) {
    const result = await fetchTransactionsInternal(pagination.limit, lastSyncTime, searchAfter, contractId)

    if (isFirstPage) {
      pagination.total = result.data.totalCount
      isFirstPage = false
    }

    const loadNext = result.data.items
      .filter((transaction) => {
        searchAfter = transaction.date + ', ' + transaction.id

        return transaction.itemType === 'OPERATION' && ('money' in transaction)
      })
      .every((transaction) => {
        const isActual = transaction.date > lastSyncTime

        isActual && transactions.push(transaction)

        return isActual
      })

    if (loadNext) {
      pagination.offset += pagination.limit
    } else {
      break
    }
  }

  return transactions
}

async function fetchTransactionsInternal (limit, gte, searchAfter, contractId) {
  const rid = generateHash()

  let query = {
    gte: gte,
    lte: '',
    queryString: '',
    filters: '',
    contractIds: contractId,
    limit: 20
  }

  if (searchAfter !== '') {
    query.searchAfter = searchAfter
  }

  const response = await fetchJson(`${apiUri}/v0003/timeline/list?${makeQueryString(rid, query)}`, {
    log: true,
    headers: createHeaders(rid),
    sanitizeRequestLog: {},
    sanitizeResponseLog: {}
  })

  const allowedStatuses = [
    'OK',
    'OK_SYNC'
  ]
  if (isResponseStatusIsSuccess(response, allowedStatuses)) {
    return response.body
  } else {
    return {
      'data': {
        'totalCount': 0,
        'items': []
      }
    }
  }
}

const isResponseStatusIsSuccess = (response, allowedStatuses = ['OK']) => {
  return response.status === httpSuccessStatus && allowedStatuses.indexOf(response.body.status) !== -1
}

const assertResponseSuccess = (response, allowedStatuses = ['OK']) => {
  console.assert(isResponseStatusIsSuccess(response, allowedStatuses), 'non-successful response', response)
}

const generateHash = () => {
  return Array.apply(null, { length: 16 })
    .map(() => Number(Math.floor(Math.random() * 16)).toString(16))
    .join('')
    .substring(0, 13)
}

const makeQueryString = (rid, data) => {
  const params = {
    ...data,
    'rid': rid
  }
  const esc = encodeURIComponent

  return Object.keys(params)
    .map(k => esc(k) + '=' + esc(params[k]))
    .join('&')
}

const setTokenFromResponce = (response) => {
  const cookie = parse(splitCookiesString(response.headers['set-cookie'])).find((x) => x.name === 'XSRF-TOKEN')
  setXXSrfToken(cookie.value)
}

export {
  apiUri,
  checkSession,
  setApiUri,
  auth,
  fetchCards,
  fetchCredits,
  fetchWallets,
  fetchTransactions,
  generateHash
}
