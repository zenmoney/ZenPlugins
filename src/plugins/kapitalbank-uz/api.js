import { fetchJson } from '../../common/network'
import { InvalidLoginOrPasswordError, TemporaryError } from '../../errors'
import {
  convertCard,
  convertAccount,
  convertDeposit,
  convertCardOrAccountTransaction,
  convertDepositTransaction
} from './converters'

const appVersion = '3.1.1'
const baseUrl = 'https://b2c-api.kapitalbank.uz/api/v1'

function getDefaultHeaders () {
  return {
    'Content-Type': 'application/json',
    'Accept-Encoding': 'gzip',
    'Accept-Language': 'ru-RU',
    Connection: 'Keep-Alive',
    DeviceId: ZenMoney.getData('deviceId'),
    Host: 'b2c-api.kapitalbank.uz',
    'User-Agent': 'okhttp/4.12.0',
    'X-App-Version': 'Android; ' + appVersion,
    'X-Device-Info': 'Android; 13; samsung; o1s; ' + appVersion + '; XXHDPI; ' + ZenMoney.getData('deviceId'),
    'X-Device-OS': 'ANDROID',
    'X-Trace-Info': 'sessionId=' + ZenMoney.getData('sessionId') + '; requestId=' + ZenMoney.getData('requestId')
  }
}

function getDefaultHeadersWithToken () {
  return {
    ...getDefaultHeaders(),
    Authorization: 'Bearer ' + ZenMoney.getData('accessToken')
  }
}

export async function authByPhoneNumber (phone) {
  const endpoint = '/auth/phone-number/' + phone

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'GET',
    headers: getDefaultHeaders(),
    sanitizeRequestLog: { body: { phone: true, password: true } }
  })

  console.assert(response.ok, 'unexpected auth response', response)

  return response.body.exist
}

export async function authByPassword (phone, password) {
  const endpoint = '/auth/by-password'

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'POST',
    headers: getDefaultHeaders(),
    body: {
      phoneNumber: phone,
      password
    },
    sanitizeRequestLog: { body: { phone: true, password: true } }
  })

  // нужно пройти процесс идентификации через myid.uz
  if (response.status === 403) {
    throw new TemporaryError(response.body.errorDetail)
  }

  if (response.status === 400) {
    throw new InvalidLoginOrPasswordError(response.body.errorDetail)
  }

  // we get verification code here
  return response.body.verificationCode
}

export async function verifySmsCode (verificationCode, otpCode) {
  const endpoint = '/auth/verify-by-password'

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'POST',
    headers: getDefaultHeaders(),
    body: {
      verificationCode,
      otpCode
    },
    sanitizeRequestLog: { body: { verificationCode: true, otpCode: true } }
  })

  // todo обработать неверный код подтверждения
  console.assert(response.ok, 'unexpected auth response', response)

  ZenMoney.setData('guid', response.body.guid)
  ZenMoney.setData('accessToken', response.body.accessToken)
  ZenMoney.setData('refreshToken', response.body.refreshToken)
  ZenMoney.setData('isFirstRun', false)
}

export async function refreshToken () {
  const endpoint = '/auth/tokens/re-creation'

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'POST',
    headers: {
      ...getDefaultHeaders(),
      Authorization: 'Bearer ' + ZenMoney.getData('refreshToken')
    },
    sanitizeRequestLog: { body: { verificationCode: true, otpCode: true } }
  })

  // todo обработать неверный код подтверждения
  console.assert(response.ok, 'unexpected auth response', response)

  ZenMoney.setData('guid', response.body.guid)
  ZenMoney.setData('accessToken', response.body.accessToken)
  ZenMoney.setData('refreshToken', response.body.refreshToken)
  ZenMoney.setData('isFirstRun', false)
}

export async function myIdIdentify (isResident, pinfl, birthDate, photoFromCamera) {
  const endpoint = '/identification/my-id/identify'

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'POST',
    headers: getDefaultHeaders(),
    body: {
      isResident,
      pinfl,
      passportSerial: null,
      passportNumber: null,
      birthDate,
      photoFromCamera: {
        front: photoFromCamera
      }
    },
    sanitizeRequestLog: { body: { isResident: true, pinfl: true, passportSerial: true, passportNumber: true, birthDate: true, photoFromCamera: true } }
  })

  console.assert(response.ok, 'unexpected myIdIdentify response', response)

  return response.body.jobId
}

