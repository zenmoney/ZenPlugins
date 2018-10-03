import { MD5 } from 'jshashes'
import * as Network from '../../common/network'
import _ from 'lodash'

const md5 = new MD5()

const baseUrl = 'https://api01.tinkoff.ru/v1/'
const defaultHeaders = {
  // "Accept": "*/*",
  // "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  'User-Agent': 'User-Agent: Sony D6503/android: 5.1.1/TCSMB/3.1.0',
  'Referrer': 'https://www.tinkoff.ru/mybank/'
}

export async function login (preferences, isInBackground, auth, lastIteration) {
  if (auth.pinHash && auth.sessionid) { console.log('>>> Cессия уже установлена. Используем её.') } else {
    console.log('>>> Пытаемся войти...')

    // определяем идентификатор устройства
    auth.deviceid = ZenMoney.getData('device_id')
    if (!auth.deviceid) {
      console.log('>>> Первый запуск подключения...')
      auth.deviceid = md5.hex(Math.random().toString())
      ZenMoney.setData('device_id', auth.deviceid)
    }

    // создаём сессию
    const response = await fetchJson(auth, 'session', {
      headers: defaultHeaders,
      sanitizeResponseLog: { body: { 'payload': true } }
    })
    if (response.body.resultCode !== 'OK') { throw new Error('Ошибка: не удалось создать сессию с банком') }
    auth.sessionid = response.body.payload

    if (!auth.pinHash) {
      if (isInBackground) { throw new TemporaryError('>>> Необходима регистрация по ПИН-коду. Запрос в фоновом режиме не возможен. Прекращаем работу.') }

      // ПИНа ещё нет, установим его =====================================================================================================================
      // получаем пароль
      let password = preferences.password
      if (!password) {
        for (let i = 0; i < 2; i++) {
          password = await ZenMoney.readLine('Введите пароль для входа в интернет-банк Тинькофф', {
            time: 120000,
            inputType: 'password'
          })
          if (password) {
            console.log('>>> Пароль получен от пользователя.')
            break
          }
        }
      } else { console.log('>>> Пароль получен из настроек подключения.') }

      if (!password) { throw new Error('Ошибка: не удалось получить пароль для входа') }

      // входим по логину-паролю
      const signUp = await fetchJson(auth, 'sign_up', {
        ignoreErrors: true,
        shouldLog: false,
        headers: defaultHeaders,
        get: {
          'username': preferences.login,
          'password': password
        }
      })
      const resultCode = signUp.body.resultCode

      // ошибка входа по паролю
      if (resultCode.substr(0, 8) === 'INVALID_') {
        throw new InvalidPreferencesError('Ответ от банка: ' + (signUp.body.plainMessage || signUp.body.errorMessage))
        // операция отклонена
      } else if (resultCode === 'OPERATION_REJECTED') {
        throw new Error('Ответ от банка: ' + (signUp.body.plainMessage || signUp.body.errorMessage), true, true)
        // если нужно подтверждение по смс
      } else if (resultCode === 'WAITING_CONFIRMATION') { // DEVICE_LINK_NEEDED
        console.log('>>> Необходимо подтвердить вход...')

        const msg = !lastIteration ? 'Введите код подтверждения из СМС для входа в интернет-банк Тинькофф' : 'Необходимо заново авторизировать устройство. Введите код подтверждения из СМС'
        const smsCode = await ZenMoney.readLine(msg, {
          inputType: 'number',
          time: 120000
        })

        const json2 = await fetchJson(auth, 'confirm', {
          ignoreErrors: true,
          headers: defaultHeaders,
          get: {
            'confirmationData': '{"SMSBYID":"' + smsCode + '"}',
            'initialOperationTicket': signUp.body.operationTicket
          },
          body: {
            'initialOperation': 'sign_up'
          },
          sanitizeResponseLog: { body: { payload: { login: true, userId: true } } }
        })

        // проверим ответ на ошибки
        if (['INTERNAL_ERROR', 'CONFIRMATION_FAILED'].indexOf(json2.body.resultCode) + 1) { throw new TemporaryError('Ошибка авторизации: ' + (json2.body.plainMessage || json2.body.errorMessage)) } else if (json2.body.resultCode !== 'OK') { throw new Error('Ошибка авторизации: ' + (json2.body.plainMessage || json2.body.errorMessage)) }
      } else {
        console.log('>>> Прошёл вход без подтверждения.')
        if (signUp.body.resultCode === 'AUTHENTICATION_FAILED') { throw new Error('Ошибка авторизации: ' + (signUp.body.plainMessage || signUp.body.errorMessage)) }
      }

      // получаем привилегии пользователя
      await levelUp(auth)

      // устанавливаем ПИН для быстрого входа
      auth.pinHash = md5.hex(Math.random())
      const savePin = await fetchJson(auth, 'mobile_save_pin', {
        ignoreErrors: true,
        headers: defaultHeaders,
        get: {
          pinHash: auth.pinHash
        }
      })

      if (savePin.body.resultCode === 'OK') {
        console.log('>>> Установили ПИН-код для быстрого входа.')
        ZenMoney.setData('pinHash', auth.pinHash)

        // сохраним время установки пин-кода для авторизации
        const dt = new Date()
        const dtOffset = dt.getTimezoneOffset() * 60 * 1000
        const pinHashTime = dt.getTime() - dtOffset + 3 * 60 * 1000 // по Москве
        ZenMoney.setData('pinHashTime', pinHashTime)
      } else {
        console.log('Не удалось установить ПИН-код для быстрого входа: ' + JSON.stringify(savePin))
        ZenMoney.setData('pinHash', null)
        ZenMoney.setData('pinHashTime', null)
      }
    } else {
      // ПИН есть, входим по нему ========================================================================================================================
      const pinHashDate = ZenMoney.getData('pinHashTime', 0)
      const oldSessionId = ZenMoney.getData('session_id', 0)
      const signUp2 = await fetchJson(auth, 'sign_up', {
        ignoreErrors: true,
        headers: defaultHeaders,
        get: {
          'auth_type': 'pin',
          'pinHash': auth.pinHash,
          'auth_type_set_date': pinHashDate,
          'oldSessionId': oldSessionId
        }
      })
      // console.log('SIGN_UP 2: '+ JSON.stringify(sign_up));

      if (['DEVICE_LINK_NEEDED', 'WRONG_PIN_CODE', 'PIN_ATTEMPS_EXCEEDED'].indexOf(signUp2.body.resultCode) + 1) {
        auth.pinHash = null
        ZenMoney.setData('pinHash', null)

        switch (signUp2.body.resultCode) {
          // устройство не авторизировано
          // устройство не авторизировано
          case 'DEVICE_LINK_NEEDED':
            if (lastIteration) { throw new InvalidPreferencesError('Требуется привязка устройства. Пожалуйста, пересоздайте подключение к банку.') }
            // попытка повторного логина с генерацией нового пин-кода
            console.log('>>> Требуется привязка устройства. Перелогиниваемся!')
            return login(preferences, isInBackground, auth, true)

            // не верный пин-код
          case 'WRONG_PIN_CODE':
          case 'PIN_ATTEMPS_EXCEEDED':
            if (lastIteration) { throw new InvalidPreferencesError('Ошибка входа по ПИН-коду. Пожалуйста, пересоздайте подключение к банку.') }
            // попытка повторного логина с генерацией нового пин-кода
            console.log('>>> Нужно установить новый ПИН-код. Перелогиниваемся!')
            return login(preferences, isInBackground, auth, true)

          default:
            break
        }
      } else if (signUp2.body.resultCode !== 'OK') {
        ZenMoney.setData('pinHash', null)
        throw new TemporaryError('Ошибка входа по ПИН-коду: ' + (signUp2.body.plainMessage || signUp2.body.errorMessage))
      } else { console.log('>>> Успешно вошли по ПИН-коду.') }

      // получаем привилегии пользователя
      await levelUp(auth)
    }

    // сохраним id сесии для следующего входа
    ZenMoney.setData('session_id', auth.sessionid)
    ZenMoney.setData('pinHash', auth.pinHash)
  }

  return auth
}

