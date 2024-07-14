import { fetch, FetchOptions, FetchResponse, ParseError } from '../../common/network'
import { isArray } from 'lodash'
import get, { getBoolean, getNumber, getOptString, getString } from '../../types/get'
import { InvalidLoginOrPasswordError, TemporaryUnavailableError } from '../../errors'
import {
  APP_VERSION,
  AuthV2,
  CardProductV2,
  CardsAndAccounts,
  CertifyLoginResponseV2,
  DepositDetailsV2,
  DepositStatementV2,
  DepositsV2,
  DeviceData,
  DeviceInfo,
  EasyLoginRequestV2,
  FetchHistoryV2Data,
  LoanProductV2,
  LoginResponse,
  OS_VERSION,
  OtpDeviceV2,
  PasswordLoginRequestV2,
  SessionV2,
  TransactionsByDateV2
} from './models'
import { getCookies } from './utils'

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

export async function fetchLoginByPasswordV2 ({ username, password, deviceInfo, deviceData }:
{ username: string, password: string, deviceInfo: DeviceInfo, deviceData: DeviceData }): Promise<LoginResponse> {
  const base64encodedDeviceInfo = deviceInfo.toBase64()
  const base64encodedDeviceData = deviceData.toBase64()
  const url = 'https://rmbgwauth.tbconline.ge/v1/auth/loginWithPassword'
  const body: PasswordLoginRequestV2 = {
    username,
    password,
    language: 'en',
    deviceInfo: base64encodedDeviceInfo,
    deviceData: base64encodedDeviceData,
    deviceId: deviceInfo.deviceId
  }
  const response = await fetchApi(url,
    {
      body,
      headers: {
        'User-Agent': `TBC a${APP_VERSION} (Android; Android ${OS_VERSION}; ANDROID_PHONE)`,
        'Content-Type': 'application/json; charset=UTF-8'
      },
      stringify: JSON.stringify,
      parse: JSON.parse,
      method: 'POST',
      sanitizeRequestLog: { body: { username: true, password: true, deviceInfo: true, deviceDate: true, deviceId: true } }
    })

  if (response.status === 401) {
    throw new InvalidLoginOrPasswordError()
  }

  const loginResp = response.body as LoginResponse
  loginResp.cookies = getCookies(response)
  return loginResp
}

export async function fetchLoginByPasscodeV2 (auth: AuthV2, deviceInfo: DeviceInfo, deviceData: DeviceData): Promise<LoginResponse | null> {
  const body: EasyLoginRequestV2 = {
    userName: auth.username,
    passcode: auth?.passcode ?? '',
    registrationId: auth.registrationId,
    deviceInfo: deviceInfo.toBase64(),
    deviceData: deviceData.toBase64(),
    passcodeType: 'NUMERIC_PASSCODE',
    language: 'en',
    deviceId: deviceInfo.deviceId,
    trustedDeviceId: auth.trustedDeviceId
  }
  const response = await fetchApi('https://rmbgwauth.tbconline.ge/v1/auth/easyLogin', {
    body,
    headers: {
      'User-Agent': `TBC a${APP_VERSION} (Android; Android ${OS_VERSION}; ANDROID_PHONE)`,
      'Content-Type': 'application/json; charset=UTF-8'
    },
    method: 'POST',
    stringify: JSON.stringify,
    parse: JSON.parse,
    sanitizeRequestLog: {
      body: {
        userName: true,
        passcode: true,
        registrationId: true,
        deviceInfo: true,
        deviceData: true,
        deviceId: true,
        trustedDeviceId: true
      }
    }
  })
  if (response.status === 500) {
    return null
  }
  const loginResponse = response.body as LoginResponse
  loginResponse.cookies = getCookies(response)
  return loginResponse
}

export async function fetchCertifyLoginByOtpDeviceV2 (code: string, transactionId: string, otpDevice: OtpDeviceV2): Promise<string[]> {
  const body = {
    transactionId,
    language: 'en',
    signature: {
      response: code,
      status: 'CHALLENGE',
      type: otpDevice,
      otpId: 'NONE'
    }
  }
  const url = 'https://rmbgwauth.tbconline.ge/v1/auth/certifyLogin'
  const response = await fetchApi(url, {
    body,
    headers: {
      'User-Agent': `TBC a${APP_VERSION} (Android; Android ${OS_VERSION}; ANDROID_PHONE)`,
      'Content-Type': 'application/json; charset=UTF-8'
    },
    method: 'POST',
    stringify: JSON.stringify,
    parse: JSON.parse,
    sanitizeRequestLog: {
      body: {
        signature: { response: true }
      }
    }
  })
  const data = response.body as CertifyLoginResponseV2
  if (!data?.success) {
    throw new Error(`Error in fetchCertifyLoginByOtpDeviceV2\n${JSON.stringify(data)}`)
  }
  return getCookies(response)
}

