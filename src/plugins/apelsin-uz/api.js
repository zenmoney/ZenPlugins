import { fetchJson } from '../../common/network'
import {
  convertAccount,
  convertAccountTransaction,
  convertCard,
  convertHumoCardTransaction,
  convertUzcardCardTransaction,
  convertVisaCardTransaction,
  convertUzumVisaCardTransaction,
  convertWallet,
  convertWalletTransaction,
  convertMasterCardTransaction
} from './converters'

const baseUrl = 'https://mobile.apelsin.uz/api'
const appVersion = 'Av2.3.0'
const userAgent = 'okhttp/5.0.0-alpha.14'
const deviceName = 'ZenMoney'

const defaultHeaders = {
  lang: 'ru',
  'app-version': appVersion,
  'User-Agent': userAgent,
  'device-name': deviceName
}

export class AuthError {}

/**
 * Получить список карт платежной системы UzCard
 *
 * @returns массив карт платежной системы UzCard в формате Дзенмани
 */
export async function getUzcardCards () {
  const endpoint = '/uzcard'
  const requestHeaders = {
    authorization: 'Bearer ' + ZenMoney.getData('apiAccessToken'),
    'device-id': ZenMoney.getData('deviceId')
  }

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'GET',
    headers: {
      ...defaultHeaders,
      ...requestHeaders
    },
    sanitizeRequestLog: { headers: { 'device-id': true, authorization: true } }
  })

  if (response.status === 401) {
    throw new AuthError()
  }

  console.assert(response.ok, 'unexpected uzcard response', response)

  return response.body.data.map(convertCard).filter(card => card !== null)
}

/**
 * Получить список карт платежной системы Humo
 *
 * @returns массив карт платежной системы Humo в формате Дзенмани
 */
export async function getHumoCards () {
  const endpoint = '/humo'
  const requestHeaders = {
    authorization: 'Bearer ' + ZenMoney.getData('apiAccessToken'),
    'device-id': ZenMoney.getData('deviceId')
  }

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'GET',
    headers: {
      ...defaultHeaders,
      ...requestHeaders
    },
    sanitizeRequestLog: { headers: { 'device-id': true, authorization: true } }
  })

  console.assert(response.ok, 'unexpected humo response', response)

  return response.body.data.map(convertCard).filter(card => card !== null)
}

/**
 * Получить список карт платежной системы Visa
 *
 * @returns массив карт платежной системы Visa в формате Дзенмани
 */
export async function getVisaCards () {
  const endpoint = '/visa'
  const requestHeaders = {
    authorization: 'Bearer ' + ZenMoney.getData('apiAccessToken'),
    'device-id': ZenMoney.getData('deviceId')
  }

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'GET',
    headers: {
      ...defaultHeaders,
      ...requestHeaders
    },
    sanitizeRequestLog: { headers: { 'device-id': true, authorization: true } }
  })

  console.assert(response.ok, 'unexpected visa response', response)

  return response.body.data.map(convertCard).filter(card => card !== null)
}

/**
 * Получить список карт платежной системы Visa от Uzum
 *
 * @returns массив карт платежной системы Visa от Uzum в формате Дзенмани
 */
export async function getUzumVisaCards () {
  const endpoint = '/dbs/debit'
  const requestHeaders = {
    authorization: 'Bearer ' + ZenMoney.getData('apiAccessToken'),
    'device-id': ZenMoney.getData('deviceId')
  }

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'GET',
    headers: {
      ...defaultHeaders,
      ...requestHeaders
    },
    sanitizeRequestLog: { headers: { 'device-id': true, authorization: true } }
  })

  console.assert(response.ok, 'unexpected dbs/debit response', response)

  return response.body.data.map(convertCard).filter((card) => card !== null)
}

/**
 * Получить список карт платежной системы Mastercard
 *
 * @returns массив карт платежной системы Mastercard в формате Дзенмани
 */
export async function getMastercardCards () {
  const endpoint = '/master'
  const requestHeaders = {
    authorization: 'Bearer ' + ZenMoney.getData('apiAccessToken'),
    'device-id': ZenMoney.getData('deviceId')
  }

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'GET',
    headers: {
      ...defaultHeaders,
      ...requestHeaders
    },
    sanitizeRequestLog: { headers: { 'device-id': true, authorization: true } }
  })

  console.assert(response.ok, 'unexpected master response', response)

  return response.body.data.map(convertCard).filter(card => card !== null)
}

/**
 * Получить список кошельков
 *
 * @returns массив кошельков в формате Дзенмани
 */
export async function getWallets () {
  const endpoint = '/wallet'
  const requestHeaders = {
    authorization: 'Bearer ' + ZenMoney.getData('apiAccessToken'),
    'device-id': ZenMoney.getData('deviceId')
  }

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'GET',
    headers: {
      ...defaultHeaders,
      ...requestHeaders
    },
    sanitizeRequestLog: { headers: { 'device-id': true, authorization: true } }
  })

  console.assert(response.ok, 'unexpected wallet response', response)

  return response.body.data.map(convertWallet)
}

