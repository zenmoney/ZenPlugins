import WebSocket from '../../common/protocols/webSocket'
import { generateUUID, generateRandomString } from '../../common/utils'
import { IncompatibleVersionError, InvalidPreferencesError } from '../../errors'
import { SHA512, MD5 } from 'jshashes'
import { convertAccounts, convertTransaction } from './converters'

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
        app_version: '5.9.0',
        datetime: datetime,
        device_id: ZenMoney.getData('deviceId'),
        password: password,
        phone_num: getPhoneNumber(phone)
      },
      sanitizeRequestLog: { parameters: { device_id: true, password: true, phone_num: true } }
    })

    console.assert(response.body.data[0][0].error === 0, 'unexpected login response', response)

    ZenMoney.setData('sessionKey', response.body.data[1][0].session_key)
  }

  /**
   * Получить список счетов и их баланс
   *
   * @param phone номер телефона
   */
  async getAccountsWithBalances (phone) {
    const getAccountsMethod = 'get.accounts'
    const getBalancesMethod = 'get.balance.multiple'

    const accounts = await this.callGate(getAccountsMethod, {
      parameters: {
        session_key: ZenMoney.getData('sessionKey'),
        phone_num: getPhoneNumber(phone)
      },
      sanitizeRequestLog: { parameters: { session_key: true, phone_num: true } }
    })

    console.assert(accounts.body.data[0][0].error === 0, 'unexpected get accounts response', accounts)

    const accountsForBalanceRequests = accounts.body.data[1].map(account => {
      return {
        account_id: account.id,
        card_num_crypted: account.card_num_crypted,
        card_num_hash: account.card_num_hash
      }
    })

    const balances = await this.callGate(getBalancesMethod, {
      parameters: {
        session_key: ZenMoney.getData('sessionKey'),
        phone_num: getPhoneNumber(phone),
        accounts: accountsForBalanceRequests
      },
      sanitizeRequestLog: { parameters: { session_key: true, phone_num: true } }
    })
    console.assert(balances.body.data[0][0].error === 0, 'unexpected get balances response', balances)
    return convertAccounts(accounts.body.data[1], balances.body.data[1])
  }

  /**
   * Получить список транзакций
   *
   * @param phone номер телефона
   * @param fromDate дата с которой нужно выгружать транзакции
   * @param toDate дата по которую нужно выгружать транзакции
   * @param accounts список счетов в формате Дзенмани
   */
  async getTransactions (phone, fromDate, toDate, accounts) {
    const method = 'get.payment.list'
    const accountsInPlainArray = accounts.map(account => Number(account.id))

    const response = await this.callGate(method, {
      parameters: {
        session_key: ZenMoney.getData('sessionKey'),
        phone_num: getPhoneNumber(phone),
        page_number: 1,
        page_size: 999,
        date_start: fromDate.toISOString().split('T')[0],
        date_end: toDate.toISOString().split('T')[0]
      },
      sanitizeRequestLog: { parameters: { session_key: true, phone_num: true } }
    })

    console.assert(response.body.data[0][0].error === 0, 'unexpected login response', response)

    return response.body.data[1].map(transaction => {
      /*
        Если это операция пополнение кошелька (-6) или в идентификаторе счета указан неизвестный счет (скорее всего, мерчанта),
        то ставим идентификатор счета равным идентификатору кошелька, потому что по факту производится оплата с кошелька или зачисление на кошелек.

        Вообще по-хорошему нужно выявить и пройтись по всем минусовым `service_id`, сделать check'и и связки.
        Например, пополнение кошелька (-6) невозможно без прикрепленной карты, а значит это перевод и нужно это соответственно оформить, но у меня времени нет.
      */
      if ((transaction.service_id === -6 && transaction.credit === 1) || !accountsInPlainArray.includes(transaction.account_id)) {
        transaction.account_id = accounts.find(account => account.type === 'checking').id
      }

      return transaction
    }).map(convertTransaction)
  }
}
