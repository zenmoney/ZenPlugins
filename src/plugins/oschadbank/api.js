import { defaultsDeep } from 'lodash'
import { fetch, fetchJson, ParseError } from '../../common/network'
import { generateRandomString, generateUUID } from '../../common/utils'
import { TemporaryUnavailableError, UserInteractionError, InvalidOtpCodeError, InvalidLoginOrPasswordError, BankMessageError } from '../../errors'
import { OTPGenerator } from './OTPGenerator'
import { retry } from '../../common/retry'

function getCommonHeaders (device) {
  return {
    Host: 'online.oschadbank.ua',
    Connection: 'keep-alive',
    'OW-Client-Version': '1.50.3450',
    'X-Device-version': '8.0.0',
    Origin: 'file://',
    'Accept-Language': 'en',
    'OW-Client-Browser': 'Chrome',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 8.0.0; Android SDK built for x86 Build/OSR1.180418.004; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/80.0.3987.132 Mobile Safari/537.36',
    'Content-Type': 'application/json',
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'X-Device-uuid': device.uuid,
    'X-Device-connection': 'wifi',
    'X-Device-model': ZenMoney.device.model,
    'Sec-Fetch-Dest': 'empty',
    'X-Device-platform': 'Android',
    'X-Requested-With': 'ua.oschadbank.online',
    'Sec-Fetch-Site': 'cross-site',
    'Sec-Fetch-Mode': 'cors',
    'Accept-Encoding': 'gzip, deflate'
  }
}

async function apiFetchJson (url, options) {
  try {
    return await retry(
      {
        getter: async () => {
          const response = await fetchJson(url, {
            ...options,
            sanitizeRequestLog: defaultsDeep({ headers: { 'X-Device-uuid': true }, body: { user: { id: true, login: true, displayName: true, w4cClientId: true } } }, options && options.sanitizeRequestLog)
          })
          if (response.body?._error?.code?.match(/SERVER_TIMEOUT/i)) {
            return null
          }
          if (response.body?._error?.code?.match(/UNHANDLED_ERROR/i)) {
            throw new TemporaryUnavailableError()
          }
          return response
        },
        predicate: data => data,
        delayMs: 1000,
        maxAttempts: 3
      }
    )
  } catch (e) {
    if (e instanceof ParseError) {
      if ([
        /.*Service unavailable*/i,
        /.*HTTP Status 404*/i
      ].some(regex => regex.test(e.response.body))) {
        throw new TemporaryUnavailableError()
      }
      console.assert(false, 'Unknown error from server')
    }
    throw e
  }
}

async function getCurrentCookie (device) {
  const response = await fetch('https://online.oschadbank.ua/mobile/api/v2/conf/main.js', {
    method: 'GET',
    headers: {
      ...getCommonHeaders(device)
    },
    sanitizeRequestLog: { headers: { 'X-Device-uuid': true } }
  })
  return response
}

async function confirmSMSCode (basicBody, basicConfirmation, device) {
  const code = await ZenMoney.readLine('Введите код из SMS', { inputType: 'number' })
  const confirmation = {
    ...basicConfirmation,
    response: code
  }
  const response = await apiFetchJson('https://online.oschadbank.ua/mobile/api/v2/session', {
    method: 'POST',
    headers: {
      ...getCommonHeaders(device)
    },
    body: {
      ...basicBody,
      _status: null,
      confirmation
    },
    sanitizeRequestLog: { body: { login: true, password: true, confirmation: { response: true, devices: { id: true }, phones: { id: true } } } }
  })
  if (response.body._status && response.body._status === 'confirmationRequired') {
    throw new InvalidOtpCodeError()
  }
  console.assert(response.body.status && response.body.status === 'authenticated', 'Error, while creating session', response)
}

async function prepareConfirmSMSCode (basicBody, confirmation, device) {
  const nextConfirmation = confirmation
  nextConfirmation.smsTemplate = null
  return confirmSMSCode(basicBody, nextConfirmation, device)
}

