import { fetch, FetchOptions, FetchResponse, ParseError } from '../../../common/network'
import { defaultsDeep, isArray } from 'lodash'
import qs from 'querystring'
import get, { getArray, getBoolean, getNumber, getOptArray, getOptNumber, getOptString, getString } from '../../../types/get'
import { InvalidLoginOrPasswordError, InvalidOtpCodeError, TemporaryUnavailableError } from '../../../errors'
import {
  APP_VERSION,
  Auth,
  Device,
  OS_VERSION,
  OtpDevice,
  Session
} from './models'
import { encryptFirstPasscode, getDeviceInfo, hashPasscodeRequest, hashPasswordRequest } from './utils'
import forge from 'node-forge'
import { encryptJWEUsingJSONKey, encryptJWEUsingObjectKey } from './jweUtils'
import { retry } from '../../../common/retry'

async function fetchApi (url: string, options: FetchOptions): Promise<FetchResponse> {
  let response: FetchResponse
  if (!options.sanitizeRequestLog) {
    options.sanitizeRequestLog = {}
  }
  // @ts-expect-error Disallowing cookies in request logs
  options.sanitizeRequestLog.headers = { Cookie: true }
  if (!options.sanitizeResponseLog) {
    options.sanitizeResponseLog = {}
  }
  // @ts-expect-error Disallowing cookies in response logs
  options.sanitizeResponseLog.headers = { 'set-cookie': true }
  console.log('sanitized request', options.sanitizeRequestLog)
  console.log('sanitized response', options.sanitizeResponseLog)
  try {
    response = await fetch(url, options)
  } catch (e) {
    if (e instanceof ParseError && e.response.status === 502) {
      throw new TemporaryUnavailableError()
    }
    throw e
  }
  return response
}

async function fetchLoginApi (url: string, body: unknown, sanitizeOptions: { sanitizeRequestLog?: unknown, sanitizeResponseLog?: unknown }): Promise<unknown> {
  const response = await fetchApi(url, {
    method: 'POST',
    headers: {
      'User-Agent': `TBC a${APP_VERSION} (Android; Android ${OS_VERSION}; ANDROID_PHONE)`
    },
    body,
    stringify: JSON.stringify,
    parse: JSON.parse,
    sanitizeRequestLog: sanitizeOptions.sanitizeRequestLog,
    sanitizeResponseLog: defaultsDeep({
      headers: {
        'set-cookie': true
      }
    }, sanitizeOptions.sanitizeResponseLog)
  })
  return response.body
}

async function fetchLoginService (body: unknown, sanitizeOptions: { sanitizeRequestLog?: unknown, sanitizeResponseLog?: unknown }): Promise<unknown> {
  return await fetchLoginApi('https://account.tbconline.ge/Login', body, sanitizeOptions)
  // return await fetchLoginApi('https://tbconline.ge/mbs-json/remoting/LoginService', body, sanitizeOptions)
}

async function fetchAuthorizedApi (url: string, options: FetchOptions, session: { auth: { device: Device }, ibsAccessToken: string }): Promise<unknown> {
  const response = await fetchApi(url, defaultsDeep({
    headers: {
      'Accept-Language': 'en-us',
      'User-Agent': 'okhttp/4.9.1',
      'APP-VERSION': APP_VERSION,
      'DEVICE-ID': session.auth.device.androidId,
      'DEVICE-MANUFACTURER': session.auth.device.manufacturer,
      'DEVICE-MODEL': session.auth.device.model,
      'DEVICE-OS': `Android ${OS_VERSION}`,
      'DEVICE-ROOTED': 'false',
      'DEVICE-TYPE': 'ANDROID_PHONE',
      'X-IBS-LOGIN-TOKEN': session.ibsAccessToken,
      ...options.headers as Record<string, unknown>,
      ...options.body != null && { 'Content-Type': 'application/json; charset=UTF-8' }
    },
    stringify: JSON.stringify,
    parse: JSON.parse,
    sanitizeRequestLog: {
      headers: {
        'X-IBS-LOGIN-TOKEN': true
      }
    },
    sanitizeResponseLog: {
      headers: {
        'set-cookie': true
      }
    }
  }, options))

  if (getOptString(response.body, 'messageCode') === 'CM.ONLINE_SERVICE_UNAVAILABLE') {
    throw new TemporaryUnavailableError()
  }

  return response.body
}

