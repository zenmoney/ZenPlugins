import { Constants } from './constants'
import { DeviceInfoService } from '../utilities/deviceInfoService'
import { fetchJson } from '../../../common/network'
import { ApiType } from './apiType'

const qs = require('querystring')

export async function makeRequest (apiType, method, url, options, predicate) {
  switch (apiType) {
    case ApiType.BANK:
      url = Constants.bankBaseUrl + '/' + url
      break

    case ApiType.INVESTING:
      url = Constants.investingBaseUrl + '/' + url
      break
  }

  const params = {
    ...Constants.defaultGetParameters,
    ...options.get
  }

  const deviceInfoService = new DeviceInfoService()
  const deviceId = deviceInfoService.deviceId
  if (deviceId) {
    params.deviceId = deviceId
  }

  if (options.authSession) {
    switch (apiType) {
      case ApiType.BANK:
        params.sessionid = options.authSession.sessionId
        break

      case ApiType.INVESTING:
        params.sessionId = options.authSession.sessionId
        break
    }
  }

  if (options.body) {
    if (!options.headers) {
      options.headers = {}
    }

    switch (options.bodyType) {
      case 'json':
        options.headers['Content-Type'] = 'application/json; charset=utf-8;'
        options.body = JSON.stringify(options.body)
        break

      case 'form-urlencoded':
      default:
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8;'
        options.body = qs.stringify(options.body)
        break
    }
  }

  let response
  try {
    response = await fetchJson(url + '?' + qs.stringify(params), {
      method: method,
      stringify: null,
      ...options
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
    const errorMessage = response.body.plainMessage || response.body.errorMessage
    if ([
      'INTERNAL_ERROR',
      'CONFIRMATION_FAILED',
      'INVALID_REQUEST_DATA',
      'REQUEST_RATE_LIMIT_EXCEEDED'
    ].indexOf(response.body.resultCode) + 1) {
      if (errorMessage.indexOf('неверный номер телефона') > 0) {
        throw new TemporaryError('Вход по номеру телефона временно не работает. Пожалуйста, создайте подключение к банку при помощи логина. Если логина ещё нет, его можно получить в приложении банка.')
      }
      throw new TemporaryError('Ответ банка: ' + errorMessage)
    } else if (response.body.resultCode !== 'OK' && response.body.status !== 'Ok') {
      throw new Error(errorMessage)
    }
  }

  return response
}

function validateResponse (response, predicate, message) {
  console.assert(!predicate || predicate(response), message || 'non-successful response')
}