async function confirmUserLogin (basicBody, basicConfirmation, device) {
  if (basicConfirmation.phones) {
    const confirmation = {
      ...basicConfirmation,
      authType: 'otp_sms',
      phoneId: basicConfirmation.phones[0].id
    }
    const response = await apiFetchJson('https://online.oschadbank.ua/mobile/api/v2/session', {
      method: 'POST',
      headers: {
        ...getCommonHeaders(device)
      },
      body: {
        ...basicBody,
        _status: null,
        confirmation
      },
      sanitizeRequestLog: { body: { login: true, password: true, confirmation: { phoneId: true, devices: { id: true }, phones: { id: true } } } }
    })

    if (response.body._status === 'confirmationRequired' && response.body.confirmation.authType === 'otp_sms') {
      return prepareConfirmSMSCode(basicBody, response.body.confirmation, device)
    }
  } else {
    return prepareConfirmSMSCode(basicBody, basicConfirmation, device)
  }
}

async function initiateLoginSession (device) {
  return apiFetchJson('https://online.oschadbank.ua/mobile/api/v2/session', {
    method: 'GET',
    headers: {
      ...getCommonHeaders(device)
    }
  })
}

async function initiateDevices (device) {
  const body = {
    id: device.uuid,
    model: ZenMoney.device.model,
    platform: 'Android'
  }
  const response = await apiFetchJson('https://online.oschadbank.ua/mobile/api/v2/user/devices', {
    method: 'POST',
    headers: {
      ...getCommonHeaders(device)
    },
    body,
    sanitizeRequestLog: { body: { id: true } },
    sanitizeResponseLog: { body: { id: true } }
  })
  console.assert(response.body.id === device.uuid, 'Error while initiating device to server', response)
  return response
}

export async function enrollPin (device, pinCode) {
  await initiateDevices(device)
  const body = {
    deviceId: device.uuid,
    label: ZenMoney.device.model,
    pin: pinCode
  }
  const response = await apiFetchJson('https://online.oschadbank.ua/mobile/api/v2/user/personalized-devices/enroll', {
    method: 'POST',
    headers: {
      ...getCommonHeaders(device)
    },
    body,
    sanitizeRequestLog: { body: { deviceId: true, pin: true } },
    sanitizeResponseLog: { body: { id: true } }
  })
  return response
}

export async function otpMmaAuth (device, password, id) {
  const body = {
    pin: null,
    authMethod: 'otp_mma',
    password,
    applicationId: id
  }
  const response = await apiFetchJson('https://online.oschadbank.ua/mobile/api/v2/session', {
    method: 'POST',
    headers: {
      ...getCommonHeaders(device)
    },
    body,
    sanitizeRequestLog: { body: { password: true, applicationId: true } }
  })
  console.assert(response.body.status === 'authenticated', 'Could not open session', response)
  return response
}

export async function mmaLogin (device, password, id) {
  const body = {
    loginMethod: 'LOGIN_MMA',
    pin: null,
    captcha: '',
    password,
    applicationId: id
  }
  const response = await apiFetchJson('https://online.oschadbank.ua/mobile/api/v2/session', {
    method: 'POST',
    headers: {
      ...getCommonHeaders(device)
    },
    body,
    sanitizeRequestLog: { body: { password: true, applicationId: true } }
  })
  return response
}

async function loginUser (login, password, auth) {
  let response = await initiateLoginSession(auth.device)
  const loginDescribe = response.body
  const body = {
    loginMethod: 'LOGIN_PW',
    login,
    password,
    captcha: ''
  }
  if (loginDescribe.status === 'not_authenticated') {
    if (!loginDescribe.captchaRequired && loginDescribe.loginMethods.LOGIN_PW &&
      loginDescribe.loginMethods.LOGIN_PW.default) {
      response = await apiFetchJson('https://online.oschadbank.ua/mobile/api/v2/session', {
        method: 'POST',
        headers: {
          ...getCommonHeaders(auth.device)
        },
        body,
        sanitizeRequestLog: { body: { login: true, password: true, captcha: true } },
        sanitizeResponseLog: { body: { user: { mobileDevices: { id: true }, login: true, displayName: true } } }
      })
      if (response.body._error) {
        if (response.body._error.code === 'INVALID_LOGIN_OR_PASSWORD') {
          throw new InvalidLoginOrPasswordError()
        }
        if (response.body._error.code === 'ACCOUNT_BLOCKED') {
          throw new BankMessageError(response.body._error.code)
        }
        console.assert(false, 'Unknown loginUserError')
      }
      await confirmUserLogin(body, response.body.confirmation, auth.device)
      return generateSession(auth.device)
    }
  } else if (response.body._status === 'confirmationRequired' && response.body.confirmation.authType === 'otp_sms') {
    const nextConfirmation = response.body.confirmation
    nextConfirmation.smsTemplate = null
    await confirmSMSCode(body, nextConfirmation, auth.device)
    return generateSession(auth.device)
  } else if (loginDescribe.status === 'authenticated') {
    return auth
  }
  console.assert(false, 'Unexpected step while trying to login', response)
}