export async function fetchGetLoginSalt (login: string): Promise<{ salt: string, hashMethod: string }> {
  const response = await fetchLoginService({
    arguments: [
      {
        username: login,
        javaClass: 'cz.bsc.g6.components.usernamepasswordauthentication.json.services.api.mo.GetSaltRequestMo'
      }
    ],
    javaClass: 'org.springframework.remoting.support.RemoteInvocation',
    methodName: 'getLoginSalt',
    parameterTypes: ['cz.bsc.g6.components.usernamepasswordauthentication.json.services.api.mo.GetSaltRequestMo']
  }, {
    sanitizeRequestLog: { body: { arguments: { username: true } } },
    sanitizeResponseLog: { body: { salt: true } }
  })
  const salt = getString(response, 'salt')
  const hashMethod = getString(response, 'credentialsHashMethod')
  return { salt, hashMethod }
}

export async function fetchGetRequestSalt (): Promise<string> {
  const response = await fetchLoginService({
    arguments: [],
    javaClass: 'org.springframework.remoting.support.RemoteInvocation',
    methodName: 'getRequestSalt',
    parameterTypes: []
  }, { sanitizeResponseLog: { body: { salt: true } } })

  return getString(response, 'salt')
}
export async function fetchLoginByPassword ({ login, password }: { login: string, password: string },
  saltInfo: { loginSalt: string, loginHashMethod: string, requestSalt: string },
  device: Device):
  Promise<{ accessToken: string, authPublicKey: string, loginId: string, transactionId: number, otpDevice: OtpDevice }> {
  const response = await fetchLoginService({
    arguments: [
      {
        deviceInfo: getDeviceInfo(device),
        priorityMessage: true,
        userCredential: {
          password: hashPasswordRequest(saltInfo, password),
          username: login,
          javaClass: 'cz.bsc.g6.components.usernamepasswordauthentication.json.services.api.mo.UsernamePasswordCredentialMo'
        },
        userData: { language: 'en', javaClass: 'cz.bsc.g6.components.usernamepasswordauthentication.json.services.api.mo.UserDataMo' },
        javaClass: 'cz.bsc.g6.components.usernamepasswordauthentication.json.services.api.mo.LoginRequestMo'
      }
    ],
    javaClass: 'org.springframework.remoting.support.RemoteInvocation',
    methodName: 'login',
    parameterTypes: ['cz.bsc.g6.components.usernamepasswordauthentication.json.services.api.mo.LoginRequestMo']
  }, {
    sanitizeRequestLog: { body: { arguments: { userCredential: { username: true, password: true } } } },
    sanitizeResponseLog: { body: { signature: { accessToken: true, authenticationCodeRsaPublicKey: true } } }
  })

  const transactionId = getOptNumber(response, 'transactionId')
  const signature = get(response, 'signature')

  if (transactionId == null || signature == null) {
    throw new InvalidLoginOrPasswordError()
  }
  const otpDevice = getString(signature, 'type')
  assert(getString(signature, 'status') === 'CHALLENGE' &&
    (otpDevice === 'SMS_OTP' || otpDevice === 'TOKEN_GEMALTO' || otpDevice === 'TOKEN_VASCO'), 'unexpected auth type', signature)
  return {
    accessToken: getString(signature, 'accessToken'),
    authPublicKey: getString(signature, 'authenticationCodeRsaPublicKey'),
    loginId: getString(signature, 'id'),
    transactionId,
    otpDevice
  }
}

