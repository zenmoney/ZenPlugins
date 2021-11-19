/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import { parse, splitCookiesString } from 'set-cookie-parser'
import { fetchJson } from '../../common/network'
import { generateRandomString, generateUUID } from '../../common/utils'
import { InvalidLoginOrPasswordError, InvalidOtpCodeError, UserInteractionError } from '../../errors'

let apiUri = ''
let xXSrfToken = null

const APP_VERSION = '5010'
const DEVICE_MANUFACTURER = ZenMoney.device?.manufacturer.toLowerCase() || 'zenmoney'
const DEVICE_MODEL = ZenMoney.device?.model || 'Sync'

const httpSuccessStatus = 200

const setApiUri = (uri) => {
  apiUri = uri
}

const setXXSrfToken = (value) => {
  xXSrfToken = value
}

function getPhoneNumber (str) {
  str = str.trim()
  const number = /^(?:\+?7|8|)(\d{10})$/.exec(str)
  if (number) {
    return number[1]
  }
  return str
}

const createHeaders = (rid, deviceId, instanceId) => {
  return {
    'X-Request-Id': rid,
    ...xXSrfToken && { 'X-XSRF-TOKEN': xXSrfToken },
    Host: apiUri.match(/https?:\/\/([^/]+)\/?/)[1],
    'Accept-Encoding': 'gzip',
    'User-Agent': `Dalvik/2.1.0 (Linux; U; Android 8.0.0; ${DEVICE_MODEL} Build/R16NW)`,
    'os-version': '26',
    'device-model': DEVICE_MODEL,
    'X-Device-ID': deviceId,
    'instance-id': instanceId,
    vendor: DEVICE_MANUFACTURER,
    channel: 'mobile',
    platform: 'android',
    'Client-Version': APP_VERSION
  }
}

