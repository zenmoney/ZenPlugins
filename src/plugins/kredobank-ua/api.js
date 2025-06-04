import { flatten, isArray } from 'lodash'
import qs from 'querystring'
import { createDateIntervals, dateInTimezone } from '../../common/dateUtils'
import { fetch } from '../../common/network'
import { toAtLeastTwoDigitsString } from '../../common/stringUtils'
import { generateRandomString } from '../../common/utils'
import { InvalidLoginOrPasswordError, InvalidOtpCodeError } from '../../errors'

const BASE_URL = 'https://online.kredobank.com.ua/ibank/api'
const COMMON_HEADERS = {
  'User-Agent': 'okhttp/4.8.1'
}

async function askOtpCode () {
  const otp = await ZenMoney.readLine('Введите код из смс', { inputType: 'number' })
  if (!otp) {
    throw new InvalidOtpCodeError()
  }
  return otp
}

export function generateDevice () {
  return { deviceId: generateRandomString(16, '0123456789abcdef') }
}

function getDeviceDescription (auth) {
  return JSON.stringify({
    appVersion: '1.2.24',
    brand: ZenMoney.device.brand,
    deviceId: auth.device.deviceId,
    deviceModel: ZenMoney.device.model,
    osType: 'Android',
    osVersion: '10'
  })
}

async function fetchApi (url, options, auth) {
  return await fetch(BASE_URL + url, {
    ...options,
    headers: {
      ...COMMON_HEADERS,
      ...options.body && { 'Content-Type': 'application/json; charset=UTF-8' },
      ...auth?.accessToken && { Authorization: auth.accessToken },
      ...options?.headers
    },
    sanitizeRequestLog: {
      ...options?.sanitizeRequestLog,
      headers: {
        ...options?.sanitizeRequestLog?.headers,
        Authorization: true
      }
    },
    stringify: JSON.stringify,
    parse: (body) => body === '' ? undefined : JSON.parse(body)
  })
}

async function coldAuth ({ login, password }, auth) {
  let response = await fetchApi(`/v1/individual/light/auth/login/login-password/${auth.device.deviceId}`, {
    method: 'POST',
    body: {
      deviceDescription: getDeviceDescription(auth),
      login,
      password
    },
    sanitizeRequestLog: { body: { login: true, password: true } },
    sanitizeResponseLog: {
      headers: { authorization: true },
      body: { profileAttributes: true, userInfo: true }
    }
  })

  if (response.body.errorMessageKey === 'wrong_login_and_password_credentials' ||
      (response.body.errorMessageKey === 'account_temporary_locked' && response.body.errorDescription === 'Wrong Credentials')) {
    throw new InvalidLoginOrPasswordError()
  }

  if (!response.body.isAuthCompleted) {
    const username = response.body.userInfo.name
    const authorization = response.headers.authorization
    console.assert(username && authorization, '2fa cant get params', username, authorization)

    response = await fetchApi(`/v1/individual/light/auth/login/otp_sms/challenge?userName=${username}`, {
      method: 'GET',
      headers: {
        Authorization: authorization
      },
      sanitizeRequestLog: { url: { query: { userName: true } }, headers: { Authorization: true } },
      sanitizeResponseLog: { url: { query: { userName: true } } }
    })
    const challengeId = response.body.challengeId
    console.assert(challengeId, 'cant get challenge id', response)

    response = await fetchApi('/v1/individual/light/auth/login/otp_sms/response', {
      method: 'POST',
      headers: {
        Authorization: authorization
      },
      body: {
        authValue: await askOtpCode(),
        challenge: { challengeId }
      },
      sanitizeRequestLog: { headers: { Authorization: true }, body: { authValue: true, challenge: true } },
      sanitizeResponseLog: {
        headers: { authorization: true },
        body: { profileAttributes: true, userInfo: true }
      }
    })
    console.assert(response.body.isAuthCompleted, 'auth not completed after otp', response)
  }
  console.assert(response.headers.authorization, 'cant get auth token', response)
  auth.accessToken = response.headers.authorization
}

async function warmAuth (auth) {
  const response = await fetchApi(`/v1/individual/light/auth/login/token/${auth.device.deviceId}`, {
    method: 'POST',
    body: {
      deviceDescription: getDeviceDescription(auth),
      deviceAuthType: 'PIN'
    },
    sanitizeResponseLog: {
      headers: { authorization: true },
      body: { profileAttributes: true, userInfo: true }
    }
  }, auth)

  console.assert(response.body.isAuthCompleted, 'expected authed', response)

  auth.accessToken = response.headers.authorization
}

async function checkSession (auth) {
  const response = await fetchApi('/v1/individual/light/auth/session', {
    method: 'GET',
    sanitizeResponseLog: {
      headers: { authorization: true },
      body: { profileAttributes: true, userInfo: true }
    }
  }, auth)

  console.assert(response.body.isAuthCompleted, 'expected authed', response)

  auth.accessToken = response.headers.authorization
}

export async function login (preferences, auth) {
  if (!auth.accessToken) {
    await coldAuth(preferences, auth)
  } else {
    await warmAuth(auth)
  }

  await checkSession(auth)
}

async function fetchProductDetails (product, contractType, auth) {
  if (contractType === 'card' && product.cardsList?.length > 0) {
    await Promise.all(product.cardsList.filter(card => card.showAndOperationRule.mainScreenShowAllowed !== false)
      .map(async card => {
        const cardDetailsResponse = await fetchApi(`/v1/individual/light/contract/card/${product.id}/detailed?cardId=${card.id}`, {
          method: 'GET'
        }, auth)
        card.details = cardDetailsResponse.body
      }))
  } else {
    const detailsResponse = await fetchApi(`/v1/individual/light/contract/${contractType}/${product.id}/detailed`, {
      method: 'GET'
    }, auth)
    product.details = detailsResponse.body
  }
}

export async function fetchAccounts (auth) {
  const contractTypes = ['card', 'credit', 'deposit']

  return flatten(await Promise.all(contractTypes.map(async contractType => {
    const response = await fetchApi(`/v2/individual/light/contract/${contractType}/all`, {
      method: 'GET'
    }, auth)
    console.assert(isArray(response.body.contracts), 'unexpected response', response)

    return await Promise.all(response.body.contracts.filter(product => ((product.providerId === 'card' && product.accountStateCodeName === '1') ||
      product.providerId !== 'card') && product.showAndOperationRule.mainScreenShowAllowed !== false).map(async product => {
      await fetchProductDetails(product, contractType, auth)
      return product
    }))
  })))
}

export async function fetchTransactions (auth, { contractType, id, cardId = null }, fromDate, toDate = null) {
  const transactions = []
  const parameters = { withCards: 'true' }
  if (cardId) {
    parameters.cardId = cardId
  }

  await Promise.all(createDateIntervals({
    fromDate: dateInTimezone(fromDate, 3 * 60),
    toDate: dateInTimezone(toDate, 3 * 60),
    addIntervalToDate: prev => {
      const next = new Date(prev.getTime())
      next.setDate(next.getDate() + 27)
      return next
    }
  }).map(async ([from, to]) => {
    parameters.from = formatDate(from)
    parameters.to = formatDate(to)
    const response = await fetchApi(`/v1/individual/light/contract/${contractType}/${id}/history/all/between?${qs.stringify(parameters)}`, {
      method: 'GET'
    }, auth)
    console.assert(isArray(response.body), 'unexpected response', response)
    transactions.push(...response.body)
  }))

  return transactions
}

function formatDate (date) {
  // 20210901
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(toAtLeastTwoDigitsString).join('')
}
