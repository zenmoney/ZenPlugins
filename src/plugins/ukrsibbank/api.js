import * as _ from 'lodash'
import { fetch } from '../../common/network'
import { parseResponseBody, stringifyRequestBody, Type } from '../../common/protocols/burlap'
import { generateRandomString, generateUUID, randomInt } from '../../common/utils'
import { BankMessageError, InvalidOtpCodeError, PasswordExpiredError, PreviousSessionNotClosedError, TemporaryUnavailableError } from '../../errors'

const PROTOCOL_VERSION = '0.5.0'
const APP_VERSION = '1.213.1'
const ENDPOINT = 'https://online.ukrsibbank.com/clientendpoint/burlap'

export function generateDevice () {
  return {
    id: 'v1',
    androidId: randomInt(0, Math.pow(2, 64) - 1).toString(16),
    manufacturer: 'Zenmoney',
    model: 'Zenmoney Phone',
    uuid: generateRandomString(32, '0123456789abcdef'),
    legacyId: generateRandomString(16, '0123456789abcdef'),
    fingerprint: generateUUID(),
    imsi: generateRandomString(15, '0123456789'),
    imei: generateRandomString(15, '0123456789')
  }
}

export function getIdGenerator (device) {
  let i = 0
  return () => device.androidId + '-' + i++
}

export async function burlapRequest (options) {
  const id = options.idGenerator()
  const device = options.device
  let payload = null
  let response
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'mb-protocol-version': PROTOCOL_VERSION,
        'mb-app-version': APP_VERSION,
        'Content-Type': 'application/gzip; charset=utf-8',
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 6.0; Android SDK built for x86_64 Build/MASTER)',
        Host: 'online.ukrsibbank.com',
        Connection: 'Keep-Alive',
        'Accept-Encoding': 'gzip',
        'Cache-Control': 'no-cache'
      },
      body: options.body || null,
      sanitizeRequestLog: { headers: { cookie: true }, body: _.get(options, 'sanitizeRequestLog.body') },
      sanitizeResponseLog: { headers: { 'set-cookie': true }, body: _.get(options, 'sanitizeResponseLog.body') },
      stringify: (body) => stringifyRequestBody(PROTOCOL_VERSION, {
        __type: 'com.mobiletransport.messaging.MessageImpl',
        correlationId: null,
        id,
        theme: options.theme || 'none',
        timeToLive: 0,
        payload: body,
        properties: [
          { __type: 'com.mobiletransport.messaging.Property', name: 'LANGUAGE', value: 'EN' },
          { __type: 'com.mobiletransport.messaging.Property', name: 'DEVICE_ROOTED', value: true },
          { __type: 'com.mobiletransport.messaging.Property', name: 'CONNECTION_TYPE', value: 'WIFI' },
          { __type: 'com.mobiletransport.messaging.Property', name: 'DEVICE_IMEI', value: device.imei },
          { __type: 'com.mobiletransport.messaging.Property', name: 'DEVICE_LONGITUDE', value: 30.523487 },
          { __type: 'com.mobiletransport.messaging.Property', name: 'DEVICE_LATITUDE', value: 50.450412 },
          { __type: 'com.mobiletransport.messaging.Property', name: 'APP_VERSION', value: APP_VERSION },
          { __type: 'com.mobiletransport.messaging.Property', name: 'compress_response', value: 'false' },
          { __type: 'com.mobiletransport.messaging.Property', name: 'DEVICE_OS', value: 'Android v. 6.0' },
          { __type: 'com.mobiletransport.messaging.Property', name: 'DEVICE_MANUFACTURER', value: 'unknown' },
          { __type: 'com.mobiletransport.messaging.Property', name: 'DEVICE_IMSI', value: device.imsi },
          { __type: 'com.mobiletransport.messaging.Property', name: 'DEVICE_ID', value: device.uuid },
          { __type: 'com.mobiletransport.messaging.Property', name: 'LEGACY_DEVICE_ID', value: device.androidId },
          { __type: 'com.mobiletransport.messaging.Property', name: 'DEVICE_MODEL', value: 'Android SDK built for x86_64' },
          ...options.token
            ? [{ __type: 'com.mobiletransport.messaging.Property', name: 'CLIENT-TOKEN', value: options.token }]
            : []
        ]
      }),
      parse: (bodyStr) => {
        payload = parseResponseBody(PROTOCOL_VERSION, bodyStr, id).payload
        return payload
      }
    })
  } catch (e) {
    if (e.response && e.response.status === 503) {
      throw new TemporaryUnavailableError()
    } else {
      throw e
    }
  }
  response.body = payload
  if (response.body &&
    response.body.__type === 'com.mobiletransport.messaging.ErrorResponse' &&
    response.body.message) {
    if ([
      'операцию позже',
      'временно недоступна'
    ].some(str => response.body.message.indexOf(str) >= 0)) {
      throw new TemporaryUnavailableError()
    } else {
      throw new BankMessageError(response.body.message)
    }
  }
  const error = getError(response)
  if (error) {
    if ([
      'is working in System on this device now',
      'user with this phone number is already registered',
      'Пользователь с таким Логином сейчас работает в системе на этом же устройстве',
      'Пользователь с таким номером телефона уже зарегистрирован'
    ].some(str => error.message.indexOf(str) >= 0)) {
      throw new PreviousSessionNotClosedError()
    } else if ([
      'We are unable to process your request at this time. Please try again later',
      'Please log in in 15 minutes. Currently, entry is not possible due to an incomplete technical session'
    ].some(str => error.message.indexOf(str) >= 0)) {
      throw new TemporaryUnavailableError()
    }
  }
  return response
}

