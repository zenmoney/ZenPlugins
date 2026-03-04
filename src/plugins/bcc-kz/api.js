import { find } from 'lodash'
import { stringify } from 'querystring'
import { dateInTimezone } from '../../common/dateUtils'
import { fetch } from '../../common/network'
import { toAtLeastTwoDigitsString } from '../../common/stringUtils'
import { generateRandomString } from '../../common/utils'
import { BankMessageError, InvalidLoginOrPasswordError, InvalidOtpCodeError } from '../../errors'

const MAIN_URL = 'https://m.bcc.kz/mb/!pkg_w_mb_main.operation'

const COMMON_HEADERS = {
  'User-Agent': 'okhttp/3.14.9',
  'Content-Type': 'application/x-www-form-urlencoded'
}

function getPhoneNumber (input) {
  const result = /^(?:\+?7|8|)(\d{10})$/.exec(input.trim())

  if (result) {
    return result[1]
  }
  return null
}

async function fetchApi (options) {
  return await fetch(MAIN_URL, {
    method: 'POST',
    ...options,
    headers: {
      ...COMMON_HEADERS,
      ...options?.headers
    },
    stringify,
    parse: (body) => body === '' ? undefined : JSON.parse(body)
  })
}

export async function setLanguageCookie () {
  await ZenMoney.setCookie('m.bcc.kz', 'lang', 'ae')
}

function validatePreferences (rawPreferences) {
  const preferences = { phone: getPhoneNumber(rawPreferences.phone), password: rawPreferences.password }
  if (!preferences.phone) {
    throw new InvalidLoginOrPasswordError('Неверный формат номера телефона')
  }
  return preferences
}

export function generateDevice () {
  return { deviceId: generateRandomString(16, '0123456789abcdef') }
}

async function preAuth (preferences, auth) {
  const response = await fetchApi({
    body: {
      AUTHTYPE: 'PASS',
      AUTH_TYPE: 'PASS',
      TERMINAL: 'SHA',
      ACTION: 'SIGN',
      OS: `OS:Android10;BRAND:${ZenMoney.device.brand};MODEL:${ZenMoney.device.model};SCREEN:1080x 2043;AppVersion: 3.4.0;`,
      LOGIN: preferences.phone,
      FCM_TOKEN: '',
      DEVICE_ID: auth.device.deviceId,
      CELL1: preferences.password
    },
    sanitizeRequestLog: {
      body: {
        LOGIN: true,
        CELL1: true,
        DEVICE_ID: true
      }
    },
    sanitizeResponseLog: {
      body: {
        token: true
      }
    }
  })

  if (!response.body.success && response.body.reason?.match(/Не верный логин или пароль/i)) {
    throw new InvalidLoginOrPasswordError()
  }
  assertSuccessResponse(response)

  return { verified: response.body.verified, token: response.body.token || null }
}

async function coldAuth (token) {
  const smsCode = await ZenMoney.readLine('Введите код из SMS', { inputType: 'number' })
  if (!smsCode) {
    throw new InvalidOtpCodeError()
  }

  const response = await fetchApi({
    body: {
      AUTHTYPE: 'TOKEN',
      ACTION: 'SIGN',
      TOKEN: token,
      VERIFY_CODE: smsCode
    },
    sanitizeRequestLog: {
      body: {
        TOKEN: true,
        VERIFY_CODE: true
      }
    },
    sanitizeResponseLog: {
      body: {
        email: true,
        firstname: true,
        iin: true,
        lastname: true,
        login: true,
        middlename: true,
        name: true
      }
    }
  })

  console.assert(response.body.verified, 'unexpected response after sms confirmation', response)

  return {
    verified: response.body.verified,
    token: response.body.token || null
  }
}

async function postAuth () {
  const response = await fetchApi({
    body: {
      ACTION: 'CONNECT'
    },
    sanitizeResponseLog: {
      body: {
        email: true,
        firstname: true,
        iin: true,
        lastname: true,
        login: true,
        middlename: true,
        name: true,
        shortname: true,
        session_code: true
      }
    }
  })
  assertSuccessResponse(response)
}

export async function login (rawPreferences, auth) {
  const preferences = validatePreferences(rawPreferences)

  const { verified, token } = await preAuth(preferences, auth)
  if (!verified) {
    await coldAuth(token)
  }
  await postAuth()
}

export async function fetchAccounts () {
  const accountsInfoResponse = await fetchApi({
    body: {
      ACTION: 'ACCOUNTS_INFO',
      LEVEL: '0'
    }
  })
  assertSuccessResponse(accountsInfoResponse)
  const accountsData = accountsInfoResponse.body.reason

  const accountsAdditionalInfoResponse = await fetchApi({
    body: {
      ACTION: 'ACCOUNTS_ADDITIONAL_INFO',
      LEVEL: '0'
    }
  })
  if (typeof accountsAdditionalInfoResponse.body.reason === 'string' &&
    accountsAdditionalInfoResponse.body.reason?.indexOf(/Произошла ошибка, идентификатор ошибки/) >= 0) {
    throw new BankMessageError(accountsAdditionalInfoResponse.body.reason)
  }
  assertSuccessResponse(accountsAdditionalInfoResponse)
  const accountsAdditionalData = accountsAdditionalInfoResponse.body.reason.accounts_info

  const result = [
    ...setStructType(accountsData.card, 'card'),
    ...setStructType(accountsData.current, 'current'),
    ...setStructType(accountsData.dep, 'deposit'),
    ...setStructType(accountsData.loan, 'loan'),
    ...setStructType(accountsData.broker, 'broker'),
    ...setStructType(accountsData.metal, 'metal')
    // ...accountsData.bonus,
    // ...accountsData.cashback,
    // ...accountsData.safe
  ]

  for (const details of accountsAdditionalData) {
    const baseAccount = find(result, x => x.id === details.id)
    if (baseAccount) {
      baseAccount.details = details
    }
  }

  return result
}

export async function fetchTransactions (product, fromDate, toDate) {
  const fromKzTime = dateInTimezone(fromDate, 6 * 60)
  const toKzTime = dateInTimezone(toDate, 6 * 60)
  const response = await fetchApi({
    body: {
      ACCOUNT_ID: product.productId,
      ACTION: 'GET_EXT_STATEMENT',
      DATE_BEGIN: formatDate(fromKzTime),
      DATE_END: formatDate(toKzTime),
      VERSION: '2'
    }
  })
  if (response.body.reason === 'Вы не являетесь владельцем счета') {
    return []
  }
  assertSuccessResponse(response)

  return response.body.stmt
}

function assertSuccessResponse (response) {
  console.assert(response.body.success, 'unexpected response', response)
}

function setStructType (data, structType) {
  return data.map(acc => {
    acc.structType = structType
    return acc
  })
}

function formatDate (date) {
  // to 01.09.2021
  return [date.getDate(), date.getMonth() + 1, date.getFullYear()].map(toAtLeastTwoDigitsString).join('.')
}
