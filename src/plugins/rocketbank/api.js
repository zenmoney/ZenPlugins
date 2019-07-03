import { formatCommentDateTime } from '../../common/dateUtils'
import { fetchJson } from '../../common/network'
import { MD5 } from 'jshashes'
import _ from 'lodash'

const md5 = new MD5()
const qs = require('querystring')

const baseUrl = 'https://rocketbank.ru/api/v5'
const maxIteration = 3

export async function fetchProfile (auth, preferences) {
  console.log('>>> Загружаем профиль пользователя...')

  if (!auth.phone) {
    auth.phone = preferences.phone
  }
  if (!auth.phone) {
    for (let i = 0; i < 3; i++) {
      const phone = getPhoneNumber(await ZenMoney.readLine('Введите номер телефона для входа в Рокетбанк. Формат: +79211234567', { inputType: 'text', time: 18E4 }))
      if (phone) {
        auth.phone = phone
        break
      }
    }
  }
  if (!auth.phone) {
    throw new InvalidPreferencesError('Не указан номер телефона для входа')
  }
  if (!auth.password) {
    auth.password = preferences.password
  }
  if (!auth.password) {
    for (let i = 0; i < 3; i++) {
      const password = Number(await ZenMoney.readLine('Введите пароль (пин-код) для входа в Рокетбанк', { inputType: 'numberPassword', time: 18E4 }))
      if (password > 0) {
        auth.password = password
        break
      }
    }
  }
  if (!auth.password) {
    throw new InvalidPreferencesError('Не указан пароль (пин-код) для входа')
  }

  auth.deviceId = await getDevice(auth)
  if (!auth.token) {
    auth.token = await getToken(auth)
  }

  const profile = await requestProfile(auth)
  if (!profile.hasOwnProperty('user')) {
    throw new Error('Не удалось загрузить список аккаунтов')
  }

  return {
    auth,
    profile
  }
}

const sanitizeUserResponse = {
  accounts: {
    name_in_latin: true,
    plastic_token: true,
    account_details: { owner: true },
    change_pin: { check_card: { name: true } }
  },
  account_details: {
    owner: true
  },
  username: true,
  first_name: true,
  second_name: true,
  last_name: true,
  name_in_latin: true,
  change_codeword: { check_card: { name: true } },
  change_mobile_phone: { check_card: { name: true } },
  change_short_code: { check_card: { name: true } },
  change_pin: { check_card: { name: true } },
  email: true,
  phone: true,
  phone_number: true,
  owner: true,
  pusher_token: true,
  login_token: true,
  plastic_token: true,
  siri_token: true,
  watch_token: true,
  widget_token: true,
  jwt: true,
  transfers: { first_name: true, last_name: true },
  safe_accounts: { account_details: { owner: true } }
}

function getHeaders (deviceId, token) {
  const date = Math.floor(Date.now() / 1000)
  const headers = {
    'X-Device-ID': deviceId,
    'X-Time': date.toString(),
    'X-Sig': md5.hex('0Jk211uvxyyYAFcSSsBK3+etfkDPKMz6asDqrzr+f7c=_' + date + '_dossantos'),
    'Content-Type': 'application/json'
    /* 'x-app-version': '3.13.8',
    'x-device-id': deviceId,
    'x-device-os': 'Android 5.0',
    'x-device-type': 'zenmoney',
    'x-sig': md5.hex('0Jk211uvxyyYAFcSSsBK3+etfkDPKMz6asDqrzr+f7c=_' + date + '_dossantos'),
    'x-time': date.toString(),
    'Content-Type': 'application/json',
    'Host': 'rocketbank.ru' */
  }
  if (token) {
    headers['Authorization'] = 'Token token=' + token
    // headers['x-device-token'] = token
  }
  return headers
}

async function requestProfile (auth, iteration = 0) {
  const response = await fetchApiJson('/profile', {
    ignoreErrors: true,
    method: 'GET',
    headers: getHeaders(auth.deviceId, auth.token),
    sanitizeResponseLog: {
      body: {
        user: sanitizeUserResponse
      }
    }
  })
  // request('GET', '/profile', null, device, token)

  if (response.status === 401) {
    if (iteration > maxIteration) {
      throw new Error('Не удалось получить ответ от банка. Пожалуйста, попробуйте повторить позднее')
    }
    auth.token = await getToken(auth, true) // пробуем получить новый токен
    const result = await requestProfile(auth, iteration++)
    return result
  }

  if (response.status !== 200) {
    throw new Error('Не удалось загрузить профиль пользователя: ' + response.description)
  }

  return response.body
}