export async function myIdVerifyResult (jobId) {
  const endpoint = '/identification/my-id/verify-result/' + jobId

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'GET',
    headers: getDefaultHeaders()
  })

  console.assert(response.ok, 'unexpected myIdVerifyResult response', response)
  if (response.status === 400 || response.status === 404) {
    return { success: false, ...response.body?.errorDetail }
  }

  return { success: true }
}

export async function getCards () {
  const endpoint = '/cards?processing=HUMO%2CUZCARD%2CVISA%2CMASTERCARD&currency=UZS%2CUSD%2CEUR&bankType=ALL&favouriteCardType=ALL&cardType=PHYSICAL%2CCORPORATE%2CRETIREMENT'

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'GET',
    headers: getDefaultHeadersWithToken(),
    sanitizeRequestLog: { headers: { Authorization: true } }
  })

  console.assert(response.ok, 'unexpected getCards response', response)

  const cards = response.body.map(convertCard).filter(card => card !== null)
  for (const card of cards) {
    card.balance = await getCardBalance(card.id)
  }

  return cards
}

export async function getCardBalance (cardId) {
  const endpoint = '/cards/balance/' + cardId

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'GET',
    headers: getDefaultHeadersWithToken(),
    sanitizeRequestLog: { headers: { Authorization: true } }
  })

  console.assert(response.ok, 'unexpected getCardBalance response', response)

  return response.body.balance / Math.pow(10, response.body.currency.scale)
}

export async function getAccounts () {
  const endpoint = '/accounts'

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'GET',
    headers: getDefaultHeadersWithToken(),
    sanitizeRequestLog: { headers: { Authorization: true } }
  })

  console.assert(response.ok, 'unexpected getAccounts response', response)

  const accounts = response.body.map(convertAccount).filter(account => account !== null)

  return accounts
}

export async function getDeposits () {
  const endpoint = '/deposits'

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'GET',
    headers: getDefaultHeadersWithToken(),
    sanitizeRequestLog: { headers: { Authorization: true } }
  })

  console.assert(response.ok, 'unexpected getDeposits response', response)

  const deposits = response.body.map(convertDeposit).filter(deposit => deposit !== null)

  return deposits
}

export async function getAllTransactions (account, fromDate, toDate, isDeposit = false) {
  let allTransactions = []
  let page = 0
  let hasMorePages = true

  while (hasMorePages) {
    const response = isDeposit
      ? await getDepositTransactions(account, page)
      : await getCardOrAccountTransactions(account, fromDate, toDate, page)

    if (response.transactions && response.transactions.length > 0) {
      allTransactions = allTransactions.concat(response.transactions)

      // Check if we need to fetch more pages
      hasMorePages = page < response.totalPages - 1
      page++
    } else {
      hasMorePages = false
    }
  }

  return allTransactions
}

async function getCardOrAccountTransactions (account, fromDate, toDate, page = 0, size = 20) {
  // /history/transactions?page=0&size=20&productGuid=AP-9e7c97ad-89af-4f21-b1f2-a82ef4d8f308&dateFrom=2024-02-27&dateTo=2025-02-27
  const fromDateStr = new Date(fromDate).toISOString().split('T')[0]
  const toDateStr = new Date(toDate).toISOString().split('T')[0]
  const endpoint = `/history/transactions?page=${page}&size=${size}&productGuid=${account.id}&dateFrom=${fromDateStr}&dateTo=${toDateStr}`

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'GET',
    headers: getDefaultHeadersWithToken(),
    sanitizeRequestLog: { headers: { Authorization: true } }
  })

  console.assert(response.ok, 'unexpected getCardOrAccountTransactions response', response)
  const transactions = response.body.content
    .map(rawTransaction => convertCardOrAccountTransaction(account, rawTransaction))
    .filter(x => x !== null)

  return {
    totalPages: response.body.totalPages,
    transactions
  }
}

async function getDepositTransactions (deposit, page = 0, size = 15) {
  // /deposits/history/DP-444fe2fb-20ac-474d-a1bc-92efd25f3b81?page=2&size=15
  const endpoint = `/deposits/history/${deposit.id}?page=${page}&size=${size}`

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'GET',
    headers: getDefaultHeadersWithToken(),
    sanitizeRequestLog: { headers: { Authorization: true } }
  })

  console.assert(response.ok, 'unexpected getDepositTransactions response', response)
  const transactions = response.body.content
    .map(rawTransaction => convertDepositTransaction(deposit, rawTransaction))
    .filter(x => x !== null)

  return {
    totalPages: response.body.totalPages,
    transactions
  }
}