export async function fetchLoginByPasscode (requestSalt: string,
  auth: Auth): Promise<{ accessToken: string, authPublicKey: string, loginId: string, transactionId: number }> {
  const response = await fetchLoginService({
    arguments: [
      {
        deviceInfo: getDeviceInfo(auth.device),
        passcode: hashPasscodeRequest(requestSalt, auth.passcode),
        passcodeType: 'NUMERIC_PASSCODE',
        priorityMessage: true,
        registrationId: auth.registrationId,
        trustedLoginRequired: true,
        userData: { language: 'en', javaClass: 'cz.bsc.g6.components.usernamepasswordauthentication.json.services.api.mo.UserDataMo' },
        javaClass: 'cz.bsc.g6.components.usernamepasswordauthentication.json.services.api.mo.LoginRequestPasscodeMo'
      }
    ],
    javaClass: 'org.springframework.remoting.support.RemoteInvocation',
    methodName: 'login',
    parameterTypes: ['cz.bsc.g6.components.usernamepasswordauthentication.json.services.api.mo.LoginRequestPasscodeMo']
  }, {
    sanitizeRequestLog: { body: { arguments: { passcode: true, registrationId: true } } },
    sanitizeResponseLog: { body: { signature: { accessToken: true, authenticationCodeRsaPublicKey: true } } }
  })

  const transactionId = getNumber(response, 'transactionId')
  const signature = get(response, 'signature')

  assert(getString(signature, 'status') === 'CHALLENGE' &&
    getString(signature, 'type') === 'TRUSTED_LOGIN', 'unexpected auth type', signature)

  return {
    accessToken: getString(signature, 'accessToken'),
    authPublicKey: getString(signature, 'authenticationCodeRsaPublicKey'),
    loginId: getString(signature, 'id'),
    transactionId
  }
}

export async function fetchCertifyLoginBySms (smsCode: string,
  {
    accessToken,
    authPublicKey,
    loginId,
    transactionId,
    otpDevice
  }: { accessToken: string, authPublicKey: string, loginId: string, transactionId: number, otpDevice: OtpDevice }): Promise<string> {
  const encData = {
    transactionData: [{ businessObjectType: '2.22.00.00', id: transactionId, type: '2FA' }],
    userAuthComponents: { accessToken, challengeCode: smsCode }
  }
  const response = await fetchLoginService({
    arguments: [
      {
        signature:
          {
            accessToken,
            additionalAttributes: { list: [], javaClass: 'java.util.ArrayList' },
            authenticationCode: await encryptJWEUsingJSONKey(JSON.stringify(encData), forge.util.decode64(authPublicKey)),
            authenticationCodeRsaPublicKey: authPublicKey,
            id: loginId,
            status: 'CHALLENGE',
            type: otpDevice,
            javaClass: 'cz.bsc.g6.components.payment.json.services.api.mo.AuthorizationContentMo'
          },
        transactionId,
        javaClass: 'cz.bsc.g6.components.usernamepasswordauthentication.json.services.api.mo.CertifyLoginRequestMo'
      }
    ],
    javaClass: 'org.springframework.remoting.support.RemoteInvocation',
    methodName: 'certifyLoginTransaction',
    parameterTypes: ['cz.bsc.g6.components.usernamepasswordauthentication.json.services.api.mo.CertifyLoginRequestMo']
  }, {
    sanitizeRequestLog: { body: { arguments: { signature: { accessToken: true, authenticationCode: true, authenticationCodeRsaPublicKey: true } } } },
    sanitizeResponseLog: { body: { ibsAccessToken: true } }
  })
  const ibsAccessToken = getOptString(response, 'ibsAccessToken')
  if (ibsAccessToken == null) {
    throw new InvalidOtpCodeError()
  }
  return ibsAccessToken
}

