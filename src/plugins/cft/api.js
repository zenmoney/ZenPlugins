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
    'X-Request-Id': rid,
    'X-XSRF-TOKEN': xXSrfToken
  }
}

async function auth (cardNumber, password) {
  const rid = generateHash()

  const response = await fetchJson(`${apiUri}/v0001/authentication/auth-by-secret?${makeQueryString(rid)}`, {
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

  const s = response.body.status

  if (!(response.status === httpSuccessStatus && s === 'OK')) {
    let reason
    const reasonUnknownCardNumber = 'неправильный номер карты'
    const reasonWrongPassword = 'неправильный пароль'
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
  }

  const cookie = parse(splitCookiesString(response.headers['set-cookie'])).find((x) => x.name === 'XSRF-TOKEN')

  setXXSrfToken(cookie.value)
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
    const result = await fetchTransactionsInternal(pagination.limit, lastSyncTime, searchAfter, contractIds)

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

async function fetchTransactionsInternal (limit, gte, searchAfter, contractIds) {
  const rid = generateHash()

  let query = {
    gte: gte,
    lte: '',
    queryString: '',
    filters: '',
    contractIds: contractIds.join(','),
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

  assertResponseSuccess(response, [
    'OK',
    'OK_SYNC'
  ])

  return response.body
}

const assertResponseSuccess = (response, allowedStatuses = ['OK']) => {
  console.assert(
    response.status === httpSuccessStatus && allowedStatuses.indexOf(response.body.status) !== -1,
    'non-successful response',
    response
  )
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

export {
  apiUri,
  setApiUri,
  auth,
  fetchCards,
  fetchCredits,
  fetchWallets,
  fetchTransactions,
  generateHash
}
