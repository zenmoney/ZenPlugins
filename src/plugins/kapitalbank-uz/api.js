import { fetchJson } from '../../common/network'
import { sanitize } from '../../common/sanitize'
import { generateRandomString } from '../../common/utils'
import { InvalidPreferencesError } from '../../errors'
import {
  convertAccount,
  convertAccountTransaction,
  convertCard,
  convertHumoCardTransaction,
  convertUzcardCardTransaction,
  convertVisaCardTransaction,
  convertWallet,
  convertWalletTransaction,
  convertDeposit,
  convertDepositTransaction
} from './converters'

const lang = 'ru'
const appVersion = 'w0.0.2'
const baseUrl = 'https://online.kapitalbank.uz/api'
const baseUrlV2 = baseUrl + '/v2'

/**
 * Регистрирует идентификатор устройства в интернет-банке
 */
export async function registerDevice () {
  const endpoint = '/device'
  const deviceId = generateRandomString(32)

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'POST',
    headers: {
      lang,
      'app-version': appVersion
    },
    body: {
      deviceId,
      name: 'ZenMoney'
    },
    sanitizeRequestLog: { body: { deviceId: true } }
  })

  console.assert(response.ok, 'unexpected device response', response)

  ZenMoney.setData('deviceId', deviceId)
}

/**
 * Проверка на существование клиента в банке и получение номера телефона
 *
 * @param pan номер карты клиента
 * @param expiry срок действия карты клиента
 * @returns номер телефона клиента
 */
export async function checkUser (pan, expiry) {
  const endpoint = '/check-client-card'

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'POST',
    headers: {
      lang,
      'app-version': appVersion,
      'device-id': ZenMoney.getData('deviceId')
    },
    body: {
      pan,
      expiry
    },
    sanitizeRequestLog: { url: { query: { pan: true, expiry: true } }, headers: { 'device-id': true } },
    sanitizeResponseLog: { url: { query: { phone: true } } }
  })

  if (!response.body?.data?.client) {
    throw new InvalidPreferencesError()
  }

  console.assert(response.ok, 'unexpected check-user response', response)

  return response.body.data.phone
}

/**
 * Вызвать отправку СМС кода на мобильный телефон
 *
 * @param pan номер карты клиента
 * @param expiry срок действия карты клиента
 * @param password пароль
 */
export async function sendSmsCode (pan, expiry, password) {
  const endpoint = '/login'

  const response = await fetchJson(baseUrlV2 + endpoint, {
    method: 'POST',
    headers: {
      lang,
      'app-version': appVersion,
      'device-id': ZenMoney.getData('deviceId')
    },
    body: {
      pan,
      expiry,
      password,
      reserveSms: false
    },
    sanitizeRequestLog: { body: { pan: true, expiry: true, password: true }, headers: { 'device-id': true } }
  })

  if (response.body?.errorMessage === 'Пользователь не зарегистрирован' || response.body?.errorMessage === 'Неправильный номер телефона или пароль') {
    throw new InvalidPreferencesError()
  }

  console.assert(response.ok, 'unexpected login response', response)
}

/**
 * Получаем токен
 *
 * @param phone номер телефона
 * @param smsCode код подтверждения из СМС сообщения
 */
export async function getToken (phone, smsCode) {
  const endpoint = '/registration/verify/' + smsCode + '/' + phone

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'POST',
    headers: {
      lang,
      'app-version': appVersion,
      'device-id': ZenMoney.getData('deviceId')
    },
    sanitizeRequestLog: { url: url => url.replace(phone, sanitize(phone, true)), headers: { 'device-id': true } },
    sanitizeResponseLog: { url: url => url.replace(phone, sanitize(phone, true)) }
  })

  if (response.body?.errorMessage === 'Пользователь не зарегистрирован' || response.body?.errorMessage === 'Неверный SMS-код') {
    throw new InvalidPreferencesError()
  }

  console.assert(response.ok, 'unexpected registration/verify response', response)

  ZenMoney.setData('token', response.body.data.token)
  ZenMoney.setData('isFirstRun', false)
}

/**
 * Получить список карт платежной системы UzCard
 *
 * @returns массив карт платежной системы UzCard в формате Дзенмани
 */
export async function getUzcardCards () {
  const endpoint = '/uzcard'

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'GET',
    headers: {
      lang,
      'app-version': appVersion,
      'device-id': ZenMoney.getData('deviceId'),
      token: ZenMoney.getData('token')
    },
    sanitizeRequestLog: { headers: { 'device-id': true, token: true } }
  })

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

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'GET',
    headers: {
      lang,
      'app-version': appVersion,
      'device-id': ZenMoney.getData('deviceId'),
      token: ZenMoney.getData('token')
    },
    sanitizeRequestLog: { headers: { 'device-id': true, token: true } }
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

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'GET',
    headers: {
      lang,
      'app-version': appVersion,
      'device-id': ZenMoney.getData('deviceId'),
      token: ZenMoney.getData('token')
    },
    sanitizeRequestLog: { headers: { 'device-id': true, token: true } }
  })

  console.assert(response.ok, 'unexpected visa response', response)

  return response.body.data.map(convertCard).filter(card => card !== null)
}

/**
 * Получить список кошельков
 *
 * @returns массив кошельков в формате Дзенмани
 */
