import { MD5 } from 'jshashes'
import { get, omit } from 'lodash'
import { fetchJson } from '../../common/network'

const qs = require('querystring')
const md5 = new MD5()

const BASE_URL = 'https://api.tinkoff.ru/v1/'
const DEFAULT_HEADERS = {
  // "Accept": "*/*",
  // "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  'User-Agent': 'User-Agent: Zenmoney/android: 5.1.1/TCSMB/3.1.0',
  'Referrer': 'https://www.tinkoff.ru/mybank/'
}
const DEFAULT_GET_PARAMS = {
  appVersion: '4.4.5',
  platform: 'android',
  origin: 'mobile,ib5,loyalty,platform'
}
const DEFAULT_SIGN_PARAMS = {
  fingerprint: 'Zenmoney/android: 5.0/TCSMB/4.4.5###1080x1920x32###180###false###false###',
  mobile_device_os: 'android',
  mobile_device_os_version: '5.0',
  mobile_device_model: 'Zenmoney',
  root_flag: 'false'
  // imei:                     359092055350000
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
    console.log('>>> Создаём сессию:')
    const response = await fetchApiJson(auth, 'session', {
      headers: DEFAULT_HEADERS,
      sanitizeResponseLog: { body: { 'payload': true, 'trackingId': true } }
    })
    if (response.body.resultCode !== 'OK') { throw new Error('Ошибка: не удалось создать сессию с банком') }
    auth.sessionid = response.body.payload

    if (!auth.pinHash) {
      if (isInBackground) { throw new TemporaryError('>>> Необходима регистрация по ПИН-коду. Запрос в фоновом режиме не возможен. Прекращаем работу.') }

      // получаем пароль
      let password = preferences.password
      if (!password) {
        for (let i = 0; i < 2; i++) {
          password = await ZenMoney.readLine('Введите пароль от интернет-банка Тинькофф', {
            time: 120000,
            inputType: 'password'
          })
          if (password) {
            console.log('>>> Пароль получен от пользователя.')
            break
          }
        }
      } else { console.log('>>> Пароль получен из настроек подключения.') }
      if (!password) { throw new TemporaryError('Ошибка: не удалось получить пароль для входа') }

      const phone = getPhoneNumber(preferences.login)
      let resultCode, response
      if (phone) {
        console.log('>>> Авторизация по телефону...')
        response = await fetchApiJson(auth, 'sign_up', {
          ignoreErrors: true,
          shouldLog: false,
          headers: DEFAULT_HEADERS,
          get: {
            'phone': phone
          },
          sanitizeRequestLog: { url: true }
        })
        resultCode = response.body.resultCode
      } else {
        console.log('>>> Авторизация по логину...')
        response = await fetchApiJson(auth, 'sign_up', {
          ignoreErrors: true,
          shouldLog: false,
          headers: DEFAULT_HEADERS,
          get: {
            'username': preferences.login,
            'password': password
          },
          body: {
            ...DEFAULT_SIGN_PARAMS
          },
          sanitizeRequestLog: { url: true }
        })
        resultCode = response.body.resultCode
      }

      // ошибка входа по паролю
      if (resultCode.substr(0, 8) === 'INVALID_' || resultCode.substr(0, 9) === 'INTERNAL_') {
        throw new InvalidPreferencesError('Ответ от банка: ' + (response.body.plainMessage || response.body.errorMessage))
        // операция отклонена
      } else if (resultCode === 'OPERATION_REJECTED') {
        throw new TemporaryError('Ответ от банка: ' + (response.body.plainMessage || response.body.errorMessage))
        // если нужно подтверждение по смс
      } else if (resultCode === 'WAITING_CONFIRMATION') { // DEVICE_LINK_NEEDED
        console.log('>>> Необходимо подтвердить вход...')

        const msg = !lastIteration ? 'Введите код из SMS' : 'Необходимо заново авторизировать устройство. Введите код из SMS'
        const smsCode = await ZenMoney.readLine(msg, {
          inputType: 'number',
          time: 120000
        })

        console.log('>>> Подтверждение кодом:')
        // параметры нужно передавать в разных случаях по разному, поэтому передаём в избыточной форме
        response = await fetchApiJson(auth, 'confirm', {
          // ignoreErrors: true,
          headers: DEFAULT_HEADERS,
          get: {
            'initialOperation': 'sign_up',
            'initialOperationTicket': response.body.operationTicket,
            'confirmationData': `{"SMSBYID":"${smsCode}"}`
          },
          body: {
            'initialOperation': 'sign_up',
            'initialOperationTicket': response.body.operationTicket,
            'confirmationData': `{"SMSBYID":"${smsCode}"}`
          },
          sanitizeRequestLog: { body: { confirmationData: true } },
          sanitizeResponseLog: { url: true, body: { payload: { login: true, userId: true, sessionId: true, sessionid: true } } }
        })

        // проверим ответ на ошибки (проверка на ошибки вынесена в fetchApiJson)
        /* if (['INTERNAL_ERROR', 'CONFIRMATION_FAILED'].indexOf(response.body.resultCode) + 1) {
          throw new TemporaryError('Ошибка авторизации: ' + (response.body.plainMessage || response.body.errorMessage))
        } else if (response.body.resultCode !== 'OK') {
          throw new Error('Ошибка авторизации: ' + (response.body.plainMessage || response.body.errorMessage))
        } */

        // если вход по номеру телефона, отдельно проверяем пароль
        if (response.body.payload && response.body.payload.additionalAuth && response.body.payload.additionalAuth.needPassword) {
          console.log('>>> Ввод пароля:')
          response = await fetchApiJson(auth, 'sign_up', {
            // ignoreErrors: true,
            headers: DEFAULT_HEADERS,
            get: {
              'password': password
            },
            body: {
              ...DEFAULT_SIGN_PARAMS
            },
            sanitizeResponseLog: { url: true, body: { payload: { login: true, userId: true, sessionId: true, sessionid: true } } }
          })
        }
      } else {
        console.log('>>> Прошёл вход без подтверждения.')
        if (response.body.resultCode === 'AUTHENTICATION_FAILED') { throw new Error('Ошибка авторизации: ' + (response.body.plainMessage || response.body.errorMessage)) }
      }

      // получаем привилегии пользователя
      // if (response.body.payload && response.body.payload.accessLevel === 'CANDIDATE') {
      await levelUp(auth)
      // }

      // устанавливаем ПИН для быстрого входа
      auth.pinHash = md5.hex(Math.random())
      console.log('>>> Инициализация входа по пин-коду:')
      const savePin = await fetchApiJson(auth, 'mobile_save_pin', {
        ignoreErrors: true,
        headers: DEFAULT_HEADERS,
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
      console.log('>>> Вход по пин-коду:')
      const signUp2 = await fetchApiJson(auth, 'sign_up', {
        ignoreErrors: true,
        headers: DEFAULT_HEADERS,
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

export function getPhoneNumber (str) {
  const number = /^(?:\+?7|8|)(\d{10})$/.exec(str.trim())
  if (number) return '+7' + number[1]
  return null
}

async function levelUp (auth) {
  // получим привилегии пользователя
  console.log('>>> Попытка поднять привилегии:')
  const levelUp = await fetchApiJson(auth, 'level_up', {
    ignoreErrors: true,
    headers: DEFAULT_HEADERS,
    body: {
      ...DEFAULT_SIGN_PARAMS
    },
    sanitizeResponseLog: { body: { confirmationData: { Question: { question: true } } } }
  })

  if (levelUp.body.resultCode === 'OK') {
    console.log('>>> Успешно повысили привилегии пользователя.')
    return
  }

  // подтверждение через секретный вопрос
  if (levelUp.body.resultCode === 'WAITING_CONFIRMATION' && levelUp.body.confirmationData && levelUp.body.confirmationData.Question) {
    console.log('>>> Необходимо подтвердить права привилегий...')

    const answer = await ZenMoney.readLine('Секретный вопрос от банка: ' + levelUp.body.confirmationData.Question.question + '. Ответ на вопрос не сохраняется в Дзен-мани.', {
      inputType: 'text',
      time: 120000
    })

    console.log('>>> Авторизация контрольным вопросом:')
    const json = await fetchApiJson(auth, 'confirm', {
      ignoreErrors: true,
      headers: DEFAULT_HEADERS,
      get: {
        initialOperation: levelUp.body.initialOperation,
        initialOperationTicket: levelUp.body.operationTicket,
        confirmationType: 'Question',
        secretValue: answer
      },
      body: {
        confirmationData: { Question: answer }
      },
      sanitizeRequestLog: { body: { confirmationData: { Question: true } } }
    })

    // ответ на вопрос не верный
    if (json.body.resultCode === 'CONFIRMATION_FAILED') {
      throw new TemporaryError('Ответ отклонён банком: ' + (json.body.plainMessage || json.body.errorMessage))
    }
    // ответ не принят
    if (json.body.resultCode !== 'OK') {
      throw new Error('Ответ отклонён банком: ' + (json.body.plainMessage || json.body.errorMessage))
    }
    // всё хорошо, ответ верный
    console.log('>>> Ответ на секретный вопрос принят банком.')
  } else {
    throw new Error('Не удалось повысить привилегии пользователя для входа.')
  }
}

export async function fetchAccountsAndTransactions (auth, fromDate, toDate) {
  console.log('>>> Загружаем данные по счетам и операциям:')
  const accounts = await fetchApiJson(auth, 'grouped_requests',
    {
      headers: DEFAULT_HEADERS,
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
    response => get(response, 'body.payload[0].payload') && get(response, 'body.payload[1].payload')
  )
  return {
    accounts: accounts.body.payload[0].payload,
    transactions: accounts.body.payload[1].payload
  }
}

async function fetchApiJson (auth, url, options, predicate) {
  if (url.substr(0, 4) !== 'http') {
    url = BASE_URL + url
  }

  const params = {
    ...options.get,
    ...DEFAULT_GET_PARAMS
  }
  if (auth.sessionid) params.sessionid = auth.sessionid
  if (auth.deviceid) params.deviceId = auth.deviceid

  let response
  try {
    response = await fetchJson(url + '?' + qs.stringify(params), {
      method: options.method || 'POST',
      ...omit(options, ['method', 'get']),
      sanitizeRequestLog: {
        url: true,
        ...options.sanitizeRequestLog
      },
      sanitizeResponseLog: {
        url: true,
        ...options.sanitizeResponseLog
      }
    })
  } catch (e) {
    if (e.response && e.response.status >= 500 && e.response.status < 525) {
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
    if ([
      'INTERNAL_ERROR',
      'CONFIRMATION_FAILED',
      'INVALID_REQUEST_DATA',
      'REQUEST_RATE_LIMIT_EXCEEDED'
    ].indexOf(response.body.resultCode) + 1) {
      throw new TemporaryError('Ответ банка: ' + (response.body.plainMessage || response.body.errorMessage))
    } else if (response.body.resultCode !== 'OK') {
      throw new Error(response.body.plainMessage || response.body.errorMessage)
    }
  }
  return response
}

function validateResponse (response, predicate, message) {
  console.assert(!predicate || predicate(response), message || 'non-successful response')
}