/**
 * Fetches user info
 * @param cookies
 * @returns sessionId or null if not logged in
 */
export async function fetchGetSessionIdV2 (cookies: string[]): Promise<string | null> {
  const user = await fetchApi('https://rmbgwauth.tbconline.ge/v2/usermanagement/userinfo', {
    headers: {
      'User-Agent': `TBC a${APP_VERSION} (Android; Android ${OS_VERSION}; ANDROID_PHONE)`,
      Cookie: cookies.join('; ')
    },
    method: 'GET',
    sanitizeResponseLog: {
      body: {
        sessionId: true,
        firstNameEn: true,
        firstNameGe: true,
        lastNameEn: true,
        lastNameGe: true,
        birthday: true,
        email: true,
        mobilePhoneForSms: true,
        username: true,
        clientNameEn: true,
        clientNameGe: true
      }
    }
  })
  if (user.status === 401) {
    return null
  }
  return getString(JSON.parse(user.body as string), 'sessionId')
}

/**
 * Fetches registrationId
 * @param auth
 * @return registrationId
 */
export async function fetchRegisterDeviceV2 (auth: { deviceName: string, passcode: string, deviceId: string }): Promise<string> {
  const body = {
    ...auth,
    passcodeType: 'NUMERIC_PASSCODE'
  }

  const response = await fetchApi('https://rmbgwauth.tbconline.ge/v1/auth/registerDevice', {
    body,
    headers: {
      'User-Agent': `TBC a${APP_VERSION} (Android; Android ${OS_VERSION}; ANDROID_PHONE)`,
      'Content-Type': 'application/json; charset=UTF-8'
    },
    method: 'POST',
    stringify: JSON.stringify,
    parse: JSON.parse,
    sanitizeRequestLog: { body: { passcode: true } },
    sanitizeResponseLog: { body: { registrationId: true } }
  })
  const success = getBoolean(response.body, 'success')
  if (!success) {
    throw new Error(`Error in fetchRegisterDeviceV2\n${JSON.stringify(response.body)}`)
  }
  return getString(response.body, 'registrationId')
}

export async function fetchUnTrustDeviceV2 (deviceData: DeviceData, sessionId: string, cookies: string[]): Promise<boolean> {
  const body = {
    deviceId: deviceData.deviceId,
    sessionId,
    orderType: 'Unset',
    channel: 'RMB'
  }

  const headers = {
    'User-Agent': `TBC a${APP_VERSION} (Android; Android ${OS_VERSION}; ANDROID_PHONE)`,
    'Content-Type': 'application/json; charset=UTF-8',
    'Accept-Language': 'en-us',
    'APP-VERSION': APP_VERSION,
    'DEVICE-ID': deviceData.deviceId,
    'DEVICE-MANUFACTURER': deviceData.manufacturer,
    'DEVICE-MODEL': deviceData.modelNumber,
    'DEVICE-OS': 'Android 7.1.1',
    'DEVICE-ROOTED': 'false',
    'DEVICE-TYPE': 'ANDROID_PHONE',
    Cookie: cookies.join('; ')
  }

  const response = await fetchApi('https://rmbgwauth.tbconline.ge/devicemanagement/api/v1/device/order', {
    body,
    headers,
    method: 'POST',
    stringify: JSON.stringify,
    parse: JSON.parse,
    sanitizeRequestLog: {
      body: { sessionId: true }
    }
  })

  const orderId = getNumber(response.body, 'orderId')

  const confirmResponse = await fetchApi('https://rmbgwauth.tbconline.ge/devicemanagement/api/v1/device/order/confirm', {
    body: {
      orderId,
      orderType: 'Unset'
    },
    headers,
    method: 'POST',
    stringify: JSON.stringify,
    parse: JSON.parse,
    sanitizeRequestLog: {
      body: { sessionId: true }
    }
  })

  if (confirmResponse.status === 400) {
    if (getOptString(confirmResponse.body, 'code') === 'DeviceNotTrusted' || getOptString(confirmResponse.body, 'code') === 'ObjectNotFound') {
      return true
    }
    throw new Error(`Error in fetchUnTrustDeviceV2\n${JSON.stringify(confirmResponse.body)}`)
  }

  const returnDeviceId = getString(confirmResponse.body, 'deviceId')
  return returnDeviceId === deviceData.deviceId
}