export async function getWallets () {
  const endpoint = '/wallet'

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'GET',
    headers: {
      lang,
      'app-version': appVersion,
      'device-id': ZenMoney.getData('deviceId'),
      token: ZenMoney.getData('token')
    },
    sanitizeRequestLog: { headers: { 'device-id': true, token: true } }
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

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'GET',
    headers: {
      lang,
      'app-version': appVersion,
      'device-id': ZenMoney.getData('deviceId'),
      token: ZenMoney.getData('token')
    },
    sanitizeRequestLog: { headers: { 'device-id': true, token: true } }
  })

  console.assert(response.ok, 'unexpected account response', response)

  return response.body.data.map(convertAccount)
}

/**
 * Получить список вкладов
 *
 * @returns массив вкладов в формате Дзенмани
 */
export async function getDeposits () {
  const endpoint = '/deposit'

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'GET',
    headers: {
      lang,
      'app-version': appVersion,
      'device-id': ZenMoney.getData('deviceId'),
      token: ZenMoney.getData('token')
    },
    sanitizeRequestLog: { headers: { 'device-id': true, token: true } }
  })

  console.assert(response.ok, 'unexpected account response', response)

  return response.body.data.map(convertDeposit)
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

  for (const card of cards) {
    if (!ZenMoney.isAccountSkipped(card.id)) {
      const endpoint = '/uzcard/history?' +
        'cardId=' + card.id + '&' +
        'dateFrom=' + fromDate + '&' +
        'dateTo=' + toDate

      const response = await fetchJson(baseUrl + endpoint, {
        method: 'GET',
        headers: {
          lang,
          'app-version': appVersion,
          'device-id': ZenMoney.getData('deviceId'),
          token: ZenMoney.getData('token')
        },
        sanitizeRequestLog: { headers: { 'device-id': true, token: true } }
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

  for (const card of cards) {
    if (!ZenMoney.isAccountSkipped(card.id)) {
      const endpoint = '/humo/history?' +
        'cardId=' + card.id + '&' +
        'dateFrom=' + fromDate + '&' +
        'dateTo=' + toDate

      const response = await fetchJson(baseUrl + endpoint, {
        method: 'GET',
        headers: {
          lang,
          'app-version': appVersion,
          'device-id': ZenMoney.getData('deviceId'),
          token: ZenMoney.getData('token')
        },
        sanitizeRequestLog: { headers: { 'device-id': true, token: true } }
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

  for (const card of cards) {
    if (!ZenMoney.isAccountSkipped(card.id)) {
      const endpoint = '/visa/history?' +
        'cardId=' + card.id + '&' +
        'dateFrom=' + fromDate + '&' +
        'dateTo=' + toDate

      const response = await fetchJson(baseUrl + endpoint, {
        method: 'GET',
        headers: {
          lang,
          'app-version': appVersion,
          'device-id': ZenMoney.getData('deviceId'),
          token: ZenMoney.getData('token')
        },
        sanitizeRequestLog: { headers: { 'device-id': true, token: true } }
      })

      console.assert(response.ok, 'unexpected visa/history response', response)

      transactions = transactions.concat(response.body.data.map(transaction =>
        convertVisaCardTransaction(card, transaction)).filter(transaction => transaction !== null))
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

  for (const wallet of wallets) {
    if (!ZenMoney.isAccountSkipped(wallet.id)) {
      const endpoint = '/wallet/history?' +
        'id=' + wallet.id + '&' +
        'startDate=' + fromDate + '&' +
        'endDate=' + toDate

      const response = await fetchJson(baseUrl + endpoint, {
        method: 'GET',
        headers: {
          lang,
          'app-version': appVersion,
          'device-id': ZenMoney.getData('deviceId'),
          token: ZenMoney.getData('token')
        },
        sanitizeRequestLog: { headers: { 'device-id': true, token: true } }
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

  for (const account of accounts) {
    if (!ZenMoney.isAccountSkipped(account.id)) {
      const endpoint = '/account/statement?' +
        'id=' + account.id + '&' +
        'startDate=' + fromDate + '&' +
        'endDate=' + toDate

      const response = await fetchJson(baseUrl + endpoint, {
        method: 'GET',
        headers: {
          lang,
          'app-version': appVersion,
          'device-id': ZenMoney.getData('deviceId'),
          token: ZenMoney.getData('token')
        },
        sanitizeRequestLog: { headers: { 'device-id': true, token: true } }
      })

      console.assert(response.ok, 'unexpected account/statement response', response)

      transactions = transactions.concat(response.body.data.map(transaction =>
        convertAccountTransaction(account, transaction)))
    }
  }

  return transactions
}

/**
 * Получить список транзакций по вкладам
 *
 * @param accounts массив счетов
 * @param fromDate дата в формате ISO8601, с которой нужно выгружать транзакции
 * @param toDate дата в формате ISO8601, по которую нужно выгружать транзакции
 * @returns массив транзакций в формате Дзенмани
 */
export async function getDepositsTransactions (accounts, fromDate, toDate) {
  let transactions = []

  for (const account of accounts) {
    if (!ZenMoney.isAccountSkipped(account.id)) {
      const endpoint = '/deposit/statement?' +
        'absId=' + account.id + '&' +
        'startDate=' + fromDate + '&' +
        'endDate=' + toDate

      const response = await fetchJson(baseUrl + endpoint, {
        method: 'GET',
        headers: {
          lang,
          'app-version': appVersion,
          'device-id': ZenMoney.getData('deviceId'),
          token: ZenMoney.getData('token')
        },
        sanitizeRequestLog: { headers: { 'device-id': true, token: true } }
      })

      console.assert(response.ok, 'unexpected account/statement response', response)

      transactions = transactions.concat(response.body.data
        .filter(tx => tx.mvmtType !== '5') // код выплат ежедневных процентов на целевой счет
        .map(tx => convertDepositTransaction(account, tx))
      )
    }
  }

  return transactions
}