/**
 * Получить список счетов
 *
 * @returns массив счетов в формате Дзенмани
 */
export async function getAccounts () {
  const endpoint = '/account'
  const requestHeaders = {
    authorization: 'Bearer ' + ZenMoney.getData('apiAccessToken'),
    'device-id': ZenMoney.getData('deviceId')
  }

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'GET',
    headers: {
      ...defaultHeaders,
      ...requestHeaders
    },
    sanitizeRequestLog: { headers: { 'device-id': true, authorization: true } }
  })

  console.assert(response.ok, 'unexpected account response', response)

  return response.body.data.map(convertAccount)
}

/**
 * Получить список транзакций по картам платежной системы UzCard
 *
 * @param cards массив карт платежной системы UzCard
 * @param fromDate дата в формате ISO8601, с которой нужно выгружать транзакции
 * @param toDate дата в формате ISO8601, по которую нужно выгружать транзакции
 * @returns массив транзакций в формате Дзенмани
 */
export async function getUzcardCardsTransactions (cards, fromDate, toDate) {
  let transactions = []
  const requestHeaders = {
    authorization: 'Bearer ' + ZenMoney.getData('apiAccessToken'),
    'device-id': ZenMoney.getData('deviceId')
  }

  for (const card of cards) {
    if (!ZenMoney.isAccountSkipped(card.id)) {
      const endpoint = '/uzcard/history?' +
        'cardId=' + card.id + '&' +
        'dateFrom=' + fromDate + '&' +
        'dateTo=' + toDate

      const response = await fetchJson(baseUrl + endpoint, {
        method: 'GET',
        headers: {
          ...defaultHeaders,
          ...requestHeaders
        },
        sanitizeRequestLog: { headers: { 'device-id': true, authorization: true } }
      })

      console.assert(response.ok, 'unexpected uzcard/history response', response)

      transactions = transactions.concat(response.body.data.data.map(transaction =>
        convertUzcardCardTransaction(card, transaction)))
    }
  }

  return transactions
}

/**
 * Получить список транзакций по картам платежной системы Humo
 *
 * @param cards массив карт платежной системы Humo
 * @param fromDate дата в формате ISO8601, с которой нужно выгружать транзакции
 * @param toDate дата в формате ISO8601, по которую нужно выгружать транзакции
 * @returns массив транзакций в формате Дзенмани
 */
export async function getHumoCardsTransactions (cards, fromDate, toDate) {
  let transactions = []
  const requestHeaders = {
    authorization: 'Bearer ' + ZenMoney.getData('apiAccessToken'),
    'device-id': ZenMoney.getData('deviceId')
  }

  for (const card of cards) {
    if (!ZenMoney.isAccountSkipped(card.id)) {
      const endpoint = '/humo/history?' +
        'cardId=' + card.id + '&' +
        'dateFrom=' + fromDate + '&' +
        'dateTo=' + toDate

      const response = await fetchJson(baseUrl + endpoint, {
        method: 'GET',
        headers: {
          ...defaultHeaders,
          ...requestHeaders
        },
        sanitizeRequestLog: { headers: { 'device-id': true, authorization: true } }
      })

      console.assert(response.ok, 'unexpected humo/history response', response)

      transactions = transactions.concat(response.body.data.map(transaction =>
        convertHumoCardTransaction(card, transaction)))
    }
  }

  return transactions
}

/**
 * Получить список транзакций по картам платежной системы Visa
 *
 * @param cards массив карт платежной системы Visa
 * @param fromDate дата в формате ISO8601, с которой нужно выгружать транзакции
 * @param toDate дата в формате ISO8601, по которую нужно выгружать транзакции
 * @returns массив транзакций в формате Дзенмани
 */
export async function getVisaCardsTransactions (cards, fromDate, toDate) {
  let transactions = []
  const requestHeaders = {
    authorization: 'Bearer ' + ZenMoney.getData('apiAccessToken'),
    'device-id': ZenMoney.getData('deviceId')
  }

  for (const card of cards) {
    if (!ZenMoney.isAccountSkipped(card.id)) {
      const endpoint = '/visa/history?' +
        'cardId=' + card.id + '&' +
        'dateFrom=' + fromDate + '&' +
        'dateTo=' + toDate

      const response = await fetchJson(baseUrl + endpoint, {
        method: 'GET',
        headers: {
          ...defaultHeaders,
          ...requestHeaders
        },
        sanitizeRequestLog: { headers: { 'device-id': true, authorization: true } }
      })

      console.assert(response.ok, 'unexpected visa/history response', response)

      transactions = transactions.concat(response.body.data.map(transaction =>
        convertVisaCardTransaction(card, transaction)).filter(transaction => transaction !== null))
    }
  }

  return transactions
}

/**
 * Получить список транзакций по картам платежной системы Visa от Uzum
 *
 * @param cards массив карт платежной системы Visa от Uzum
 * @param fromDate дата в формате ISO8601, с которой нужно выгружать транзакции
 * @param toDate дата в формате ISO8601, по которую нужно выгружать транзакции
 * @returns массив транзакций в формате Дзенмани
 */
