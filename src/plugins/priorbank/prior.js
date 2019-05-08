import { SHA512 } from 'jshashes'
import { fetchJson } from '../../common/network'

function isSuccessfulResponse (response) {
  return response.status === 200 && (!('success' in response.body) || response.body.success === true)
}

export function assertResponseSuccess (response) {
  if (response.body && response.body.success === false && response.body.errorMessage) {
    const message = response.body.errorMessage
    if (message === 'Неверный логин или пароль') {
      throw new InvalidPreferencesError(message)
    }
    if ([
      'Услуга временно заблокирована',
      'Ошибка на сервере'
    ].some(pattern => message.indexOf(pattern) >= 0)) {
      throw new TemporaryError(`Во время синхронизации произошла ошибка.\n\nСообщение от банка: ${message}`)
    }
  }
  console.assert(isSuccessfulResponse(response), 'non-successful response', response)
}

const makeApiUrl = (path) => `https://www.prior.by/api3/api${path}`
const userAgent = 'PriorMobile3/3.17.03.22 (Android 24; versionCode 37)'

export async function getMobileToken () {
  const response = await fetchJson(makeApiUrl('/Authorization/MobileToken'), {
    method: 'GET',
    sanitizeResponseLog: { body: true }
  })
  assertResponseSuccess(response)
  console.assert(response.body.token_type === 'bearer', 'unknown token type', response.body.token_type)
  return {
    authAccessToken: response.body.access_token,
    clientSecret: response.body.client_secret
  }
}

export async function getSalt ({ authAccessToken, clientSecret, login }) {
  const response = await fetchJson(makeApiUrl('/Authorization/GetSalt'), {
    method: 'POST',
    body: { login, lang: 'RUS' },
    headers: {
      'Authorization': `bearer ${authAccessToken}`,
      'client_id': clientSecret,
      'User-Agent': userAgent
    },
    sanitizeRequestLog: { body: { login: true }, headers: true },
    sanitizeResponseLog: { body: { result: true } }
  })
  assertResponseSuccess(response)

  return response.body.result.salt
}

export const calculatePasswordHash = ({ loginSalt, password }) => {
  const sha512 = new SHA512()
  const passwordHash = sha512.hex(password.slice(0, 16))
  return loginSalt
    ? sha512.hex(passwordHash + loginSalt)
    : passwordHash
}

export async function authLogin ({ authAccessToken, clientSecret, loginSalt, login, password }) {
  const response = await fetchJson(makeApiUrl('/Authorization/Login'), {
    method: 'POST',
    body: { login, password: calculatePasswordHash({ loginSalt, password }), lang: 'RUS' },
    headers: {
      'Authorization': `bearer ${authAccessToken}`,
      'client_id': clientSecret,
      'User-Agent': userAgent
    },
    sanitizeRequestLog: { body: { login: true, password: true }, headers: true },
    sanitizeResponseLog: { body: { result: true } }
  })
  assertResponseSuccess(response)

  return {
    accessToken: response.body.result.access_token,
    userSession: response.body.result.userSession
  }
}

export function getCards ({ accessToken, clientSecret, userSession }) {
  return fetchJson(makeApiUrl('/Cards'), {
    method: 'POST',
    body: { usersession: userSession },
    headers: {
      'client_id': clientSecret,
      'User-Agent': userAgent,
      'Authorization': `bearer ${accessToken}`
    },
    sanitizeRequestLog: { body: { usersession: true }, headers: true },
    sanitizeResponseLog: { body: { result: { clientObject: { cardRBSNumber: true, contractNum: true, iban: true } } } }
  })
}

export function getCardDesc ({ accessToken, clientSecret, userSession, fromDate = null, toDate = null }) {
  const body = {
    usersession: userSession,
    ids: [],
    dateFromSpecified: false,
    dateToSpecified: false
  }
  if (fromDate) {
    body.dateFromSpecified = true
    body.dateFrom = fromDate
  }
  if (toDate) {
    body.dateToSpecified = true
    body.dateTo = toDate
  }
  return fetchJson(makeApiUrl('/Cards/CardDesc'), {
    method: 'POST',
    body,
    headers: {
      'client_id': clientSecret,
      'User-Agent': userAgent,
      'Authorization': `bearer ${accessToken}`
    },
    sanitizeRequestLog: { body: { usersession: true }, headers: true },
    sanitizeResponseLog: { body: { result: { contract: { addrLineA: true, addrLineB: true, addrLineC: true } } } }
  })
}
