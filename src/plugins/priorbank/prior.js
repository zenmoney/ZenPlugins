import { SHA512 } from 'jshashes'
import { fetchJson } from '../../common/network'
import { BankMessageError, InvalidLoginOrPasswordError } from '../../errors'
const crypto = require('crypto')

function isSuccessfulResponse (response) {
  return response.status === 200 && (!('success' in response.body) || response.body.success === true)
}

export function assertResponseSuccess (response) {
  if (response.body && response.body.success === false && response.body.errorMessage) {
    const message = response.body.errorMessage
    if (message === 'Неверный логин или пароль') {
      throw new InvalidLoginOrPasswordError()
    }
    if ([
      'Услуга временно заблокирована',
      'Услуга заблокирована до активации',
      'Ошибка на сервере'
    ].some(pattern => message.indexOf(pattern) >= 0)) {
      throw new BankMessageError(message)
    }
  }
  console.assert(isSuccessfulResponse(response), 'non-successful response', response)
}

const makeApiUrl = (path) => `https://www.prior.by/api3/api${path}`
const userAgent = 'PriorMobile3/3.44.3 (Android 30; versionCode 136)'

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
      Authorization: `bearer ${authAccessToken}`,
      client_id: clientSecret,
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

export function calculatePassword2Hash ({ loginSalt, password }) {
  const messageDigest = crypto.createHash('sha512')
  messageDigest.update(password, 'utf8')
  messageDigest.update(loginSalt, 'utf8')
  const d = messageDigest.digest()
  const s = Buffer.from(loginSalt, 'utf8')

  const result = Buffer.concat([d, s])

  return result.toString('base64')
}

export async function authLogin ({ authAccessToken, clientSecret, loginSalt, login, password }) {
  if (password.length > 16) {
    throw new InvalidPreferencesError('Плагин поддерживает пароли только до 16-ти символов. Смените пароль.')
  }
  const response = await fetchJson(makeApiUrl('/Authorization/Login'), {
    method: 'POST',
    body: {
      login,
      password: calculatePasswordHash({ loginSalt, password }),
      deviceInfo: {
        precognitiveSessionId: ''
      },
      password2: calculatePassword2Hash({ loginSalt, password }),
      lang: 'RUS'
    },
    headers: {
      Authorization: `bearer ${authAccessToken}`,
      client_id: clientSecret,
      'User-Agent': userAgent
    },
    sanitizeRequestLog: { body: { login: true, password: true, password2: true }, headers: true },
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
      client_id: clientSecret,
      'User-Agent': userAgent,
      Authorization: `bearer ${accessToken}`
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
      client_id: clientSecret,
      'User-Agent': userAgent,
      Authorization: `bearer ${accessToken}`
    },
    sanitizeRequestLog: { body: { usersession: true }, headers: true },
    sanitizeResponseLog: { body: { result: { contract: { addrLineA: true, addrLineB: true, addrLineC: true } } } }
  })
}