async function generateSession (device) {
  const pin = generateRandomString(6, '0123456789')
  const response = await enrollPin(device, pin)
  await logout(device)
  const passGenerator = new OTPGenerator(response.body.encryptedKey, pin, 0, response.body.encryptionParams.pbeParams, response.body.encryptionParams.cipherParams)
  await otpMmaAuth(device, passGenerator.generateOTP(), response.body.id)
  return {
    pin,
    encryptedKey: response.body.encryptedKey,
    pbeParams: response.body.encryptionParams.pbeParams,
    cipherParams: response.body.encryptionParams.cipherParams,
    sessionNumber: passGenerator.getSessionNumber(),
    appId: response.body.id,
    device
  }
}

async function restoreSession (login, password, isInBackground, auth) {
  let response = await initiateLoginSession(auth.device)
  let passGenerator = null
  if (response.body.status !== 'authenticated') {
    passGenerator = new OTPGenerator(auth.encryptedKey, auth.pin, auth.sessionNumber, auth.pbeParams, auth.cipherParams)
    response = await mmaLogin(auth.device, passGenerator.generateOTP(), auth.appId)
  }
  if (!(response.body?.status === 'authenticated')) {
    if (!isInBackground) {
      return loginUser(login, password, auth)
    }
    throw new UserInteractionError()
  } else {
    return {
      ...auth,
      ...passGenerator ? { sessionNumber: passGenerator.getSessionNumber() } : { }
    }
  }
}