export async function fetchCertifyLoginByPasscode ({
  accessToken,
  authPublicKey,
  loginId,
  transactionId
}: { accessToken: string, authPublicKey: string, loginId: string, transactionId: number }, auth: Auth): Promise<string> {
  const encData = {
    transactionData: [{ businessObjectType: '2.22.00.00', id: transactionId, type: '2FA' }],
    userAuthComponents: { accessToken, challengeCode: auth.trustedRegistrationId }
  }

  const response = await fetchLoginService({
    arguments:
      [
        {
          signature: {
            accessToken,
            additionalAttributes: { list: [], javaClass: 'java.util.ArrayList' },
            authenticationCode: await encryptJWEUsingJSONKey(JSON.stringify(encData), forge.util.decode64(authPublicKey)),
            authenticationCodeRsaPublicKey: authPublicKey,
            id: loginId,
            status: 'CHALLENGE',
            type: 'TRUSTED_LOGIN',
            javaClass: 'cz.bsc.g6.components.payment.json.services.api.mo.AuthorizationContentMo'
          },
          transactionId,
          javaClass: 'cz.bsc.g6.components.usernamepasswordauthentication.json.services.api.mo.CertifyLoginRequestMo'
        }
      ],
    javaClass: 'org.springframework.remoting.support.RemoteInvocation',
    methodName: 'certifyLoginTransaction',
    parameterTypes: ['cz.bsc.g6.components.usernamepasswordauthentication.json.services.api.mo.CertifyLoginRequestMo']
  }, {
    sanitizeRequestLog: { body: { arguments: { signature: true, authenticationCode: true, authenticationCodeRsaPublicKey: true } } },
    sanitizeResponseLog: { body: { ibsAccessToken: true } }
  })
  return getString(response, 'ibsAccessToken')
}

export async function fetchInitHeaders (session: { auth: { device: Device }, ibsAccessToken: string }): Promise<void> {
  await fetchAuthorizedApi('https://tbconline.ge/ibs/delegate/rest/version/v1/initHeaders', {
    method: 'GET',
    headers: {
      'DEVICE-REMEMBERED': 'true'
    }
  }, session)
}

export async function fetchRegisterDevice (auth: { device: Device, passcode: string }): Promise<string> {
  const response = await fetchLoginApi('https://tbconline.ge/mbs-json/remoting/DeviceManagementService', {
    arguments: [
      {
        deviceName: `Android ${auth.device.model} ${auth.device.manufacturer} ${auth.device.device}`,
        passcode: encryptFirstPasscode(auth.passcode),
        passcodeType: 'NUMERIC_PASSCODE',
        javaClass: 'cz.bsc.g6.components.devicemanagement.json.services.api.mo.RegistrationRequestMo'
      }
    ],
    javaClass: 'org.springframework.remoting.support.RemoteInvocation',
    methodName: 'registerDevice',
    parameterTypes: ['cz.bsc.g6.components.devicemanagement.json.services.api.mo.RegistrationRequestMo']
  }, {
    sanitizeRequestLog: { body: { arguments: { passcode: true } } },
    sanitizeResponseLog: { body: { registrationId: true } }
  })

  return getString(response, 'registrationId')
}

interface TrustedDeviceInfo {
  otpDevice: OtpDevice
  accessToken: string
  transactionId: number
  signatureId: number
  signerId: number
  publicKey: unknown
  lastTransactionCheckResult: unknown
  registrationDate: number
  businessObjectType: string
  certRequired: boolean
}