async function getDevice (auth) {
  if (!auth.deviceId) {
    console.log('>>> Необходимо привязать устройство...')
    auth = await registerDevice(auth)
    console.log('>>> Устройство привязано')
  }
  return auth.deviceId
}

async function registerDevice (auth) {
  const deviceId = 'zenmoney_' + md5.hex(Math.random().toString() + '_' + auth.phone + '_' + Date.now())
  console.log(`>>> Отправляем запрос на регистрацию устройства...`)

  const response = await fetchApiJson('/devices/register',
    {
      method: 'POST',
      headers: getHeaders(deviceId, null),
      sanitizeRequestLog: { body: { phone: true } },
      sanitizeResponseLog: { body: { token: true, user: sanitizeUserResponse } },
      body: {
        phone: auth.phone
      }
    },
    response => _.get(response, 'body.sms_verification.id')
  )

  auth = await verifyDevice(auth, response.body.sms_verification.id, deviceId)
  console.log('>>> Устройство зарегистрировано.')
  return auth
}

async function verifyDevice (auth, verificationToken, deviceId) {
  let title = 'Введите код подтверждения из SMS для входа в Рокетбанк'

  const code = await ZenMoney.readLine(title, { inputType: 'numberDecimal', time: 120000 })
  if (code === '') {
    throw new InvalidPreferencesError('Не был введён код авторизации устройства')
  }

  console.log('>>> Получили код подтверждения из СМС.')
  const response = await fetchApiJson(`/sms_verifications/${verificationToken}/verify`, {
    // ignoreErrors: true,
    method: 'PATCH',
    headers: getHeaders(deviceId, null),
    sanitizeRequestLog: { body: { code: true } },
    sanitizeResponseLog: {
      body: {
        token: true,
        pusher_token: true,
        user: sanitizeUserResponse,
        form: sanitizeUserResponse
      }
    },
    body: {
      id: verificationToken,
      code: code
    }
  })
  // response => _.get(response, 'body.user.email'))

  const token = _.get(response, 'body.token')
  if (token) {
    auth.token = token
  }

  const email = _.get(response, 'body.user.email')
  if (!token && !email) {
    throw new Error('Не удалось обнаружить необходимый email в ответе банка')
  }

  auth.deviceId = deviceId
  auth.email = email
  return auth
}

async function getToken (auth, forceNew = false) {
  forceNew = forceNew || false
  if (!auth.token || forceNew) {
    console.log('>>> Требуется создать новый токен...')
    const response = await fetchApiJson('/login',
      {
        ignoreErrors: true,
        method: 'GET',
        headers: getHeaders(auth.deviceId, null),
        body: {
          email: auth.email,
          password: auth.password
        },
        sanitizeRequestLog: { url: true },
        sanitizeResponseLog: { url: true, body: { token: true, user: sanitizeUserResponse } }
      }
      // response => _.get(response, 'body.token')
    )

    if (response.status === 401) {
      const description = _.get(response, 'body.response.description') || response.description
      if (description) {
        throw new InvalidPreferencesError(description)
      } else {
        throw new Error('Ошибка входа')
      }
    }

    if (!response.body.token) {
      throw new Error('Токен для входа не обнаружен')
    }

    auth.token = response.body.token
  }
  return auth.token
}

