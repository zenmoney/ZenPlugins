import errors from '../../../locales/ru.json'
import { fetchJson } from '../../common/network'
import { generateRandomString } from '../../common/utils'
import { BankMessageError, InvalidOtpCodeError, InvalidPreferencesError, TemporaryError } from '../../errors'
import {
  convertAccount,
  convertAccountTransaction,
  convertCard,
  convertHumoCardTransaction,
  convertUzcardCardTransaction,
  convertVisaCardTransaction,
  convertWallet,
  convertWalletTransaction
} from './converters'

const baseUrl = 'https://mobile.kapitalbank.uz/api'

/**
 * Регистрирует идентификатор устройства в интернет-банке
 */
export async function registerDevice () {
  const endpoint = '/device'
  const deviceId = generateRandomString(32)

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'POST',
    headers: {
      lang: 'ru',
      'app-version': 'w0.0.1'
    },
    body: {
      deviceId: deviceId,
      name: 'ZenMoney'
    }
  })

  if (!response.ok) {
    throw new BankMessageError(response.toString())
  } else {
    ZenMoney.setData('deviceId', deviceId)
  }
}

/**
 * Проверка на существование клиента в банке
 *
 * @param phone номер телефона клиента
 */
export async function checkUser (phone) {
  const endpoint = '/check-user?phone=' + phone

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'GET',
    headers: {
      lang: 'ru',
      'app-version': 'w0.0.1',
      'device-id': ZenMoney.getData('deviceId')
    }
  })

  if (!response.ok) {
    throw new InvalidPreferencesError(errors.zenPlugin_invalidPreferencesError)
  }
}

/**
 * Вызвать отправку СМС кода на мобильный телефон
 *
 * @param phone номер телефона
 * @param password пароль
 */
export async function sendSmsCode (phone, password) {
  const endpoint = '/login'

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'POST',
    headers: {
      lang: 'ru',
      'app-version': 'w0.0.1',
      'device-id': ZenMoney.getData('deviceId')
    },
    body: {
      phone: phone,
      password: password,
      reserveSms: false
    }
  })

  if (!response.ok) {
    throw new InvalidPreferencesError(errors.zenPlugin_invalidLoginOrPasswordError)
  }
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
      lang: 'ru',
      'app-version': 'w0.0.1',
      'device-id': ZenMoney.getData('deviceId')
    }
  })

  if (!response.ok) {
    throw new InvalidOtpCodeError(errors.zenPlugin_invalidOtpCodeError)
  } else {
    ZenMoney.setData('token', response.body.data.token)
    ZenMoney.setData('isFirstRun', false)
  }
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
      lang: 'ru',
      'app-version': 'w0.0.1',
      'device-id': ZenMoney.getData('deviceId'),
      token: ZenMoney.getData('token')
    }
  })

  if (!response.ok) {
    throw new TemporaryError('Не удалось загрузить карты UzCard')
  } else {
    return response.body.data.map(convertCard)
  }
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
      lang: 'ru',
      'app-version': 'w0.0.1',
      'device-id': ZenMoney.getData('deviceId'),
      token: ZenMoney.getData('token')
    }
  })

  if (!response.ok) {
    throw new TemporaryError('Не удалось загрузить карты UzCard')
  } else {
    return response.body.data.map(convertCard)
  }
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
      lang: 'ru',
      'app-version': 'w0.0.1',
      'device-id': ZenMoney.getData('deviceId'),
      token: ZenMoney.getData('token')
    }
  })

  if (!response.ok) {
    throw new TemporaryError('Не удалось загрузить карты Visa')
  } else {
    return response.body.data.map(convertCard)
  }
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
      lang: 'ru',
      'app-version': 'w0.0.1',
      'device-id': ZenMoney.getData('deviceId'),
      token: ZenMoney.getData('token')
    }
  })

  if (!response.ok) {
    throw new TemporaryError('Не удалось загрузить счета')
  } else {
    return response.body.data.map(convertWallet)
  }
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
      lang: 'ru',
      'app-version': 'w0.0.1',
      'device-id': ZenMoney.getData('deviceId'),
      token: ZenMoney.getData('token')
    }
  })

  if (!response.ok) {
    throw new TemporaryError('Не удалось загрузить счета')
  } else {
    return response.body.data.map(convertAccount)
  }
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
          lang: 'ru',
          'app-version': 'w0.0.1',
          'device-id': ZenMoney.getData('deviceId'),
          token: ZenMoney.getData('token')
        }
      })

      if (!response.ok) {
        throw new TemporaryError('Не удалось загрузить операции по картам UzCard')
      } else {
        transactions = transactions.concat(response.body.data.data.map(transaction =>
          convertUzcardCardTransaction(card.id, transaction)))
      }
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
          lang: 'ru',
          'app-version': 'w0.0.1',
          'device-id': ZenMoney.getData('deviceId'),
          token: ZenMoney.getData('token')
        }
      })

      if (!response.ok) {
        throw new TemporaryError('Не удалось загрузить операции по картам Humo')
      } else {
        transactions = transactions.concat(response.body.data.map(transaction =>
          convertHumoCardTransaction(card.id, transaction)))
      }
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
          lang: 'ru',
          'app-version': 'w0.0.1',
          'device-id': ZenMoney.getData('deviceId'),
          token: ZenMoney.getData('token')
        }
      })

      if (!response.ok) {
        throw new TemporaryError('Не удалось загрузить операции по картам Visa')
      } else {
        transactions = transactions.concat(response.body.data.map(transaction =>
          convertVisaCardTransaction(card.id, transaction)))
      }
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
          lang: 'ru',
          'app-version': 'w0.0.1',
          'device-id': ZenMoney.getData('deviceId'),
          token: ZenMoney.getData('token')
        }
      })

      if (!response.ok) {
        throw new TemporaryError('Не удалось загрузить операции по кошелькам')
      } else {
        transactions = transactions.concat(response.body.data.map(transaction =>
          convertWalletTransaction(wallet.id, transaction)))
      }
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
          lang: 'ru',
          'app-version': 'w0.0.1',
          'device-id': ZenMoney.getData('deviceId'),
          token: ZenMoney.getData('token')
        }
      })

      if (!response.ok) {
        throw new TemporaryError('Не удалось загрузить операции по счетам')
      } else {
        transactions = transactions.concat(response.body.data.map(transaction =>
          convertAccountTransaction(account.id, transaction)))
      }
    }
  }

  return transactions
}