export async function getUzumVisaCardsTransactions (cards, fromDate, toDate) {
  let transactions = []
  const requestHeaders = {
    authorization: 'Bearer ' + ZenMoney.getData('apiAccessToken'),
    'device-id': ZenMoney.getData('deviceId')
  }

  for (const card of cards) {
    if (!ZenMoney.isAccountSkipped(card.id)) {
      const endpoint = '/dbs/debit/history?' +
        'cardId=' + card.id + '&' +
        'dateFrom=' + fromDate + '&' +
        'dateTo=' + toDate

      const response = await fetchJson(baseUrl + endpoint, {
        method: 'GET',
        headers: {
          ...defaultHeaders,
          ...requestHeaders
        },
        sanitizeRequestLog: { headers: { 'device-id': true, authorization: true } }
      })

      console.assert(response.ok, 'unexpected dbs/debit/history response', response)

      transactions = transactions.concat(response.body.data.map(transaction =>
        convertUzumVisaCardTransaction(card, transaction)).filter(transaction => transaction !== null))
    }
  }

  return transactions
}

/**
 * Получить список транзакций по картам платежной системы Mastercard
 *
 * @param cards массив карт платежной системы Mastercard
 * @param fromDate дата в формате ISO8601, с которой нужно выгружать транзакции
 * @param toDate дата в формате ISO8601, по которую нужно выгружать транзакции
 * @returns массив транзакций в формате Дзенмани
 */
export async function getMastercardCardsTransactions (cards, fromDate, toDate) {
  let transactions = []
  const requestHeaders = {
    authorization: 'Bearer ' + ZenMoney.getData('apiAccessToken'),
    'device-id': ZenMoney.getData('deviceId')
  }

  for (const card of cards) {
    if (!ZenMoney.isAccountSkipped(card.id)) {
      const endpoint = '/master/history?' +
        'cardId=' + card.id + '&' +
        'dateFrom=' + fromDate + '&' +
        'dateTo=' + toDate

      const response = await fetchJson(baseUrl + endpoint, {
        method: 'GET',
        headers: {
          ...defaultHeaders,
          ...requestHeaders
        },
        sanitizeRequestLog: { headers: { 'device-id': true, authorization: true } }
      })

      console.assert(response.ok, 'unexpected master/history response', response)

      transactions = transactions.concat(response.body.data.map(transaction =>
        convertMasterCardTransaction(card, transaction)).filter(transaction => transaction !== null))
    }
  }

  return transactions
}

/**
 * Получить список транзакций по кошелькам
 *
 * @param wallets массив кошельков
 * @param fromDate дата в формате ISO8601, с которой нужно выгружать транзакции
 * @param toDate дата в формате ISO8601, по которую нужно выгружать транзакции
 * @returns массив транзакций в формате Дзенмани
 */
export async function getWalletsTransactions (wallets, fromDate, toDate) {
  let transactions = []
  const requestHeaders = {
    authorization: 'Bearer ' + ZenMoney.getData('apiAccessToken'),
    'device-id': ZenMoney.getData('deviceId')
  }

  for (const wallet of wallets) {
    if (!ZenMoney.isAccountSkipped(wallet.id)) {
      const endpoint = '/wallet/history?' +
        'id=' + wallet.id + '&' +
        'startDate=' + fromDate + '&' +
        'endDate=' + toDate

      const response = await fetchJson(baseUrl + endpoint, {
        method: 'GET',
        headers: {
          ...defaultHeaders,
          ...requestHeaders
        },
        sanitizeRequestLog: { headers: { 'device-id': true, authorization: true } }
      })

      console.assert(response.ok, 'unexpected wallet/history response', response)

      transactions = transactions.concat(response.body.data.map(transaction =>
        convertWalletTransaction(wallet, transaction)))
    }
  }

  return transactions
}

/**
 * Получить список транзакций по счетам
 *
 * @param accounts массив счетов
 * @param fromDate дата в формате ISO8601, с которой нужно выгружать транзакции
 * @param toDate дата в формате ISO8601, по которую нужно выгружать транзакции
 * @returns массив транзакций в формате Дзенмани
 */
export async function getAccountsTransactions (accounts, fromDate, toDate) {
  let transactions = []
  const requestHeaders = {
    authorization: 'Bearer ' + ZenMoney.getData('apiAccessToken'),
    'device-id': ZenMoney.getData('deviceId')
  }

  for (const account of accounts) {
    if (!ZenMoney.isAccountSkipped(account.id)) {
      const endpoint = '/account/statement?' +
        'id=' + account.id + '&' +
        'startDate=' + fromDate + '&' +
        'endDate=' + toDate

      const response = await fetchJson(baseUrl + endpoint, {
        method: 'GET',
        headers: {
          ...defaultHeaders,
          ...requestHeaders
        },
        sanitizeRequestLog: { headers: { 'device-id': true, authorization: true } }
      })

      console.assert(response.ok, 'unexpected account/statement response', response)

      transactions = transactions.concat(response.body.data.map(transaction =>
        convertAccountTransaction(account, transaction)))
    }
  }

  return transactions
}
