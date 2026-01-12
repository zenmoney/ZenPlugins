import { fetch } from '../../common/network'
import { assign, filter, defaultsDeep } from 'lodash'
import { generateRandomString, generateUUID, randomInt } from '../../common/utils'
import { InvalidPreferencesError, InvalidOtpCodeError } from '../../errors'
import protoModel from './model'

function generateDevice () {
  return {
    androidId: generateRandomString(16, '0123456789abcdef'),
    gsfId: generateRandomString(16, '0123456789abcdef'),
    installId: generateUUID(),
    totalRAM: randomInt(1_000_000_000, 4_000_000_000).toString()
  }
}

export async function apiFetch (url, options) {
  let body = options.body ? options.requestEntity ? options.requestEntity.encode(options.body).finish() : options.body : null
  // Ensure body is a Uint8Array if it comes from protobuf encoding
  // Some protobuf implementations return an object with .bytes property instead of Uint8Array directly
  if (body && options.requestEntity) {
    // If finish() returns an object with .bytes property, extract it
    if (body && typeof body === 'object' && 'bytes' in body && !(body instanceof Uint8Array)) {
      const bytes = body.bytes
      // Handle Promise case (await if needed) or extract the actual bytes
      body = bytes instanceof Promise ? await bytes : (bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))
    } else if (body && !(body instanceof Uint8Array)) {
      // Ensure it's a Uint8Array even if finish() returned something else
      body = new Uint8Array(body)
    }
  }
  const headers = {
    'Accept-Language': 'en',
    'User-Agent': `Dalvik/2.1.0 (Linux; U; Android 10; ${ZenMoney.device.model} Build/${ZenMoney.device.id})`,
    'X-APP-VERSION': '276',
    'X-CONTACTS-COUNT': '0',
    'X-DEVICE': ZenMoney.device.model,
    'X-DEVICE-ACCOUNTS': '[]',
    'X-DEVICE-LOCALE': 'en_US',
    'X-DEVICE-MEMORY': options.auth.device.totalRAM,
    'X-ICCID': ' ',
    'X-IMEI': options.auth.device.androidId, // android_id
    'X-INSTALLATION-VERSION': options.auth.device.installId,
    'X-IS-ROOTED': 'false',
    'X-PLATFORM': 'Android',
    'X-PLATFORM-ID': options.auth.device.gsfId, // gsf android_id
    'X-PLATFORM-VERSION': '10',
    'X-WIFI-SSID': '<unknown ssid>'
  }
  if (options.auth.token) {
    headers.Authorization = 'Bearer ' + options.auth.token
  }
  return fetch('https://pay.maib.md' + url, {
    ...options,
    method: options.method || 'GET',
    headers: {
      ...headers,
      ...options.headers
    },
    body: options.body,
    binaryResponse: true,
    stringify: () => body,
    parse: function (body) {
      if (body && options.responseEntity) {
        body = options.responseEntity.decode(new Uint8Array(body))
      }
      return body
    },
    sanitizeRequestLog: defaultsDeep({ headers: { Authorization: true } }, options.sanitizeRequestLog)
  })
}

async function getToken (auth) {
  const response = await apiFetch('/MAIBankService/token', {
    responseEntity: protoModel.md.maib.app.token.TokenResponse,
    sanitizeResponseLog: { body: { token: true } },
    auth
  })
  console.assert(response.body.token, 'cant get token', response)
  return response.body.token
}

async function loginInit (accountNumber, pin, auth) {
  const response = await apiFetch('/MAIBankService/login/init', {
    method: 'POST',
    body: assign(new protoModel.md.maib.app.login.LoginInitRequest(), {
      pan: accountNumber,
      pin5: pin
    }),
    requestEntity: protoModel.md.maib.app.login.LoginInitRequest,
    responseEntity: protoModel.md.maib.app.login.LoginInitResponse,
    sanitizeRequestLog: { body: { pan: true, pin5: true } },
    auth
  })
  if (response.body.result !== 1) {
    throw new InvalidPreferencesError()
  }
}

async function loginConfirm (accountNumber, pin, auth) {
  const code = await ZenMoney.readLine('Введите код из SMS')
  const response = await apiFetch('/MAIBankService/login/confirm', {
    method: 'POST',
    body: assign(new protoModel.md.maib.app.login.LoginConfirmRequest(), {
      pan: accountNumber,
      pin5: pin,
      otp: code,
      otp_type: protoModel.md.maib.app.util.OtpType.MANUAL
    }),
    requestEntity: protoModel.md.maib.app.login.LoginConfirmRequest,
    responseEntity: protoModel.md.maib.app.login.LoginConfirmResponse,
    sanitizeRequestLog: { body: { pan: true, pin5: true, otp: true } },
    sanitizeResponseLog: { body: { token: true } },
    auth
  })
  if (response.body.result !== 1) {
    throw new InvalidOtpCodeError()
  }
  console.assert(response.body.token, 'cant get token', response)
  return response.body.token
}

async function initSession (accountNumber, pin, auth) {
  auth.token = await getToken(auth)
  await loginInit(accountNumber, pin, auth)
  auth.token = await loginConfirm(accountNumber, pin, auth)
}

async function restoreSession (auth) {
  const response = await apiFetch('/MAIBankService/lockscreen/attempts', {
    method: 'POST',
    body: assign(new protoModel.md.maib.app.lockscreen.LockscreenUnlockAttemptsRequest(), {
      unlock_attempts: assign(new protoModel.md.maib.app.lockscreen.UnlockAttempt(), {
        date: (new Date()).getTime(),
        successful: true,
        lockscreen_type: protoModel.md.maib.app.lockscreen.LockscreenType.PIN5
      })
    }),
    requestEntity: protoModel.md.maib.app.lockscreen.LockscreenUnlockAttemptsRequest,
    auth
  })
  return response.status === 200
}

export async function login ({ accountNumber, pin }, auth) {
  if (auth && auth.token && auth.device && await restoreSession(auth)) {
    return
  }
  auth = { device: generateDevice() }
  await initSession(accountNumber, pin, auth)
  return auth
}

export async function fetchAccounts (auth) {
  const accounts = {
    cards: [],
    accounts: [],
    creditAccounts: [],
    depositAccounts: [],
    cardCreditAccounts: []
  }
  const response = await apiFetch('/MAIBankService/profile?forceAccounts=false&noAccounts=false', {
    responseEntity: protoModel.md.maib.app.profile.Profile,
    sanitizeResponseLog: { body: { personalInfo: true, settings: true } },
    auth
  })
  console.assert(response.body.creditCard.length === 0, 'Got more data, than expected')
  accounts.cards.push(...response.body.card)
  accounts.accounts.push(...response.body.account)
  accounts.creditAccounts.push(...response.body.creditAccount)
  accounts.depositAccounts.push(...response.body.depositAccount)
  accounts.cardCreditAccounts.push(...response.body.cardCreditAccount)
  return accounts
}

export async function fetchTransactions (auth, fromDate, toDate) {
  const transactions = []
  let fromId = null
  let count = 0
  do {
    count += 50
    const url = fromId ? `/MAIBankService/tx/history?from=${fromId}&count=50` : '/MAIBankService/tx/history?count=50'
    const response = await apiFetch(url, {
      responseEntity: protoModel.md.maib.app.tx.TxResponse,
      auth
    })
    transactions.push(...response.body.transactions)
    fromId = response.body.transactions.slice(-1)[0].id
  } while (transactions.slice(-1)[0].date >= fromDate.getTime() - 86400000 && transactions.length === count)
  return filter(transactions, transaction => transaction.date >= fromDate.getTime())
}