export async function login ({ login, password }, isInBackground, auth) {
  if (ZenMoney.trustCertificates) {
    ZenMoney.trustCertificates([
      `-----BEGIN CERTIFICATE-----
MIIGcDCCBVigAwIBAgIQCNt1DdkgS9GV7dsk0bw2mzANBgkqhkiG9w0BAQsFADBc
MQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3
d3cuZGlnaWNlcnQuY29tMRswGQYDVQQDExJUaGF3dGUgUlNBIENBIDIwMTgwHhcN
MTkwNjI0MDAwMDAwWhcNMjEwOTIyMTIwMDAwWjBiMQswCQYDVQQGEwJVQTENMAsG
A1UEBxMES3lpdjEXMBUGA1UEChMOSlNDIE9zY2hhZGJhbmsxETAPBgNVBAsTCEVu
Z2luZWVyMRgwFgYDVQQDDA8qLm9zY2hhZGJhbmsudWEwggEiMA0GCSqGSIb3DQEB
AQUAA4IBDwAwggEKAoIBAQCqr0JNWk5NHicKcIN+CP4GKpvXpaUi9tN5C0+QUo53
JgsJNoiYrel8zLVvhZyTYVAtwDrGbZe6X5VNHrHyRe+yMp8UypmHu5PVfnRXg1Nt
2lHO7DlZap939/+2wSuP2aEKj9ZudlV46mtyS2zjzmgT1vjeviNVvRLuYbqls/5o
V9gIPnTmrKozWEXoehzW8p4d5dYG2q6qdhZ62uerTcu1RTWEqaIrENOHMtN0qTkN
uuVjisDeVWsrlG1i8sVRhB74F+8aDo3PdakyeTLJ/YFATJoEyxogoyQG6Z4mbapB
GP5oKNNSf0vV6FCaBBei97Mxd/J7P2QdbvV2/CUBSOnVAgMBAAGjggMmMIIDIjAf
BgNVHSMEGDAWgBSjyF5lVOUweMEF6gcKalnMuf7eWjAdBgNVHQ4EFgQU/NGtbiiM
xjOxZi4cSFFvj6gI40cwKQYDVR0RBCIwIIIPKi5vc2NoYWRiYW5rLnVhgg1vc2No
YWRiYW5rLnVhMA4GA1UdDwEB/wQEAwIFoDAdBgNVHSUEFjAUBggrBgEFBQcDAQYI
KwYBBQUHAwIwOgYDVR0fBDMwMTAvoC2gK4YpaHR0cDovL2NkcC50aGF3dGUuY29t
L1RoYXd0ZVJTQUNBMjAxOC5jcmwwTAYDVR0gBEUwQzA3BglghkgBhv1sAQEwKjAo
BggrBgEFBQcCARYcaHR0cHM6Ly93d3cuZGlnaWNlcnQuY29tL0NQUzAIBgZngQwB
AgIwbwYIKwYBBQUHAQEEYzBhMCQGCCsGAQUFBzABhhhodHRwOi8vc3RhdHVzLnRo
YXd0ZS5jb20wOQYIKwYBBQUHMAKGLWh0dHA6Ly9jYWNlcnRzLnRoYXd0ZS5jb20v
VGhhd3RlUlNBQ0EyMDE4LmNydDAJBgNVHRMEAjAAMIIBfgYKKwYBBAHWeQIEAgSC
AW4EggFqAWgAdQCkuQmQtBhYFIe7E6LMZ3AKPDWYBPkb37jjd80OyA3cEAAAAWuJ
hvfdAAAEAwBGMEQCIDbVEZU8/W+50xLV/7NltAL3CNi6rVcB0iElpqKNouBjAiBw
/uTRWVUE2GxSePQewCLio3be+7QlCC+EGM1L3kAlPwB2AId1v+dZfPiMQ5lfvfNu
/1aNR1Y2/0q1YMG06v9eoIMPAAABa4mG+DIAAAQDAEcwRQIhAJamglqNT9+tP5wQ
q1a0kjbdDTvTPCnuvRwab8rCKkIDAiBUZpHeZ5LC8wsU25VUDX4x4hrRCK9/wphU
yK8r/7e5tQB3AESUZS6w7s6vxEAH2Kj+KMDa5oK+2MsxtT/TM5a1toGoAAABa4mG
90YAAAQDAEgwRgIhAI7s2LuVbaJ1RcIBzog9smMwWozuH3OGjlXfvfQ6XNUdAiEA
mni/lCXHqmDab4U7XZK0o3gj5aaNdV480C4DIJT6E8wwDQYJKoZIhvcNAQELBQAD
ggEBAEnj0biYlzuVP3hvEAGPL6nrEpBlB1sl8WAsErBom4VEuI2HoGfvrggmO0li
2JkOsMimHGSHHLyX/1KyZR/4KU1bY9NAHIMDlQp42yLVM3iCszECOM/FN0ka/sFt
TPU8mP3qybLdfC/kkPvrG3vewXeSPjmFMsaYfPjFCBGUoGBMvz/KKaO7OLbYnpk1
AjS6tdJqUMVVf0MoPZ8VvstnmeLz+9Mjlenj5nltwlVOB8e1YcUkRlu04f90sTv/
qg75m3pMrRgRiEwg/wTe4FDqtjhVvvWIXLuMLJM6ktl2v47cvfxIFSTBLOyapUKs
T1Hc3DmgAR6VtuU5xiZELxhSSYw=
-----END CERTIFICATE-----`
    ])
  }

  await getCurrentCookie(auth.device)
  if (!auth.encryptedKey) {
    await logout(auth.device)
    return loginUser(login, password, auth)
  } else {
    return restoreSession(login, password, isInBackground, auth)
  }
}

export async function logout (device) {
  const response = await apiFetchJson('https://online.oschadbank.ua/mobile/api/v2/session', {
    method: 'DELETE',
    headers: {
      ...getCommonHeaders(device)
    }
  })
  return response
}

export function generateDevice () {
  return { uuid: generateUUID().replace(/-/g, '').substring(0, 16) }
}

function checkForLogOutError (response) {
  return response.body._error?.code?.match(/LOGGED_OUT_USER/i)
}

export async function fetchAccounts (device) {
  const response = await apiFetchJson('https://online.oschadbank.ua/mobile/api/v2/contracts?system=W4C', {
    method: 'GET',
    headers: {
      ...getCommonHeaders(device)
    }
  })
  if (checkForLogOutError(response)) {
    return null
  }
  console.assert(Array.isArray(response.body) && response.body.length > 0, 'Bank did not return accounts', response)
  return response.body
}

export async function fetchTransactions (product, fromDate, toDate, device) {
  const response = await apiFetchJson(`https://online.oschadbank.ua/mobile/api/v2/history?from=${fromDate.toISOString().split(/^(.*)T(.*)/)[1]}&contractId=${product.id}`, { // c7f7c74119487a3708a9af7fb0ca3ec34a083555
    method: 'GET',
    headers: {
      ...getCommonHeaders(device)
    }
  })
  if (checkForLogOutError(response)) {
    return null
  }
  return response.body
}