async function auth (login, password, authParams, isInBackground) {
  if (Object.keys(authParams).length === 0 && isInBackground) {
    throw new UserInteractionError()
  }
  const deviceId = authParams.deviceId || generateRandomString(16, '0123456789abcdef')
  const instanceId = authParams.instanceId || generateUUID()
  let rid = generateHash()
  const response = await fetchJson(`${apiUri}/v0001/authentication/auth-by-secret?${makeQueryString(rid)}`, {
    log: true,
    method: 'POST',
    headers: {
      ...createHeaders(rid, deviceId, instanceId),
      'login-method': 'api-pwd'
    },
    body: {
      principal: getPhoneNumber(login),
      secret: password,
      type: 'AUTO'
    },
    sanitizeRequestLog: { body: { principal: true, secret: true } },
    sanitizeResponseLog: { headers: true }
  })

  if (response.status === httpSuccessStatus) {
    const s = response.body.status

    if (s === 'OTP_REQUIRED') {
      setTokenFromResponse(response)
      rid = generateHash()
      const code = await ZenMoney.readLine('Введите код из SMS или push-уведомления', {
        time: 120000,
        inputType: 'number'
      })
      if (!code) { throw new InvalidOtpCodeError() }

      const otpResponse = await fetchJson(`${apiUri}/v0001/authentication/confirm?${makeQueryString(rid)}`, {
        log: true,
        method: 'POST',
        body: {
          otp: code,
          principal: login
        },
        headers: createHeaders(rid, deviceId, instanceId),
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

      if (otpResponse.body.status === 'AUTH_WRONG') { throw new InvalidOtpCodeError() }

      assertResponseSuccess(otpResponse)
      setTokenFromResponse(otpResponse)

      return { deviceId, instanceId }
    } else if (s === 'OK') {
      setTokenFromResponse(response)
      return authParams
    } else {
      if ([
        'CANNOT_FIND_SUBJECT',
        'PRINCIPAL_IS_EMPTY',
        'CANNOT_FOUND_AUTHENTICATION_PROVIDER',
        'CARD_IS_ARCHIVED'
      ].some(str => s === str)) {
        throw new InvalidLoginOrPasswordError() // statusesUnknownCardNumber
      }
      if ([
        'AUTH_WRONG',
        'EMPTY_SECRET_NOT_ALLOWED'
      ].some(str => s === str)) {
        throw new InvalidLoginOrPasswordError() // statusesWrongPassword
      }
      if (s === 'VALIDATION_FAIL' &&
        [
          'EAN_OUT_OF_RANGE',
          'EAN_MUST_HAVE_13_SYMBOLS'
        ].some(str => response.body.messages[0].code === str)) {
        throw new InvalidLoginOrPasswordError() // statusesUnknownCardNumber
      }

      if ([
        'AUTH_LOCKED_TEMPORARY'
      ].some(str => s === str)) {
        throw new TemporaryError('Не удалось авторизоваться: доступ временно запрещен')
      }
      if ([
        'CORE_NOT_AVAILABLE_ERROR',
        'CORE_UNAVAILABLE'
      ].some(str => s === str)) {
        throw new TemporaryError('Не удалось авторизоваться: технические работы в банке')
      }

      console.assert(false, 'Не удалось авторизоваться', response)
    }
  } else { // (response.status !== httpSuccessStatus)
    console.assert(false, 'Не удалось авторизоваться', response)
  }
}

async function fetchCards (auth) {
  const rid = generateHash()

  const response = await fetchJson(`${apiUri}/v0002/cards?${makeQueryString(rid)}`, {
    log: true,
    headers: createHeaders(rid, auth.deviceId, auth.instanceId),
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

async function fetchCredits (auth) {
  const rid = generateHash()

  const response = await fetchJson(`${apiUri}/v0001/credit?${makeQueryString(rid)}`, {
    log: true,
    headers: createHeaders(rid, auth.deviceId, auth.instanceId),
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
    'CREDIT_NOT_FOUND_ERROR',
    'WRONG_CABINET' // if not supported
  ])

  return response.body.data
    ? response.body.data
    : []
}

async function fetchWallets (auth) {
  const rid = generateHash()

  const response = await fetchJson(`${apiUri}/v0001/wallets?${makeQueryString(rid)}`, {
    log: true,
    headers: createHeaders(rid, auth.deviceId, auth.instanceId),
    sanitizeRequestLog: {},
    sanitizeResponseLog: {}
  })

  assertResponseSuccess(response, [
    'OK',
    'FEATURE_IS_RESTRICTED_FOR_SUBJECT' // if not supported
  ])

  return response.body.data && response.body.data.wallets
    ? response.body.data.wallets
    : []
}

async function fetchTransactions (dateFrom, contractIds, auth) {
  const transactions = []

  for (const item of contractIds) {
    const data = await fetchTransactionsByContractId(dateFrom, item, auth)
    for (const item of data) {
      transactions.push(item)
    }
  }

  return transactions
}

async function fetchTransactionsByContractId (dateFrom, contractId, auth) {
  let isFirstPage = true
  const transactions = []

  const lastSyncTime = new Date(dateFrom).getTime()
  const pagination = {
    limit: 20,
    offset: 0,
    total: null
  }

  let searchAfter = ''

  console.debug('last sync: ' + lastSyncTime + ' (' + dateFrom + ')')

  while (isFirstPage || pagination.offset < pagination.total) {
    const result = await fetchTransactionsInternal(pagination.limit, lastSyncTime, searchAfter, contractId, auth)

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

async function fetchTransactionsInternal (limit, gte, searchAfter, contractId, auth) {
  const rid = generateHash()

  const query = {
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
    headers: createHeaders(rid, auth.deviceId, auth.instanceId),
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
      data: {
        totalCount: 0,
        items: []
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
  return generateRandomString(16, '0123456789abcdef')
}

const makeQueryString = (rid, data) => {
  const params = {
    ...data,
    rid: rid
  }
  const esc = encodeURIComponent

  return Object.keys(params)
    .map(k => esc(k) + '=' + esc(params[k]))
    .join('&')
}

const setTokenFromResponse = (response) => {
  const cookie = parse(splitCookiesString(response.headers['set-cookie'])).find((x) => x.name === 'XSRF-TOKEN')
  setXXSrfToken(cookie.value)
}

export {
  apiUri,
  // checkSession,
  setApiUri,
  auth,
  fetchCards,
  fetchCredits,
  fetchWallets,
  fetchTransactions,
  generateHash
}
