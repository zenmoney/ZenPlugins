import { filter } from 'lodash'
import { stringify } from 'querystring'
import { fetchJson } from '../../common/network'
import { generateRandomString, generateUUID } from '../../common/utils'
import { InvalidLoginOrPasswordError, BankMessageError, TemporaryUnavailableError } from '../../errors'

const host = 'my.smartbank.kz'
const date = new Date().toUTCString()

export function generateDevice () {
  return {
    id: generateUUID().replace(/-/g, '')
  }
}

async function apiFetchJson (url, options = {}) {
  const headers = {
    ...options.headers,
    'If-Modified-Since': date, // 'Thu, 07 May 2020 09:57:57 GMT',
    APP_KEY: 'b90eee30f887941fa04579c9830ab79517bbc363', // Const
    CLIENT_KEY: 'cbe4565cf21aae6a8102c03b308e4c640aa48699', // Const
    APP_VERSION: '2.2.265.2610',
    'User-Agent': 'Phone Android 8.0.0' + ZenMoney.device.model,
    'Accept-Encoding': 'identity',
    Host: host
  }
  const response = await fetchJson(url, {
    stringify,
    ...options,
    headers
  })
  if (response.body.errorCode) {
    if (response.body.errorCode === 1) {
      throw new InvalidLoginOrPasswordError()
    }
    if (response.body.errorMessage.match(/Пользователь заблокирован/i)) {
      throw new BankMessageError(response.body.errorMessage)
    }
    if (response.body.errorMessage.match(/Ошибка при работе с внутренними сервисами/i)) {
      throw new TemporaryUnavailableError()
    }
  }
  console.assert((!response.body.errorCode && response.body.success) || response.body.errorCode === 92, 'Сервер вернул ошибку')
  return response
}

async function setPassCode (device) {
  const code = generateRandomString(6, '0123456789') // await ZenMoney.readLine('Введите код из SMS', { inputType: 'number' })
  await apiFetchJson(`https://my.smartbank.kz/eubn/auth/login/passcode/create?passcode=${code}&deviceId=${device.id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    sanitizeRequestLog: {
      url: (url) => {
        return getSanitizedUrl(url, [
          'passcode=',
          '&deviceId='
        ])
      }
    },
    sanitizeResponsetLog: {
      url: (url) => {
        return getSanitizedUrl(url, [
          'passcode=',
          '&deviceId='
        ])
      }
    }
  })
  return code
}

async function loginWithDigitalCode (auth) {
  const response = await apiFetchJson(`https://my.smartbank.kz/eubn/auth/login/passcode?passcode=${auth.code}&deviceId=${auth.device.id}&language=ru`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    sanitizeRequestLog: {
      url: (url) => {
        return getSanitizedUrl(url, [
          'passcode=',
          '&deviceId=',
          '&language=ru'
        ])
      }
    },
    sanitizeResponseLog: {
      url: (url) => {
        return getSanitizedUrl(url, [
          'passcode=',
          '&deviceId=',
          '&language=ru'
        ])
      }
    }
  })
  if (response.body.errorMessage?.match(/войдите с помощью логина и пароля/i)) {
    return false
  }
  return true
}

async function fetchLogin (login, password, device) {
  return apiFetchJson(`https://my.smartbank.kz/eubn/auth/login/password?language=ru&login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}&deviceId=${device.id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    sanitizeRequestLog: {
      url: (url) => {
        return getSanitizedUrl(url, [
          'login=',
          '&password=',
          '&deviceId='
        ])
      }
    },
    sanitizeResponseLog: {
      url: (url) => {
        return getSanitizedUrl(url, [
          'login=',
          '&password=',
          '&deviceId='
        ])
      },
      body: { body: { login: true } }
    }
  })
}

async function initialLogin (login, password, auth) {
  await fetchLogin(login, password, auth.device)
  const code = await setPassCode(auth.device)
  return {
    code,
    device: auth.device
  }
}

export async function login ({ login, password }, auth) {
  if (!auth.code) {
    return initialLogin(login, password, auth)
  } else {
    if (await loginWithDigitalCode(auth)) {
      return auth
    }
    return initialLogin(login, password, auth)
  }
}

export async function logout () {
  return apiFetchJson('https://my.smartbank.kz/eubn/auth/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}

export async function fetchAccounts (auth) {
  let response = await apiFetchJson('https://my.smartbank.kz/eubn/accounts/list/short', {
    method: 'GET'
  })
  const apiAccounts = []
  await Promise.all(response.body.body.accounts.map(async (account) => {
    let accountType
    if (account.type === 'CARD') {
      accountType = 'card'
    } else if (account.type === 'SAVE') {
      accountType = 'deposit'
    } else if (account.type === 'CRED') {
      accountType = 'credit'
    } else if (account.type === 'CURR') {
      accountType = 'current'
    } else if (account.type === 'BONS') {
      return
    } else {
      console.assert(false, 'Unknown account type')
    }
    if (accountType !== 'credit') {
      response = await apiFetchJson(`https://my.smartbank.kz/eubn/accounts/${accountType}/get?accountNumber=${account.number}`, {
        method: 'GET'
      })
    } else {
      response = await apiFetchJson(`https://my.smartbank.kz/eubn/accounts/${accountType}/get?contractNumber=${account.number}`, {
        method: 'GET'
      })
    }
    apiAccounts.push({
      account,
      details: response.body.body
    })
  }))
  return apiAccounts
}

export async function fetchTransactions (auth, account, fromDate, toDate) {
  if (account.type === 'credit') {
    return []
  }
  const step = 50
  let pageNum = 0
  let lastLength = 0
  const apiTransactions = []
  do {
    const response = await apiFetchJson(`https://my.smartbank.kz/eubn/transactions/${account.type}?account=${account.number}&page=${pageNum}&pageSize=${step}`, {
      method: 'GET'
    })
    if (response.body.body.items) {
      const filteredItems = filter(response.body.body.items, transaction => (+transaction.dateCreated >= fromDate.getTime()))
      apiTransactions.push(...filteredItems)
      lastLength = filteredItems.length
    } else {
      lastLength = 0
    }
    pageNum++
  } while (lastLength >= step)
  return apiTransactions
}

export function getSanitizedUrl (url, sanitizingParameters) {
  let prevIndex = 0
  let newUrl = ''
  let i = 1
  for (; i < sanitizingParameters.length; i++) {
    const startIndex = url.indexOf(sanitizingParameters[i - 1])
    const endIndex = url.indexOf(sanitizingParameters[i])
    newUrl += url.substring(prevIndex, startIndex + sanitizingParameters[i - 1].length) + `String<${endIndex - startIndex - sanitizingParameters[i - 1].length}>`
    prevIndex = endIndex
  }
  if (prevIndex + sanitizingParameters[i - 1].length !== url.length) {
    const startIndex = prevIndex
    const endIndex = url.length
    newUrl += url.substring(prevIndex, startIndex + sanitizingParameters[i - 1].length) + `String<${endIndex - startIndex - sanitizingParameters[i - 1].length}>`
  } else {
    newUrl += url.substring(prevIndex)
  }
  return newUrl
}