export async function fetchInitTrustedDevice (session: { auth: { device: Device }, ibsAccessToken: string }): Promise<TrustedDeviceInfo> {
  const response = await fetchAuthorizedApi('https://tbconline.ge/ibs/delegate/rest/transaction/v1/transaction', {
    method: 'POST',
    body: {
      businessObjectType: '3.58.01.00',
      type: 'TrustedLoginDevice'
    },
    sanitizeResponseLog: { body: { signatures: { accessToken: true, publicKey: true } } }
  }, session)
  const signatures = getArray(response, 'signatures')
  assert(signatures.length === 1, 'got multiple signatures', signatures)
  const signature = signatures[0]
  const otpDevice = getString(signature, 'deviceType')
  assert(getString(signature, 'status') === 'CHALLENGE' && (
    otpDevice === 'SMS_OTP' || otpDevice === 'TOKEN_GEMALTO' || otpDevice === 'TOKEN_VASCO'), 'unexpected trusted device confirm method', signature)
  return {
    otpDevice,
    accessToken: getString(signature, 'accessToken'),
    signatureId: getNumber(signature, 'id'),
    transactionId: getNumber(response, 'id'),
    signerId: getNumber(signature, 'signer'),
    publicKey: get(signature, 'publicKey'),
    lastTransactionCheckResult: get(response, 'lastTransactionCheckResult'),
    registrationDate: getNumber(response, 'registrationDate'),
    businessObjectType: getString(response, 'businessObjectType'),
    certRequired: getBoolean(response, 'certRequired')
  }
}

export async function fetchConfirmTrustedDevice (smsCode: string,
  {
    accessToken, transactionId, signatureId, signerId, publicKey, lastTransactionCheckResult,
    registrationDate, businessObjectType, certRequired
  }: TrustedDeviceInfo,
  session: { auth: { device: Device }, ibsAccessToken: string }): Promise<string> {
  const encData = {
    transactionData:
      [
        {
          businessObjectType,
          certRequired,
          id: transactionId,
          lastTransactionCheckResult,
          registeredBy: signerId,
          registrationDate,
          signatures: [
            {
              accessToken,
              deviceType: 'SMS_OTP',
              evaluateCount: 0,
              id: signatureId,
              publicKey,
              regenerateChallengeCount: 0,
              regenerateChallengeCountRemaining: 3,
              signer: signerId,
              status: 'CHALLENGE'
            }
          ],
          status: 'WC',
          statusText: 'For Signing',
          type: 'TrustedLoginDevice'
        }
      ],
    userAuthComponents: {
      accessToken,
      challengeCode: smsCode
    }
  }
  const response = await fetchAuthorizedApi(`https://tbconline.ge/ibs/delegate/rest/certification/v1/certifications/${transactionId}`, {
    method: 'PUT',
    body: {
      signatures: [
        {
          accessToken,
          authenticationCode: await encryptJWEUsingObjectKey(JSON.stringify(encData), publicKey),
          id: signatureId
        }
      ]
    },
    sanitizeRequestLog: { body: { signatures: { accessToken: true, authenticationCode: true } } },
    sanitizeResponseLog: { body: { trustedRegistrationId: true, signatures: { accessToken: true } } }
  }, session)
  if (getString(response, 'status') === 'WC') {
    throw new InvalidOtpCodeError()
  }
  assert(getString(response, 'status') === 'F', 'unexpected confirm trusted device status', response)
  return getString(response, 'trustedRegistrationId')
}

export async function fetchLoans (session: Session): Promise<unknown[]> {
  const response = await fetchAuthorizedApi('https://tbconline.ge/ibs/delegate/rest/loan/v2/loans?product=0', {
    method: 'GET'
  }, session)
  assert(isArray(response), 'unexpected response', response)
  return response
}

async function getJSESSIONID (): Promise<string> {
  const cookies = await ZenMoney.getCookies()
  const cookie = cookies.find(x => x.name === 'JSESSIONID' && x.value !== '')
  assert(cookie != null, 'cant find JSESSIONID', cookies)
  return cookie.value
}

async function fetchRMBQWApi (url: string, options: FetchOptions, session: Session): Promise<unknown> {
  return await fetchAuthorizedApi(
    url,
    defaultsDeep({
      headers: {
        JSESSIONID: await getJSESSIONID()
      },
      sanitizeRequestLog: {
        headers: {
          JSESSIONID: true
        }
      }
    }, options),
    session)
}