/**
 * Attempts to trust the device
 * @param deviceData
 * @param sessionId
 * @param cookies
 * @return orderId
 */
export async function fetchTrustDeviceV2 (deviceData: DeviceData, sessionId: string, cookies: string[]): Promise<number> {
  const body = {
    deviceId: deviceData.deviceId,
    sessionId,
    orderType: 'Set'
  }
  const response = await fetchApi('https://rmbgwauth.tbconline.ge/devicemanagement/api/v1/device/order', {
    body,
    headers: {
      'User-Agent': `TBC a${APP_VERSION} (Android; Android ${OS_VERSION}; ANDROID_PHONE)`,
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept-Language': 'en-us',
      // 'User-Agent': 'okhttp/4.9.1',
      'APP-VERSION': APP_VERSION,
      'DEVICE-ID': deviceData.deviceId,
      'DEVICE-MANUFACTURER': deviceData.manufacturer,
      'DEVICE-MODEL': deviceData.modelNumber,
      'DEVICE-OS': 'Android 7.1.1',
      'DEVICE-ROOTED': 'false',
      'DEVICE-TYPE': 'ANDROID_PHONE',
      Cookie: cookies.join('; ')
    },
    method: 'POST',
    stringify: JSON.stringify,
    parse: JSON.parse,
    sanitizeRequestLog: { body: { sessionId: true } }
  })
  return getNumber(response.body, 'orderId')
}

/**
 * Confirms the trusted device
 * @param authorizationCode
 * @param orderId
 * @param cookies
 * @return trustId
 */
export async function fetchConfirmTrustedDeviceV2 (authorizationCode: string, orderId: number, cookies: string[]): Promise<string | null> {
  const body = {
    orderId, authorizationCode, orderType: 'Set'
  }

  const response = await fetchApi('https://rmbgwauth.tbconline.ge/devicemanagement/api/v1/device/order/confirm', {
    body,
    headers: {
      'User-Agent': `TBC a${APP_VERSION} (Android; Android ${OS_VERSION}; ANDROID_PHONE)`,
      'Content-Type': 'application/json; charset=UTF-8',
      Cookie: cookies.join('; ')
    },
    method: 'POST',
    stringify: JSON.stringify,
    parse: JSON.parse,
    sanitizeRequestLog: { body: { authorizationCode: true } },
    sanitizeResponseLog: { body: { trustId: true } }
  })

  if (response.status === 500) {
    const title = get(response.body, 'title', null)
    if (title === 'Already trusted') {
      return null
    }
  }

  if (response.status === 400) {
    if (get(response.body, 'detail', null) === 'Already trusted') {
      return null
    }
  }

  return getString(response.body, 'trustId')
}

export async function fetchDepositDetailsV2 (id: number, session: SessionV2): Promise<DepositDetailsV2> {
  const result = await fetchApi(`https://rmbgw.tbconline.ge/deposits/api/v1/deposits/${id}/details`, {
    method: 'GET',
    headers: {
      'User-Agent': `TBC a${APP_VERSION} (Android; Android ${OS_VERSION}; ANDROID_PHONE)`,
      Cookie: session.cookies.join('; '),
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept-Language': 'en-us'
    },
    parse: JSON.parse
  })
  return result.body as DepositDetailsV2
}

export async function fetchApiDepositStatementsV2 (id: number, session: SessionV2): Promise<DepositStatementV2[]> {
  const response = await fetchApi(`https://rmbgw.tbconline.ge/deposits/api/v1/statements/${id}`, {
    method: 'GET',
    headers: {
      'User-Agent': `TBC a${APP_VERSION} (Android; Android ${OS_VERSION}; ANDROID_PHONE)`,
      Cookie: session.cookies.join('; '),
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept-Language': 'en-us'
    },
    parse: JSON.parse
  })
  return response.body as DepositStatementV2[]
}

export async function fetchApiDepositsV2 (session: SessionV2): Promise<DepositsV2> {
  const response = await fetchApi('https://rmbgw.tbconline.ge/deposits/api/v1/deposits', {
    method: 'GET',
    headers: {
      'User-Agent': `TBC a${APP_VERSION} (Android; Android ${OS_VERSION}; ANDROID_PHONE)`,
      Cookie: session.cookies.join('; '),
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept-Language': 'en-us'
    },
    parse: JSON.parse
  })

  const deposits = response.body as DepositsV2
  assert(deposits.nextPageId == null, 'unknown param nextPageId', response)
  return deposits
}

