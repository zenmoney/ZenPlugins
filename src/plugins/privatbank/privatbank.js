import { MD5, SHA1 } from 'jshashes'
import { createDateIntervals as commonCreateDateIntervals } from '../../common/dateUtils'
import * as network from '../../common/network'
import { retry } from '../../common/retry'
import { toAtLeastTwoDigitsString } from '../../common/stringUtils'

const sha1 = new SHA1()
const md5 = new MD5()

function formatDate (date) {
  return [date.getDate(), date.getMonth() + 1, date.getFullYear()].map(toAtLeastTwoDigitsString).join('.')
}

function createDateIntervals (fromDate, toDate) {
  const interval = 30 * 24 * 60 * 60 * 1000 // 30 days interval for fetching data
  const gapMs = 1
  return commonCreateDateIntervals({
    fromDate,
    toDate,
    addIntervalToDate: date => new Date(date.getTime() + interval - gapMs),
    gapMs
  })
}

export class PrivatBank {
  constructor ({ merchant, password, baseUrl }) {
    this.baseUrl = baseUrl
    this.merchant = merchant
    this.password = password
  }

  sign (data) {
    return sha1.hex(md5.hex(`${data}${this.password}`))
  }

  async fetch (url, data) {
    url = `${this.baseUrl}${url}`
    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>
            <request version="1.0">
                <merchant>
                    <id>${this.merchant}</id>
                    <signature>${this.sign(data)}</signature>
                </merchant>
                <data>${data}</data>
            </request>`
    const options = {
      method: 'POST',
      headers: {
        'Accept': 'application/xml, text/plain, */*',
        'Content-Type': 'application/xml;charset=UTF-8'
      },
      body: xml,
      sanitizeRequestLog: {
        url: (url) => '<string>/' + url.substring(this.baseUrl.length)
      },
      sanitizeResponseLog: {
        url: (url) => '<string>/' + url.substring(this.baseUrl.length)
      }
    }

    const response = await retry({
      getter: () => network.fetch(url, options),
      predicate: response => !(response.status === 429 || (response.body && (
        (response.status === 504 && response.body.indexOf('504 Gateway Time-out') >= 0) ||
        (response.status === 502 && response.body.indexOf('Bad Gateway') >= 0)))),
      maxAttempts: 3,
      delayMs: 2000
    })

    if (response.body) {
      if (response.body.indexOf('merchant is blocked') >= 0) {
        throw new TemporaryError('Мерчант заблокирован. Чтобы перевести мерчант в рабочий режим, ' +
          'авторизуйтесь в Приват24 и отправьте заявку на вкладке "Все услуги" - Бизнес - Мерчант - Заявки.')
      }
      if (response.body.indexOf('invalid signature') >= 0) {
        throw new InvalidPreferencesError(`Не удалось синхронизировать данные по мерчанту ${this.merchant}. ` +
          `Неверный пароль. Проверьте, что вы указали верный пароль в настройках подключения к банку.`)
      }
      if (response.body.indexOf('invalid ip:') >= 0) {
        throw new TemporaryError(`Не удалось синхронизировать данные по мерчанту ${this.merchant}. ` +
          `В настройках мерчанта в Приват24 укажите IP-адрес из настроек синхронизации.`)
      }
      if (response.body.indexOf('invalid merchant id') >= 0) {
        throw new InvalidPreferencesError(`Не удалось синхронизировать данные по мерчанту ${this.merchant}. ` +
          `Проверьте, что вы указали верный ID мерчанта в настройках подключения к банку.`)
      }
      if (response.body.indexOf('this card is not in merchants card') >= 0) {
        throw new InvalidPreferencesError(`Не удалось получить баланс карты по мерчанту ${this.merchant}. ` +
          `Если карта была недавно перевыпущена, зарегистрируйте для неё новый мерчант и ` +
          `обновите его в настройках подключения к банку.`)
      }
      if (/point\s+\/.*not allowed for merchant/.test(response.body)) {
        throw new TemporaryError(`Не удалось синхронизировать данные по мерчанту ${this.merchant}. ` +
          `Проверьте, что в Приват24 вы поставили галочки "Баланс по счёту мерчанта физлица" и ` +
          `"Выписка по счёту мерчанта физлица".`)
      }
      if (response.body.indexOf('временно недоступен') >= 0) {
        throw new TemporaryError('Информация из ПриватБанка временно недоступна. Запустите синхронизацию через некоторое время.\n\nЕсли ситуация повторится, выберите другой IP-адрес в настройках синхронизации с банком.')
      }
    }
    console.assert(response && response.status === 200 && response.body, 'non-successful response')
    return response.body
  }

  async fetchAccounts () {
    const data =
      `<oper>cmt</oper>
            <wait>5</wait>
            <test>0</test>
            <payment id="">
                <prop name="country" value="UA"/>
            </payment>`
    return this.fetch('balance', data)
  }

  async fetchTransactions (fromDate, toDate) {
    fromDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
    toDate = toDate || new Date()
    const dates = createDateIntervals(fromDate, toDate).reverse()
    return Promise.all(dates.map(([fromDate, toDate]) => {
      const data =
        `<oper>cmt</oper>
            <wait>5</wait>
            <test>0</test>
            <payment id="">
                <prop name="sd" value="${formatDate(fromDate)}"/>
                <prop name="ed" value="${formatDate(toDate)}"/>
            </payment>`
      return this.fetch('rest_fiz', data)
    }))
  }
}