export async function fetchTransactions (auth, accountId, fromDate, page = 1, iteration = 0) {
  console.log(`>>> Запрашиваем список операций по счёту '${accountId}'...`)

  let apiTransactions = []
  for (let page = 1; page <= 50; page++) { // естественный ограничитель от безконтрольной загрузки всех данных
    const response = await fetchApiJson(`/accounts/${accountId}/feed`, {
      ignoreErrors: true,
      method: 'GET',
      headers: getHeaders(auth.deviceId, auth.token),
      body: {
        page: page,
        per_page: 10
      }
    })
    // request('GET', '/accounts/' + account + '/feed?page=' + page + '&per_page=' + limit, null, device, token)

    if (response.status === 401) {
      if (iteration > maxIteration) {
        throw new Error('Не удалось получить ответ от банка. Пожалуйста, попробуйте повторить позднее')
      }
      auth.token = await getToken(auth, true) // пробуем получить новый токен
      const result = await fetchTransactions(auth, accountId, fromDate, page, iteration++)
      return result
    }

    let feedPage = []
    if (response.body.feed) {
      feedPage = response.body.feed.filter(apiTransaction => {
        // встречаются операции с типом ключа как 'operation' так и 'rocketruble_operation'
        return /* apiTransaction[0] === 'operation' && */ apiTransaction[1].happened_at > fromDate.getTime() / 1000
      })

      if (feedPage.length > 0) {
        apiTransactions = apiTransactions.concat(feedPage.map(item => item[1]))
        logPageInfo(response.body.feed, response.body.pagination)
        if (feedPage.length !== response.body.feed.length) {
          break
        }
      } else {
        break
      }
    } else {
      throw new Error(`Операции не найдены (всего операций ${response.body.pagination.total_count})`)
    }
  }

  return apiTransactions
}

function logPageInfo (feed, pagination) {
  let logStr = '>>> Загрузили страницу'
  if (pagination.current_page > 1) {
    logStr += ` №${pagination.current_page}`
  }
  const len = feed.length
  if (len > 0) {
    logStr += ` (${formatCommentDateTime(new Date(feed[0][1].happened_at * 1000))} – ${formatCommentDateTime(new Date(feed[len - 1][1].happened_at * 1000))})`
  }
  console.log(logStr)
}

async function fetchApiJson (url, options, predicate) {
  let getParams = ''
  const fetchOptions = {
    method: options.method || 'GET',
    sanitizeRequestLog: _.merge(options.sanitizeRequestLog, { headers: { 'Authorization': true, 'X-Device-ID': true, 'X-Sig': true } }),
    ..._.omit(options, ['body', 'method', 'ignoreErrors'])
  }
  if (options.body) {
    if (options.method !== 'GET') {
      if (options.body) {
        fetchOptions.body = options.body
      }
    } else {
      getParams = '?' + qs.stringify(options.body)
    }
  }

  let response
  try {
    response = await fetchJson(baseUrl + url + getParams, fetchOptions)
  } catch (e) {
    if (e.response && e.response.status >= 500 && e.response.status < 525) {
      throw new TemporaryError(`Информация из Рокетбанка временно недоступна. Повторите синхронизацию через некоторое время.

Если ошибка #${e.response.status} будет повторяться несколько дней, откройте Настройки синхронизации и нажмите "Отправить лог синхронизации разработчикам".`)
    } else if (!options.ignoreErrors) {
      throw new Error(`Ошибка #${e.response.status}: ${e.response.description}`)
    } else {
      throw new Error()
      // return response
    }
  }

  if (response.status !== 200) {
    const description = _.get(response, 'body.response.description') || ''
    switch (response.status) {
      case 401: // устаревший токен
        if (!options.ignoreErrors) {
          throw new Error(description)
        }
        break

      case 404: // ресурс не найден
        throw new Error(description)

      case 400: // необходим номер телефона
        throw new InvalidPreferencesError('Ответ банка: ' + description)

      case 406: // неверный код подтверждения
        if (!options.ignoreErrors) {
          throw new TemporaryError('Ответ банка: ' + description)
        }
        break
    }
  }

  if (predicate) {
    console.assert(!predicate || predicate(response), `Некорректный ответ запроса по адресу '${url}'`)
  }

  return response
}

/* function depersonalize (original, percent) {
  percent = percent || 0.3
  const length = Math.floor(original.length * percent)
  let part = original.slice(0, length * -1)
  for (let i = 0; i < length; i++) {
    part += '*'
  }
  return part
} */

function getPhoneNumber (str) {
  if (typeof str !== 'string' && typeof str !== 'number') {
    return null
  }
  const number = /^(?:\+?7|8|)(\d{10})$/.exec(str.toString().trim())
  if (number) return '+7' + number[1]
  return null
}