export async function logout (device, idGenerator) {
  return burlapRequest({
    idGenerator,
    device,
    body: {
      __type: 'com.ukrsibbank.client.protocol.authentication.LogoutRequest'
    }
  })
}

async function makeExecuteOperationRequest ({
  response,
  action,
  parameters,
  device,
  idGenerator
}) {
  return burlapRequest({
    idGenerator,
    device,
    body: {
      __type: 'com.ukrsibbank.client.protocol.operation.ExecuteOperationRequest',
      data: {
        __type: 'com.ukrsibbank.client.protocol.operation.OperationDataMto',
        executionId: response.body.meta.executionId,
        operationId: response.body.meta.operationId,
        stepId: response.body.meta.stepId,
        action: { __type: 'com.ukrsibbank.client.protocol.operation.ActionDataMto', id: action, parameterId: null },
        parameters: response.body.meta.parameters.map(parameter => {
          return {
            __type: 'com.ukrsibbank.client.protocol.operation.ParameterMto',
            id: parameter.id,
            value: parameters && parameter.id in parameters ? parameters[parameter.id] : parameter.value
          }
        })
      }
    },
    sanitizeRequestLog: { body: { data: { parameters: { value: true } }, meta: { parameters: { value: true } } } }
  })
}

function getPhoneNumber (str) {
  const match = /^(?:\+?380|)(\d{9})$/.exec(str.trim())
  if (match) {
    return '+380' + match[1]
  }
  throw new InvalidPreferencesError('Неверный номер телефона')
}

function getError (response) {
  const messages = _.get(response, 'body.meta.messages')
  return messages && messages.find(message => message.type && message.type.name === 'ERROR')
}