async function levelUp (auth) {
  // получим привилегии пользователя
  const levelUp = await fetchJson(auth, 'level_up', {
    ignoreErrors: true,
    headers: defaultHeaders
  })

  if (levelUp.body.resultCode === 'OK') {
    console.log('>>> Успешно повысили привилегии пользователя.')
    return
  }

  // подтверждение через секретный вопрос
  if (levelUp.body.resultCode === 'WAITING_CONFIRMATION' && levelUp.body.confirmationData && levelUp.body.confirmationData.Question) {
    console.log('>>> Необходимо подтвердить права привилегий...')

    const answer = await ZenMoney.readLine('Секретный вопрос от банка: ' + levelUp.body.confirmationData.Question.question + '. Ответ на этот вопрос сразу передается в банк.', {
      inputType: 'text',
      time: 120000
    })

    const json = await fetchJson(auth, 'confirm', {
      ignoreErrors: true,
      headers: defaultHeaders,
      body: {
        initialOperation: levelUp.body.initialOperation,
        initialOperationTicket: levelUp.body.operationTicket,
        confirmationData: '{"Question":"' + answer + '"}'
      }
    })

    // ответ на вопрос не верный
    if (json.body.resultCode === 'CONFIRMATION_FAILED') {
      throw new TemporaryError('Ответ не верный: ' + (json.body.plainMessage || json.body.errorMessage))
    }
    // ответ не принят
    if (json.body.resultCode !== 'OK') {
      throw new Error('Ответ не принят: ' + (json.body.plainMessage || json.body.errorMessage))
    }
    // всё хорошо, ответ верный
    console.log('>>> Ответ на секретный вопрос принят банком.')
  } else {
    throw new Error('Не удалось повысить привилегии пользователя для входа!')
  }
}

