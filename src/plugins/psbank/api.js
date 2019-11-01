import { generateUUID, generateRandomString, generateMacAddress } from '../../common/utils'
import { fetchJson } from '../../common/network'
import * as forge from 'node-forge'
import { get } from 'lodash'
import { stringify } from 'querystring'

const qs = require('querystring')

const BASE_URL = 'https://ib.psbank.ru/'
const DEFAULT_HEADERS = {
  Host: 'ib.psbank.ru',
  Connection: 'Keep-Alive',
  'Accept-Encoding': 'gzip',
  'User-Agent': 'okhttp/3.12.3'
}
const DEFAULT_TOKEN_HEADERS = {
  Platform: 'Android',
  OSVer: 'REL 5.0 21',
  AppVer: '3.20.1.159.a',
  Device: 'samsung SM-N900'
}
const DEFAUL_TOKEN_PARAMETERS = {
  'timeZoneUTCOffset': '10800000ms',
  'appVersion': '3.20.1 (159)',
  'appPackage': 'logo.com.mbanking',
  'osName': 'Android universal5420',
  'pushAddress': '',
  'deviceSerialNumber': null, // переопределяется перед использованием
  'version': '2.8.0',
  'osVersion': '5.0',
  'deviceUid': null, // переопределяется перед использованием
  'deviceModel': 'ZenMoney',
  'deviceAddress': null, // переопределяется перед использованием
  'deviceName': 'dpi',
  'alg': 'HS256'
}