export async function fetchDeposits (session: Session): Promise<unknown[]> {
  let response
  try {
    response = await fetchRMBQWApi('https://rmbgw.tbconline.ge/deposits/api/v1/deposits', {
      method: 'GET'
    }, session)
  } catch (e) {
    if (e instanceof ParseError) {
      console.log(await ZenMoney.getCookies())
    }
    throw e
  }
  assert(get(response, 'nextPageId') == null, 'unknown param nextPageId', response)
  return getArray(response, 'items')
}

export async function fetchDepositDetails (id: number, session: Session): Promise<unknown> {
  return await fetchRMBQWApi(`https://rmbgw.tbconline.ge/deposits/api/v1/deposits/${id}/details`, {
    method: 'GET'
  }, session)
}

export async function fetchDepositStatements (id: number, session: Session): Promise<unknown[]> {
  const response = await fetchRMBQWApi(`https://rmbgw.tbconline.ge/deposits/api/v1/statements/${id}`, {
    method: 'GET'
  }, session)
  assert(isArray(response), 'deposit statements is not array', response)
  return response
}

export async function fetchDashboard (session: Session): Promise<{
  creditCards: unknown[]
  creditCardsWithBlockations: unknown[]
  debitCardsWithBlockations: unknown[]
}> {
  const toDate = new Date()
  const fromDate = new Date(toDate.getTime())
  fromDate.setDate(fromDate.getDate() - 1)
  const query = { myMoneyFromDate: fromDate.getTime(), myMoneyToDate: toDate.getTime() }
  const response =
    await retry({
      getter: async () => await fetchAuthorizedApi(`https://tbconline.ge/ibs/delegate/rest/dashboard/v1/summary?${qs.stringify(query)}`, {
        method: 'GET'
      }, session),
      predicate: x => !getBoolean(x, 'cards.unexpectedError') &&
        !getBoolean(x, 'cards.cardAccountsError') &&
        !getBoolean(x, 'cards.cardWithBlockedMovementsError') &&
        !getBoolean(x, 'cards.currentProductsError'),
      maxAttempts: 3,
      delayMs: 5000
    })
  return {
    creditCardsWithBlockations: getOptArray(response, 'cards.creditCardsWithBlockations') ?? [],
    debitCardsWithBlockations: getOptArray(response, 'cards.debitCardsWithBlockations') ?? [],
    creditCards: getOptArray(response, 'cards.creditCards') ?? []
  }
}

export async function fetchAccountsList (session: Session): Promise<unknown[]> {
  const response = await fetchAuthorizedApi('https://tbconline.ge/ibs/delegate/rest/account/v2/accounts', {
    method: 'POST',
    body: {
      accountMatrix: [],
      paymentOperationTypes: true,
      showHidden: true
    }
  }, session)
  assert(isArray(response), 'unexpected response', response)
  return response
}

export async function fetchHistory (accountId: number, session: Session, fromDate: Date, toDate: Date): Promise<unknown[]> {
  const result = []
  let lastId, lastSortColKey: number | undefined
  const pageSize = 30
  while (true) {
    const response = await fetchAuthorizedApi('https://tbconline.ge/ibs/delegate/rest/transaction/v1/history', {
      method: 'POST',
      body: {
        fromDate: fromDate.getTime(),
        coreAccountIds: [accountId],
        pageSize,
        relatedCoreAccountIds: [],
        lastSortColKey: lastSortColKey != null ? lastSortColKey : 0,
        ...lastId != null && { lastId }
      }
    }, session)
    assert(isArray(response), 'unexpected response', response)
    if (response.length === 0) {
      break
    }
    result.push(...response.filter(x => getNumber(x, 'date') <= toDate.getTime()))
    const lastTx = response.slice(-1)[0]
    lastId = getNumber(lastTx, 'id')
    lastSortColKey = getNumber(lastTx, 'date')
    if (response.length < pageSize) {
      break
    }
  }

  return result
}
