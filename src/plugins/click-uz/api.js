import { MD5, SHA512 } from 'jshashes'
import { dateInTimezone, toISODateString } from '../../common/dateUtils'
import WebSocket from '../../common/protocols/webSocket'
import { generateRandomString, generateUUID } from '../../common/utils'
import { BankMessageError, IncompatibleVersionError, InvalidOtpCodeError, InvalidPreferencesError } from '../../errors'

const baseUrl = 'api.click.uz:8443'
const sha512 = new SHA512()
const md5 = new MD5()

function getPhoneNumber (rawPhoneNumber) {
  const normalizedPhoneNumber = /^(?:\+?998)(\d{9})$/.exec(rawPhoneNumber.trim())

  if (normalizedPhoneNumber) {
    return '998' + normalizedPhoneNumber[1]
  }

  throw new InvalidPreferencesError()
}

export default class ClickPluginApi {
  constructor () {
    this._socket = null
  }

  /**
   * @private
   */
  async callGate (method, {
    parameters,
    sanitizeRequestLog,
    sanitizeResponseLog
  }) {
    console.assert(this._socket, 'Connection must be established, before sending data')
    const id = generateUUID()
    return this._socket.send(id, {
      body: {
        method: method,
        parameters: parameters,
        request_id: id
      },
      sanitizeRequestLog,
      sanitizeResponseLog
    })
  }

  async connect () {
    if (!this._socket) {
      this._socket = new WebSocket()
      this._socket.getResponseId = (body) => body.request_id
      await this._socket.open('wss://' + baseUrl, {
        headers: {
          Host: baseUrl,
          Origin: 'https://my.click.uz'
        }
      })
    }
  }

  async disconnect () {
    if (this._socket) {
      await this._socket.close()
      this._socket = null
    }
  }

  /**
   * Отправляет запрос на регистрацию устройства
   *
   * @param phone номер телефона
   */
  async registerDevice (phone) {
    const method = 'device.register.request'
    const imei = generateRandomString(32)
    const deviceRegisterDateTime = Math.round(Date.now() / 1000)

    if (!ZenMoney.WebSocket) {
      throw new IncompatibleVersionError()
    }

    const response = await this.callGate(method, {
      parameters: {
        phone_num: getPhoneNumber(phone),
        imei: imei,
        datetime: deviceRegisterDateTime,
        device_info: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.183 Safari/537.36',
        device_name: 'ZenMoney',
        device_type: 4
      },
      sanitizeRequestLog: { parameters: { phone_num: true, imei: true } }
    })

    console.assert(response.body.data[0][0].error === 0, 'unexpected register device response', response)

    ZenMoney.setData('deviceId', response.body.data[1][0].device_id)
    ZenMoney.setData('deviceRegisterDateTime', deviceRegisterDateTime)
  }

  /**
   * Подтверждает регистрацию устройства по СМС коду
   *
   * @param phone номер телефона
   * @param smsCode СМС код
   */
  async confirmDevice (phone, smsCode) {
    const method = 'device.register.confirm'

    const response = await this.callGate(method, {
      parameters: {
        phone_num: getPhoneNumber(phone),
        device_id: ZenMoney.getData('deviceId'),
        device_remember: 1,
        sms_code: smsCode
      },
      sanitizeRequestLog: { parameters: { phone_num: true, device_id: true, sms_code: true } }
    })
    // eslint-disable-next-line camelcase
    if (response.body?.data?.[0]?.[0]?.error_code && [
      /Неверный СМС код/
    ].some(pattern => pattern.test(response.body.data[0][0].error_code))) {
      throw new InvalidOtpCodeError()
    }

    console.assert(response.body.data[0][0].error === 0, 'unexpected confirm device response', response)
  }

  /**
   * Авторизуется в системе по номеру телефона и паролю (Click PIN), в ответ получает ключ сессии
   *
   * @param phone номер телефона
   * @param password пароль
   */
  async login (phone, clickPin) {
    const method = 'app.login'
    const datetime = Math.round(Date.now() / 1000)
    const token = sha512.hex(ZenMoney.getData('deviceId') + ZenMoney.getData('deviceRegisterDateTime') + phone)
    const password = sha512.hex(token + datetime + md5.hex(clickPin))

    const response = await this.callGate(method, {
      parameters: {
        app_version: '6.4.0',
        datetime: datetime,
        device_id: ZenMoney.getData('deviceId'),
        password: password,
        phone_num: getPhoneNumber(phone)
      },
      sanitizeRequestLog: { parameters: { device_id: true, password: true, phone_num: true } }
    })

    // eslint-disable-next-line camelcase
    if (response.body?.data?.[0]?.[0]?.error_note) {
      if ([
        /CLICK-PIN/
      ].some(pattern => pattern.test(response.body.data[0][0].error_note))) {
        throw new InvalidPreferencesError('Неверно введен CLICK-PIN')
      }

      if (response.body.data[0][0].error_note === 'Клиент не зарегестрирован') {
        throw new BankMessageError(response.body.data[0][0].error_note)
      }
    }

    console.assert(response.body.data[0][0].error === 0, 'unexpected login response', response)

    ZenMoney.setData('sessionKey', response.body.data[1][0].session_key)
  }

  async getAccountsBalances (phone, accounts) {
    const accountsForBalanceRequests = accounts.map(account => {
      return {
        account_id: account.id,
        card_num_crypted: account.card_num_crypted,
        card_num_hash: account.card_num_hash
      }
    })

    const balances = await this.callGate('get.balance.multiple', {
      parameters: {
        session_key: ZenMoney.getData('sessionKey'),
        phone_num: getPhoneNumber(phone),
        accounts: accountsForBalanceRequests
      },
      sanitizeRequestLog: { parameters: { session_key: true, phone_num: true } }
    })

    console.assert(balances.body.data[0][0].error === 0, 'unexpected get balances response', balances)

    return balances.body.data[1]
  }

  async getAccounts (phone) {
    const accounts = await this.callGate('get.accounts', {
      parameters: {
        session_key: ZenMoney.getData('sessionKey'),
        phone_num: getPhoneNumber(phone)
      },
      sanitizeRequestLog: { parameters: { session_key: true, phone_num: true } }
    })

    console.assert(accounts.body.data[0][0].error === 0, 'unexpected get accounts response', accounts)
    return accounts.body.data[1]
  }

  /**
   * Получить список транзакций
   *
   * @param phone номер телефона
   * @param fromDate дата с которой нужно выгружать транзакции
   * @param toDate дата по которую нужно выгружать транзакции
   * @param accounts список счетов в формате Дзенмани
   */
  async getTransactions (phone, fromDate, toDate) {
    const method = 'get.payment.list'

    const response = await this.callGate(method, {
      parameters: {
        session_key: ZenMoney.getData('sessionKey'),
        phone_num: getPhoneNumber(phone),
        page_number: 1,
        page_size: 999,
        date_start: toISODateString(dateInTimezone(fromDate, 300)),
        date_end: toISODateString(dateInTimezone(toDate, 300))
      },
      sanitizeRequestLog: { parameters: { session_key: true, phone_num: true } }
    })

    console.assert(response.body.data[0][0].error === 0, 'unexpected login response', response)

    return response.body.data[1]
  }
}