export async function login (preferences, auth) {
  console.log('>>> Пытаемся войти...')

  if (!auth.deviceId || !auth.mobileDeviceInfo || !auth.securityCodeHash) {
    // ===== ПЕРВЫЙ ВХОД ПО ПАРОЛЮ =====
    auth.deviceId = generateRandomString(16, '0123456789abcdef')
    auth.mobileDeviceInfo = getMobileDeviceInfo({
      TimeStamp: (new Date()).toISOString(),
      HardwareId: generateRandomString(15, '0123456789'),
      SimId: generateRandomString(15, '0123456789'),
      AdvertiserId: generateUUID(),
      WiFiMacAddress: generateMacAddress(),
      DeviceModel: 'SM-N900',
      DeviceName: 'Дзен-мани',
      RsaApplicationKey: generateRandomString(32, '0123456789ABCDEF'),
      OsId: auth.deviceId
    })

    // проходим авторизацию
    const phone = getPhoneNumber(preferences.login)
    let response = await fetchApiJson({}, 'api/authentication/token', {
      method: 'POST',
      stringify,
      headers: {
        ...DEFAULT_TOKEN_HEADERS,
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
      },
      body: {
        DeviceId: auth.deviceId,
        loginType: phone ? 'Phone' : 'Login',
        networkType: 'wifi',
        clientChannel: 'MobileAppNew',
        clientIdentifier: phone || preferences.login,
        MobileDeviceInfo: encodeURI(JSON.stringify(auth.mobileDeviceInfo)),
        grant_type: 'passwordless'
      },
      sanitizeRequestLog: { body: { DeviceId: true, clientIdentifier: true, MobileDeviceInfo: true } },
      sanitizeResponseLog: { body: { access_token: true } }
    })
    auth.accessToken = response.body.access_token

    // двухфакторная авторизация
    if (response.body.isSecondStepAuthRequired) {
      // получаем информацию по возможным подтверждением авторизации (SMS, PUSH)
      response = await fetchApiJson(auth, 'api/authentication/secondStepAuthRequest', {
        method: 'GET',
        stringify,
        headers: {
          token: getToken({
            deviceSerialNumber: generateRandomString(16),
            deviceUid: generateRandomString(16),
            deviceAddress: generateRandomString(34, '1234567890abcdefghijklmnopqrstuvwxyz')
          })
        },
        sanitizeRequestLog: { headers: { token: true } },
        sanitizeResponseLog: { body: { smsdata: { phoneNumber: true } } }
      })

      // запрос кода из СМС/пуш
      let codeType
      if (response.body.smsStatus === 4) {
        codeType = 'СМС'
      } else if (response.body.pushStatus === 4) {
        codeType = 'PUSH'
      // } else if (response.body.otpStatus === 4) {
      } else {
        throw new Error('Не известный способ подтверждения нового устройства')
      }

      let code
      let message = `Введите код из ${codeType} для входа в личный кабинет ПСБ банка`
      for (let i = 0; i < 3; i++) {
        code = await ZenMoney.readLine(message, {
          time: 120000,
          inputType: 'number'
        })
        if (code) {
          if (code === 0) {
            throw new InvalidPreferencesError('Код для входа не введён')
          }

          // подтверждение кода
          response = await fetchApiJson(auth, 'api/authentication/doSecondStepAuth', {
            ignoreErrors: true,
            method: 'POST',
            stringify: JSON.stringify(),
            headers: {
              'Content-Type': 'application/json; charset=UTF-8'
            },
            body: {
              'authorizerType': codeType === 'СМС' ? '2' : '11', // 2 - СМС, 11 - PUSH
              'value': code
            },
            sanitizeRequestLog: { body: { value: true } }
          })

          const errMessage = response.body && (response.body.message || response.body.exceptionMessage)
          message = `Ответ банка: ${errMessage}. Попытка #${i + 2}`
          if (response.status === 400) {
            if (/(повторить|блокир)/.test(errMessage)) {
              // Превышен лимит попыток авторизации в системе, дальнейшие попытки на некоторое время заблокированы
              // Код подтверждения устарел, необходимо повторить отправку
              throw new InvalidPreferencesError('Ответ банка: ' + errMessage)
            }
            continue
          } else if (response.status !== 200) {
            // не известная пока ошибка авторизации
            throw new Error(response.statusText + (errMessage ? ': ' + errMessage : ''))
          }
          break
        }

        message = `Код для входа не был введён. Попытка #${i + 2}`
      }
      if (!code) {
        throw new InvalidPreferencesError('Код для входа не был введён. Подключение к банку остановлено.')
      }
    }

    // установка пин-кода для быстрого входа
    response = await fetchApiJson(auth, 'api/authentication/device/setSecurityCode', {
      sanitizeResponseLog: { body: { clientIdentifier: true, deviceSecurityCode: true } }
    })
    auth.clientIdentifier = response.body.clientIdentifier
    const deviceSecurityCode = response.body.deviceSecurityCode

    response = await fetchApiJson(auth, 'api/authentication/device/confirmSecurityCode', {
      sanitizeResponseLog: { body: { securityCodeSalt: true } }
    })

    // сохраним хэш для последующего входа по пин-коду
    const securityCode = forge.util.decode64(deviceSecurityCode)
    const securityCodeSalt = forge.util.decode64(response.body.securityCodeSalt)
    auth.securityCodeHash = forge.util.encode64(forge.pkcs5.pbkdf2(securityCode, securityCodeSalt, 10000, 32))

    ZenMoney.setData('auth', auth)
  } else {
    // ===== ВХОД ПО ПИН-КОДУ =====

    let response = await fetchApiJson({}, 'api/authentication/beforeLogin', {
      method: 'GET',
      body: {
        login: auth.clientIdentifier,
        deviceId: auth.deviceId,
        loginType: 1
      }
    })
    const requestId = response.body.requestId
    const sessionSalt = forge.util.decode64(response.body.sessionSalt)
    const shortCode = forge.util.encode64(forge.pkcs5.pbkdf2(forge.util.decode64(auth.securityCodeHash), sessionSalt, 10000, 32))

    const mobileDeviceInfo = {
      ...auth.mobileDeviceInfo,
      TIMESTAMP: (new Date()).toISOString()
    }

    response = await fetchApiJson({}, 'api/authentication/token', {
      method: 'POST',
      stringify,
      headers: {
        ...DEFAULT_TOKEN_HEADERS,
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
      },
      body: {
        DeviceId: auth.deviceId,
        networkType: 'wifi',
        requestId: requestId,
        clientChannel: 'MobileAppNew',
        version: '2.0.0.0',
        shortCode: shortCode,
        clientIdentifier: auth.clientIdentifier,
        MobileDeviceInfo: encodeURI(JSON.stringify(mobileDeviceInfo)),
        grant_type: 'shortCode'
      },
      sanitizeRequestLog: { body: { MobileDeviceInfo: true } }
    })

    if (response.body.token_type !== 'bearer') {
      throw new Error('Не поддерживаемй способ авторизации')
    }

    auth.accessToken = response.body.access_token
  }

  // проверим результат авторизации
  const response = await fetchApiJson(auth, 'api/authentication/loginResult', {
    method: 'GET',
    stringify: JSON.stringify(),
    body: {
      'avatarHash': null
    },
    sanitizeResponseLog: { body: { clientProfile: true } }
  })
  if (!response.body.clientProfile) {
    throw new Error('Не удалось завершить авторизацию')
  }

  return auth
}

