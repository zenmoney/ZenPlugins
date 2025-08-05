import { fetchJson } from '../../common/network'
import { BankMessageError, InvalidLoginOrPasswordError, InvalidOtpCodeError, InvalidPreferencesError } from '../../errors'
import {
  convertCardTransaction, handleCardType
} from './converters'

const baseUrl = 'https://bankapi.kapitalbank.az/api'

/**
 * Чтобы избежать засорение девайсами в банке, добавил псевдо-генерацию по номеру телефона.
 * Спасибо Дмитрию Васильеву (jonny3D) за CodeReview
 *
 * @param phone номер телефона
 */
function generateDeviceIdByPhone (phone) {
  let result = ''
  const generator = function (s) {
    switch (s) {
      case '+':
        return 'p'
      case '0':
        return 'q'
      case '1':
        return '1'
      case '2':
        return '2'
      case '3':
        return 'g'
      case '4':
        return 'l'
      case '5':
        return 'm'
      case '6':
        return 'r'
      case '7':
        return 'e'
      case '8':
        return '8'
      case '9':
        return 's'
      default:
        return 'n'
    }
  }

  for (let i = 0; i < phone.length; i++) { result += generator(phone[i]) }

  return result + '_android'
}

/**
 * Регистрирует идентификатор устройства в интернет-банке
 *
 * @param phone номер телефона
 * @param password пароль
 */

export const uA = {
  r: true,
  m: 'ZenMoney',
  os: 'android',
  osV: '11',
  v: '2.64.24'
}

/**
 * Отправить смс код
 * @param phone номер телефона
 * @param password пароль
 */
export async function startRegistrationByIB (phone, password) {
  const endpoint = '/0.3/registration/startRegistrationByIB'
  const deviceId = generateDeviceIdByPhone(phone)

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'POST',
    headers: {},
    body: {
      login: getPhoneNumber(phone),
      password,
      dId: deviceId,
      dt: 'android',
      lang: 'ru',
      uA
    },
    sanitizeRequestLog: { body: { dId: true, login: true, password: true } }
  })

  if (response.body?.error) {
    if (response.body?.error.code === 25) throw new InvalidLoginOrPasswordError()
    else throw new BankMessageError(response.body?.error.message)
  }

  console.assert(response.ok, 'unexpected device response', response)

  ZenMoney.setData('deviceId', deviceId)
  ZenMoney.setData('registrationId', response.body?.data.registrationId)
}

/**
 * Проверить OTP код
 *
 * @param otp смс код
 */
export async function getRegistrationData (otp) {
  const endpoint = '/0.3/registration/getRegistrationData'

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'POST',
    headers: {},
    body: {
      otp,
      registrationId: ZenMoney.getData('registrationId'),
      dId: ZenMoney.getData('deviceId'),
      dt: 'android',
      lang: 'ru',
      uA
    },
    sanitizeRequestLog: { body: { dId: true } }
  })

  if (response.body?.data.ibRegistered === undefined) {
    throw new InvalidOtpCodeError()
  }

  console.assert(response.ok, 'unexpected login response', response)
}

/**
 * Сам не понял, зачем программисты этого банка создали этот метод. Заканчивает регистрацию в интернет банке.
 * Метод API банка зачем-то возвращает обратно data { password: пароль }
 *
 * @param phone номер телефона
 * @param password пароль
 */
export async function finalizeRegistration (phone, password) {
  const endpoint = '/0.3/registration/finalizeRegistration'

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'POST',
    headers: {},
    body: {
      password,
      registrationId: ZenMoney.getData('registrationId'),
      dId: ZenMoney.getData('deviceId'),
      dt: 'android',
      lang: 'ru',
      uA
    },
    sanitizeRequestLog: { body: { dId: true, password: true } },
    sanitizeResponseLog: { body: { password: true } }
  })

  if (response.body?.data.password !== password) {
    throw new InvalidPreferencesError()
  }

  ZenMoney.setData('phone', phone)
  ZenMoney.setData('password', password)

  console.assert(response.ok, 'unexpected login response', response)
}

/**
 * Получаем токен
 *
 * @param phone номер телефона
 * @param password пароль
 */
export async function login (phone, password) {
  const endpoint = '/0.3/authentication/login'
  const response = await fetchJson(baseUrl + endpoint, {
    method: 'POST',
    headers: {},
    body: {
      login: getPhoneNumber(phone),
      password,
      dId: ZenMoney.getData('deviceId'),
      dt: 'android',
      lang: 'ru',
      uA
    },
    sanitizeRequestLog: { body: { dId: true, login: true, password: true } },
    sanitizeResponseLog: { body: { sK: true } }
  })
  console.assert(response.ok, 'unexpected registration/verify response', response)

  ZenMoney.setData('token', response.body.data.sK)
  ZenMoney.setData('isFirstRun', false)
  ZenMoney.saveData()
}

/**
 * Получить список карт
 *
 * @returns массив карт в формате Дзенмани
 */
export async function getProducts () {
  const endpoint = '/0.4/products/getProducts'

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'POST',
    headers: {},
    body: {
      includeBalance: true,
      productTypes: [
        7,
        1,
        6
      ],
      sortByUsage: false,
      dId: ZenMoney.getData('deviceId'),
      dt: 'android',
      lang: 'ru',
      sK: ZenMoney.getData('token'),
      uA
    },
    sanitizeRequestLog: { body: { dId: true, login: true, password: true } },
    sanitizeResponseLog: { body: { sK: true } }
  })

  console.assert(response.ok, 'unexpected response', response)

  return response.body.data.map(handleCardType).filter(card => card !== null)
}

/**
 * Получить список транзакций
 *
 * @param cards массив карт
 * @param fromDate дата в формате ISO8601, с которой нужно выгружать транзакции
 * @param toDate дата в формате ISO8601, по которую нужно выгружать транзакции
 * @returns массив транзакций в формате Дзенмани
 */
export async function getProductsTransactions (cards, fromDate, toDate) {
  let transactions = []

  for (const card of cards) {
    if (!ZenMoney.isAccountSkipped(card.id)) {
      const endpoint = '/0.4/operations/getProductStatement'

      // 2022-05-14T20:00:00.000Z
      const response = await fetchJson(baseUrl + endpoint, {
        method: 'POST',
        headers: {},
        body: {
          // убираем миллисекунды и Z, потому что сервер жалуется
          from: fromDate.substring(0, fromDate.length - 5),
          id: card.id,
          paging: {
            count: 2000
          },
          to: toDate.substring(0, toDate.length - 5),
          type: 3,
          dId: ZenMoney.getData('deviceId'),
          dt: 'android',
          lang: 'ru',
          sK: ZenMoney.getData('token'),
          uA
        },
        sanitizeRequestLog: { body: { dId: true, login: true, password: true, sK: true } },
        sanitizeResponseLog: { body: { sK: true } }
      })

      if (response.body.error !== undefined) throw new BankMessageError(response.body.error.message)

      transactions = transactions.concat(response.body.data.operations.objects.map(transaction =>
        convertCardTransaction(card, transaction)))
    }
  }

  return transactions
}

/**
 * Нормализация номера телефона
 *
 * @param rawPhoneNumber номер телефона, предоставленный пользователем
 * @returns 12-значный номер телефона в формате +994501234567
 */
function getPhoneNumber (rawPhoneNumber) {
  const normalizedPhoneNumber = /^\+?994(\d{9})$/.exec(rawPhoneNumber.trim())

  if (normalizedPhoneNumber) {
    return '+994' + normalizedPhoneNumber[1]
  }

  throw new InvalidPreferencesError()
}