export async function fetchApiLoansV2 (session: SessionV2): Promise<LoanProductV2[]> {
  const response = await fetchApi('https://rmbgw.tbconline.ge/loans/api/v1/list?ClientRoles=CoBorrower&ShowCards=false', {
    method: 'GET',
    headers: {
      'User-Agent': `TBC a${APP_VERSION} (Android; Android ${OS_VERSION}; ANDROID_PHONE)`,
      Cookie: session.cookies.join('; '),
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept-Language': 'en-us'
    },
    parse: JSON.parse
  })
  return response.body as LoanProductV2[]
}

export async function fetchCardsListV2 (session: SessionV2): Promise<CardProductV2[]> {
  const response = await fetchApi('https://rmbgw.tbconline.ge/products/api/v1/cards', {
    method: 'GET',
    headers: {
      'User-Agent': `TBC a${APP_VERSION} (Android; Android ${OS_VERSION}; ANDROID_PHONE)`,
      Cookie: session.cookies.join('; '),
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept-Language': 'en-us'
    },
    parse: JSON.parse,
    sanitizeResponseLog: {
      body: [
        {
          cards: [
            { holderName: true }
          ]
        }
      ]
    }
  })
  return response.body as CardProductV2[]
}

export async function fetchCardAndAccountsDashboardV2 (session: SessionV2): Promise<CardsAndAccounts> {
  const response = await fetchApi('https://rmbgw.tbconline.ge/dashboard/api/v1/cards-and-accounts', {
    method: 'GET',
    headers: {
      'User-Agent': `TBC a${APP_VERSION} (Android; Android ${OS_VERSION}; ANDROID_PHONE)`,
      Cookie: session.cookies.join('; '),
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept-Language': 'en-us'
    },
    parse: JSON.parse
  })
  return response.body as CardsAndAccounts
}

export async function fetchHistoryV2 (session: SessionV2, fromDate: Date, data: FetchHistoryV2Data): Promise<TransactionsByDateV2[]> {
  const result: TransactionsByDateV2[] = []
  let lastSortColKey: number | null = null
  let lastBlockedMovementDate: number | null = null
  const pageSize = 100
  const coreAccountIds = [
    {
      currency: data.currency,
      iban: data.iban,
      id: data.id,
      type: '200'
    }
  ]
  let lastDate = new Date().getTime()
  while (true) {
    const b = {
      coreAccountIds,
      pageSize,
      pageType: 'History',
      isChildCardRequest: false,
      showBlockedTransactions: false,
      lastSortColKey: lastSortColKey != null ? lastSortColKey : undefined,
      lastBlockedMovementDate: lastBlockedMovementDate != null ? lastBlockedMovementDate : undefined
    }

    const response = await fetchApi('https://rmbgw.tbconline.ge/pfm/api/v1/transactions/history', {
      body: b,
      method: 'POST',
      headers: {
        'User-Agent': `TBC a${APP_VERSION} (Android; Android ${OS_VERSION}; ANDROID_PHONE)`,
        Cookie: session.cookies.join('; '),
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Accept-Language': 'en-us'
      },
      parse: JSON.parse,
      stringify: JSON.stringify
    })

    const transactionsByDate = response.body as TransactionsByDateV2[]
    assert(isArray(transactionsByDate), 'unexpected response', transactionsByDate)
    if (transactionsByDate.length === 0) {
      break
    }
    let stop = false
    for (const transactionByDate of transactionsByDate) {
      if (transactionByDate.date <= fromDate.getTime()) {
        stop = true
      }
      if (lastDate === transactionByDate.date) {
        stop = true
      }
      if (lastDate > transactionByDate.date) {
        lastDate = transactionByDate.date
      }
      for (const transaction of transactionByDate.transactions) {
        if (transaction.transactionId !== null && transaction.transactionId !== 0) {
          lastSortColKey = transaction.transactionId
        }
        if (transaction.blockedMovementDate !== null && transaction.blockedMovementDate !== 0) {
          lastBlockedMovementDate = transaction.blockedMovementDate
        }
      }
      result.push(transactionByDate)
    }

    if (stop) {
      break
    }
  }

  return result
}