export async function fetchCards (auth) {
  const response = await fetchApiJson(auth, 'api/cards/data', {
    method: 'GET',
    body: {
      activeOnly: true
    }
  })
  return response.body.cardAccounts
}

export async function fetchAccounts (auth) {
  const response = await fetchApiJson(auth, 'api/accounts', {
    method: 'GET',
    body: {
      activeOnly: true
    }
  })
  return response.body
}

export async function fetchLoans (auth) {
  const response = await fetchApiJson(auth, 'api/loans', {
    method: 'GET',
    body: {
      activeOnly: true
    }
  })
  return Promise.all(response.body.loans.map(async loan => {
    const detailsResponse = await fetchApiJson(auth, `api/loans/${loan.contractId}`, {
      method: 'GET',
      body: {
        activeOnly: true
      }
    })
    return detailsResponse.body
  }))
}

export async function fetchTransactions (auth, { id, type }, fromDate, toDate) {
  let key = 'transactions'
  let url
  let params
  switch (type) {
    case 'account':
      url = `api/accounts/${id}/statement`
      params = {
        StartDate: fromDate.toISOString(),
        EndDate: toDate.toISOString(),
        Income: true,
        Outcome: true,
        ProcessedOnly: false,
        SortDirection: 2,
        PageSize: 1000,
        PageNumber: 1
      }
      break
    case 'card':
      url = `api/cards/accounts/${id}/statement`
      params = {
        StartDate: fromDate.toISOString(),
        EndDate: toDate.toISOString(),
        Income: true,
        Outcome: true,
        ProcessedOnly: false,
        SortDirection: 2,
        PageSize: 1000,
        PageNumber: 1
      }
      break
    case 'loan':
      key = 'items'
      url = 'api/operations/requests/history'
      params = {
        ContractId: id,
        StartDate: fromDate.toISOString(),
        EndDate: toDate.toISOString(),
        Income: true,
        Outcome: true,
        ProcessedOnly: false,
        SortDirection: 2,
        PageSize: 1000,
        PageNumber: 1
      }
      break
    default:
      console.assert(false, 'unsupported account type', type)
      break
  }
  const response = await fetchApiJson(auth, url,
    {
      method: 'GET',
      body: params
    },
    response => get(response, `body.${key}`)
  )
  return response.body[key]
}

function getUrl (url) {
  if (url.substr(0, 4) !== 'http') {
    url = BASE_URL + url
  }
  return url
}