export async function login ({ login, password }, device, idGenerator) {
  login = getPhoneNumber(login)

  let response = await burlapRequest({
    idGenerator,
    device,
    body: {
      __type: 'com.ukrsibbank.client.protocol.operation.StartOperationRequest',
      operationId: 'logIn',
      parameters: [
        {
          __type: 'com.ukrsibbank.client.protocol.operation.ParameterMto',
          id: 'capabilities',
          value: {
            __type: 'com.ukrsibbank.client.protocol.authentication.AuthenticationCapabilitiesMto',
            capabilities: new Type.List([], 'com.ukrsibbank.client.protocol.authentication.AuthenticationCapabilityMto')
          }
        }
      ]
    },
    sanitizeResponseLog: { body: { meta: { parameters: { value: true } } } }
  })

  response = await makeExecuteOperationRequest({
    idGenerator,
    device,
    response,
    action: 'login',
    parameters: {
      phone: login,
      password
    }
  })

  const error = getError(response)
  if (error) {
    if ([
      'Login by phone number is disabled in the profile settings'
    ].some(str => error.message.indexOf(str) >= 0)) {
      throw new BankMessageError('Вход по номеру телефона выключен в настройках аккаунта.')
    }
    if (error.message.indexOf('the wrong password') >= 0) {
      throw new InvalidPreferencesError('Неверный номер телефона или пароль')
    }
  }

  while (true) {
    if (response.body.meta.parameters && response.body.meta.parameters.find(parameter =>
      parameter.id === 'isSignedIn' &&
      parameter.value === true)) {
      break
    } else if (response.body.meta.stepId === 'otp') {
      // response = await makeExecuteOperationRequest({
      //   idGenerator,
      //   device,
      //   response,
      //   action: 'resendPasswordWithSms'
      // })
      const code = await ZenMoney.readLine('Введите одноразовый пароль для входа в UKRSIB Online из SMS или push-уведомления', { inputType: 'number' })
      response = await makeExecuteOperationRequest({
        idGenerator,
        device,
        response,
        action: 'next',
        parameters: {
          otp: code
        }
      })
      const error = getError(response)
      if (error && [
        'Введен некорректный код подтверждения',
        'Entered an incorrect one-time password'
      ].some(str => error.message.indexOf(str) >= 0)) {
        throw new InvalidOtpCodeError()
      }
      if (response.body.meta.stepId === 'otp') {
        console.assert(false, 'unexpected login step')
      }
    } else if (response.body.meta.title === 'Check out identification data') {
      // throw new TemporaryError('В приложении банка для вас есть информационные сообщения. Их нужно прочесть и закрыть там, чтобы продолжить синхронизацию из Дзен-мани.')
      response = await makeExecuteOperationRequest({
        idGenerator,
        device,
        response,
        action: 'a1', // skip
        parameters: {}
      })
      if (response.body.meta.title === 'Check out identification data') {
        console.assert(false, 'unexpected skip info message step')
      }
    } else if (response.body.meta.stepId === 'enterNewPassword') {
      throw new PasswordExpiredError()
    } else {
      console.assert(false, 'unexpected login step')
    }
  }
}

export async function fetchAccounts (device, idGenerator) {
  const response = await burlapRequest({
    idGenerator,
    device,
    body: {
      __type: 'com.ukrsibbank.client.protocol.product.ProductsRequest'
    },
    sanitizeResponseLog: { body: { cards: { holderName: true } } }
  })
  return response.body
}

export async function fetchTransactions ({ id, category }, fromDate, toDate, device, idGenerator) {
  const transactions = []
  const limit = 25
  let offset = 0
  let response

  do {
    response = await burlapRequest({
      idGenerator,
      device,
      body: {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionsRequest',
        filter: null,
        maximalAmount: null,
        minimalAmount: null,
        status: null,
        categories: new Type.List([], 'string'),
        endDate: toDate,
        startDate: fromDate,
        page: {
          __type: 'com.ukrsibbank.client.protocol.paging.PageMto',
          count: new Type.Int(limit),
          offset: new Type.Int(offset)
        },
        productIdentity: {
          __type: 'com.ukrsibbank.client.protocol.product.ProductIdentityMto',
          id,
          category
        }
      }
    })
    transactions.push(...response.body.transactions)
    offset += response.body.transactions.length
  } while (response && response.body.transactions && response.body.transactions.length >= limit)

  return transactions
}