export async function fetchAccountsAndTransactions (auth, fromDate, toDate) {
  console.log('>>> Загружаем данные по счетам и операциям...')
  const accounts = await fetchJson(auth, 'grouped_requests',
    {
      headers: defaultHeaders,
      get: {
        _methods: 'accounts_flat',
        requestsData: JSON.stringify([
          {
            key: 0,
            operation: 'accounts_flat'
          },
          {
            key: 1,
            operation: 'operations',
            params: {
              start: fromDate
            }
          }
        ])
      }
    },
    response => _.get(response, 'body.payload[0].payload') && _.get(response, 'body.payload[1].payload')
  )
  return {
    accounts: accounts.body.payload[0].payload,
    transactions: accounts.body.payload[1].payload
  }
}

async function fetchJson (auth, url, options, predicate) {
  const params = []
  auth.sessionid && params.push(encodeURIComponent('sessionid') + '=' + encodeURIComponent(auth.sessionid))
  if (options.get) {
    for (let param in options.get) {
      if (options.get.hasOwnProperty(param)) { params.push(`${encodeURIComponent(param)}=${encodeURIComponent(options.get[param])}`) }
    }
  }
  params.push(encodeURIComponent('appVersion') + '=' + encodeURIComponent('4.1.3'))
  params.push(encodeURIComponent('platform') + '=' + encodeURIComponent('android'))
  params.push(encodeURIComponent('origin') + '=' + encodeURIComponent('mobile,ib5,loyalty,platform'))
  auth.deviceid && params.push(encodeURIComponent('deviceId') + '=' + encodeURIComponent(auth.deviceid))

  if (url.substr(0, 4) !== 'http') {
    url = baseUrl + url
  }

  let response
  try {
    response = await Network.fetchJson(url + '?' + params.join('&'), {
      method: options.method || 'POST',
      ..._.omit(options, ['method', 'get'])
    })
  } catch (e) {
    if (e.response && e.response.status === 503) {
      throw new TemporaryError('Информация из банка Тинькофф временно недоступна. Повторите синхронизацию через некоторое время.')
    } else {
      throw e
    }
  }
  if (response.status !== 200) {
    const message = response.body && response.body.message
    throw new Error(response.statusText + (message ? ': ' + message : ''))
  }
  if (predicate) { validateResponse(response, response => response.body && predicate(response)) }
  if (options && !options.ignoreErrors && response.body) {

  }
  return response
}

function validateResponse (response, predicate, message) {
  console.assert(!predicate || predicate(response), message || 'non-successful response')
}