async function fetchApiJson (auth, url, options = {}, predicate = null) {
  url = getUrl(url)
  let getParams = ''
  if (options.method === 'GET' && options.body) {
    getParams = '?' + qs.stringify(options.body)
    delete options.body
  }

  const headers = {
    ...DEFAULT_HEADERS,
    ...(auth && auth.accessToken ? { Authorization: 'Bearer ' + auth.accessToken } : null),
    ...options.headers
  }
  const sanitizeRequestLog = {
    ...options.sanitizeRequestLog,
    headers: {
      Authorization: true,
      ...(options.sanitizeRequestLog && options.sanitizeRequestLog.headers)
    }
  }

  let response
  try {
    response = await fetchJson(url + getParams, {
      ...options,
      method: options.method || 'POST',
      stringify: options.stringify || JSON.stringify,
      parse: JSON.parse,
      headers: headers,
      sanitizeRequestLog: sanitizeRequestLog
    })
  } catch (e) {
    if (e.response && e.response.status >= 500 && e.response.status < 525) {
      throw new TemporaryError('Информация из Промсвязьбанка временно недоступна. Повторите синхронизацию через некоторое время.')
    } else {
      throw e
    }
  }
  if (predicate) { validateResponse(response, response => response.body && predicate(response)) }
  if (options && !options.ignoreErrors) {
    if (response.status !== 200) {
      if (!response.body) {
        throw new Error()
      }
      const message = response.body.message || response.body.exceptionMessage || response.body.error_description || response.body.redirect || ''
      const temp = (response.body.error &&
        [
          'use_login_and_password', // error_description: 'Чтобы открыть доступ к мобильному и интернет банку обратитесь в офис или настройте его в банкомате'
          'invalid_grant' // error_description: 'Ошибка при аутентификации по короткому коду'
        ].indexOf(response.body.error) >= 0
      ) ||
      (response.body.errorType &&
          [
            1000, // exceptionMessage: 'Выписка по карте временно недоступна'
            2796 // exceptionMessage: 'Вход в систему невозможен для данного канала доступа',
          ].indexOf(response.body.error) >= 0
      )

      if (temp) {
        throw new TemporaryError(message)
      } else {
        throw new Error((response.body.error ? `[${response.body.error}] ` : '') + message)
      }
    }
  }
  return response
}

function validateResponse (response, predicate, message) {
  console.assert(!predicate || predicate(response), message || 'non-successful response')
}

function getMobileDeviceInfo ({ TimeStamp, HardwareId, SimId, AdvertiserId, DeviceModel, DeviceName, WiFiMacAddress, ApplicationKey: RsaApplicationKey, OsId }) {
  return {
    'TIMESTAMP': TimeStamp, // '2019-08-23T10:48:13Z',
    'HardwareID': HardwareId,
    'SIM_ID': SimId,
    'AdvertiserId': AdvertiserId,
    'GeoLocationInfo': [
      {
        'Timestamp': '0',
        'Status': '1'
      }
    ],
    'DeviceModel': DeviceModel,
    'MultitaskingSupported': true,
    'DeviceName': DeviceName,
    'DeviceSystemName': 'Android',
    'DeviceSystemVersion': '21',
    'Languages': 'ru',
    'WiFiMacAddress': WiFiMacAddress,
    'WiFiNetworksData': {
      'BBSID': 'a4:50:46:68:5d:41',
      'SignalStrength': '-27',
      'SSID': 'WiFi'
    },
    'CellTowerId': '6457811',
    'LocationAreaCode': '20306',
    'ScreenSize': '1080x1920',
    'RSA_ApplicationKey': RsaApplicationKey,
    'MCC': '250',
    'MNC': '20',
    'OS_ID': OsId,
    'SDK_VERSION': '3.11.0',
    'Compromised': 1,
    'Emulator': 0
  }
}

function getToken ({ deviceSerialNumber, deviceUid, deviceAddress }) {
  return forge.util.encode64(JSON.stringify(
    {
      ...DEFAUL_TOKEN_PARAMETERS,
      'deviceSerialNumber': deviceSerialNumber,
      'deviceUid': deviceUid,
      'deviceAddress': deviceAddress
    }
  ))
}

function getPhoneNumber (str) {
  const number = /^(?:\+?7|8|)(\d{10})$/.exec(str.trim())
  if (number) return '+7' + number[1]
  return null
}
