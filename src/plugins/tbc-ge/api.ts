import {
  APP_VERSION,
  AuthV2,
  CardProductV2,
  CardsAndAccounts,
  DepositDataV2,
  DepositStatementV2,
  DeviceData,
  DeviceInfo,
  FetchHistoryV2Data,
  LoginResponse,
  OtpDeviceV2,
  PASSCODE,
  Preferences,
  SessionV2,
  TransactionsByDateV2
} from './models'
import {
  fetchApiDepositsV2,
  fetchApiLoansV2,
  fetchCardAndAccountsDashboardV2,
  fetchCardsListV2,
  fetchCertifyLoginByOtpDeviceV2,
  fetchConfirmTrustedDeviceV2,
  fetchDepositDetailsV2,
  fetchApiDepositStatementsV2,
  fetchGetSessionIdV2,
  fetchHistoryV2,
  fetchLoginByPasscodeV2,
  fetchLoginByPasswordV2,
  fetchRegisterDeviceV2,
  fetchTrustDeviceV2,
  fetchUnTrustDeviceV2
} from './fetchApi'
import { InvalidLoginOrPasswordError, InvalidOtpCodeError } from '../../errors'
import { generateRandomString } from '../../common/utils'

async function askOtpCodeV2 (prompt: string, timeout = 3000): Promise<string> {
  const sms = await ZenMoney.readLine(prompt,
    { inputType: 'number' })
  if (sms == null) {
    throw new InvalidOtpCodeError()
  }
  if (timeout > 0) {
    // Wait for the timeout to prevent the user from entering the code too fast
    // The bank needs some time to process the request
    await new Promise(resolve => setTimeout(resolve, timeout))
  }
  return sms.trim()
}

function getOtpDeviceName (device: OtpDeviceV2): string {
  switch (device) {
    case OtpDeviceV2.SMS:
      return 'SMS'
    case OtpDeviceV2.GEMALTO:
      return 'TBC Pass App'
    case OtpDeviceV2.VASCO:
      return 'VASCO token'
    default:
      throw new Error(`Unknown device ${device}`)
  }
}

/**
 * Get the text for the first OTP code, for login
 * @param device
 */
function getOtpLoginCodeTextV2 (device: OtpDeviceV2): string {
  return `Enter the code from ${getOtpDeviceName(device)}`
}

/**
 * Get the text for the second OTP code, for trusting the device
 * @param device
 */
function getOtpTrustCodeTextV2 (device: OtpDeviceV2): string {
  return `Enter the code from ${getOtpDeviceName(device)} to trust the device`
}

function generateDeviceInfo (deviceId: string | null): DeviceInfo {
  if (deviceId == null) {
    deviceId = generateRandomString(16, '0123456789abcdef') + '_ZM'
  }
  return new DeviceInfo(APP_VERSION, deviceId, ZenMoney.device.manufacturer, ZenMoney.device.model + 'ZM', `${ZenMoney.device.os.name} ${ZenMoney.device.os.version}`)
}

function generateDeviceData (deviceInfo: DeviceInfo): DeviceData {
  return DeviceData.fromDeviceInfo(deviceInfo, ZenMoney.device.os.name, ZenMoney.device.os.version)
}

function getPrioritizedDevice (devices: OtpDeviceV2[]): OtpDeviceV2 {
  if (devices.includes(OtpDeviceV2.SMS)) {
    return OtpDeviceV2.SMS
  } else if (devices.includes(OtpDeviceV2.GEMALTO)) {
    return OtpDeviceV2.GEMALTO
  } else if (devices.includes(OtpDeviceV2.VASCO)) {
    throw new Error('VASCO token is not supported')
  } else {
    throw new Error('No known otp devices found')
  }
}

/**
 * Get the first possible challenge regen type or signature type. If there is none, return SMS
 * @param loginInfo
 * @param throwError If true, throw an error if no possible challenge regen types are found
 */
function getOtpDevice (loginInfo: LoginResponse, throwError = false): OtpDeviceV2 {
  if (loginInfo.possibleChallengeRegenTypes != null && loginInfo.possibleChallengeRegenTypes.length !== 0) {
    return getPrioritizedDevice(loginInfo.possibleChallengeRegenTypes)
  } else if (loginInfo.signatures != null && loginInfo.signatures.length !== 0) {
    return getPrioritizedDevice(loginInfo.signatures.map(signature => signature.type))
  } else {
    if (throwError) {
      console.error(loginInfo)
      throw new Error('No possible challenge regen types found in signatures and possibleChallengeRegenTypes')
    }
    return OtpDeviceV2.SMS
  }
}

export async function loginV2 ({ login, password }: Preferences, auth?: AuthV2, loop = true): Promise<SessionV2> {
  if (ZenMoney.trustCertificates != null && typeof (ZenMoney.trustCertificates) !== 'undefined') {
    ZenMoney.trustCertificates([
      `-----BEGIN CERTIFICATE-----
MIIGkTCCBXmgAwIBAgIJAM73sA/bbKMmMA0GCSqGSIb3DQEBCwUAMIG0MQswCQYD
VQQGEwJVUzEQMA4GA1UECBMHQXJpem9uYTETMBEGA1UEBxMKU2NvdHRzZGFsZTEa
MBgGA1UEChMRR29EYWRkeS5jb20sIEluYy4xLTArBgNVBAsTJGh0dHA6Ly9jZXJ0
cy5nb2RhZGR5LmNvbS9yZXBvc2l0b3J5LzEzMDEGA1UEAxMqR28gRGFkZHkgU2Vj
dXJlIENlcnRpZmljYXRlIEF1dGhvcml0eSAtIEcyMB4XDTIzMDcyMzA5NDUxM1oX
DTI0MDgwODExMzgxMFowGTEXMBUGA1UEAwwOKi50YmNvbmxpbmUuZ2UwggEiMA0G
CSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDZIn5vwmwskjEDsKckrldqi76fD1ns
wxvIsBTZ4jH6D6OStvXJeauD0Fp5qc4h17lRJ8fqBIhdDMy2QE3T4lMHncXhp/H+
UMyYFrhR8pxA6ZL+Ju26moqJB+JkV4nvzCQ/YetVIRUIhfsVYUt7KEkvGyP7fIvv
FmD5Td4vph9Oaf1bbBqMKN7gSbiSZtX2Ltufs4PPDakCs0FdCQUWM923Hm+akaqH
eZA/orqoZgH6jGaAvJii5OjeNA546ztAsiJ0Ot3RfdvHqERuOEJFVNn5dLVoukQE
2AmLgzpDZf66P6IKVVlE+rRmpq5L7lqksgbWyZ+zoBoGIPep9V8nK8MRAgMBAAGj
ggM+MIIDOjAMBgNVHRMBAf8EAjAAMB0GA1UdJQQWMBQGCCsGAQUFBwMBBggrBgEF
BQcDAjAOBgNVHQ8BAf8EBAMCBaAwOAYDVR0fBDEwLzAtoCugKYYnaHR0cDovL2Ny
bC5nb2RhZGR5LmNvbS9nZGlnMnMxLTcxODUuY3JsMF0GA1UdIARWMFQwSAYLYIZI
AYb9bQEHFwEwOTA3BggrBgEFBQcCARYraHR0cDovL2NlcnRpZmljYXRlcy5nb2Rh
ZGR5LmNvbS9yZXBvc2l0b3J5LzAIBgZngQwBAgEwdgYIKwYBBQUHAQEEajBoMCQG
CCsGAQUFBzABhhhodHRwOi8vb2NzcC5nb2RhZGR5LmNvbS8wQAYIKwYBBQUHMAKG
NGh0dHA6Ly9jZXJ0aWZpY2F0ZXMuZ29kYWRkeS5jb20vcmVwb3NpdG9yeS9nZGln
Mi5jcnQwHwYDVR0jBBgwFoAUQMK9J47MNIMwojPX+2yz8LQsgM4wJwYDVR0RBCAw
HoIOKi50YmNvbmxpbmUuZ2WCDHRiY29ubGluZS5nZTAdBgNVHQ4EFgQUvHA6FQ7m
t46DXh6kF914sJFSoAQwggF/BgorBgEEAdZ5AgQCBIIBbwSCAWsBaQB2AO7N0GTV
2xrOxVy3nbTNE6Iyh0Z8vOzew1FIWUZxH7WbAAABiYIjh7IAAAQDAEcwRQIgJsac
S/sITJJmGlN5a8xZY3YooiRDP8r6iIgwWWm1fdUCIQCigj3b6dwnBIqhLL/moajs
NeUmmVaIV4EhbsCwIiS75QB2AEiw42vapkc0D+VqAvqdMOscUgHLVt0sgdm7v6s5
2IRzAAABiYIjiIUAAAQDAEcwRQIgAXaGO+N0UJGBkiwu09PE6v3EPB160zEmaPeq
1NhVWGwCIQCRioar8aYdDTuYELM4u65s+W3M//hDjPkK3QDMDVN59AB3ANq2v2s/
tbYin5vCu1xr6HCRcWy7UYSFNL2kPTBI1/urAAABiYIjiOoAAAQDAEgwRgIhAJim
T+pePHzLnXo7tivqzSK9QcCiKOBRRbTIse7vP+MwAiEAxQf7eKJI+wNtQ+UUZ5U9
Jn9HSgZKJDiA8U3S87kzBQEwDQYJKoZIhvcNAQELBQADggEBAGrzJ+8cstmUxQKi
bDfrg/NKcf8Fxj+UxUB+W/kLWfnxtsJzVfCyxfqr0isF3IswXFYu2C/DYH+MJpKn
KQvLMpKmz23IRh6ksbWK5cWDhGUYf5tr9vU3W4hxn3nXL8Oq+mJd1X24kI+cl4bN
if/oa9jtmJBtq8EDPJG/iK0Pd0JCdKMMX3oDIHnZO7t5oLGC/m1qAHOl17/SIXx7
01ch/VYMG5NZi2A9/9NPESaza5PJmiKxDgHdmLR8HY+2jU94JSSGA2KX4TPf9nqR
WxdnLbK6zKx6+4WL9qWhGu6R+7HNPAaKOb7KXEwjV2ekr6FVZneKRFe/XivMk66O
7LluVHo=
-----END CERTIFICATE-----`,
      `-----BEGIN CERTIFICATE-----
MIIGkTCCBXmgAwIBAgIJAM73sA/bbKMmMA0GCSqGSIb3DQEBCwUAMIG0MQswCQYD
VQQGEwJVUzEQMA4GA1UECBMHQXJpem9uYTETMBEGA1UEBxMKU2NvdHRzZGFsZTEa
MBgGA1UEChMRR29EYWRkeS5jb20sIEluYy4xLTArBgNVBAsTJGh0dHA6Ly9jZXJ0
cy5nb2RhZGR5LmNvbS9yZXBvc2l0b3J5LzEzMDEGA1UEAxMqR28gRGFkZHkgU2Vj
dXJlIENlcnRpZmljYXRlIEF1dGhvcml0eSAtIEcyMB4XDTIzMDcyMzA5NDUxM1oX
DTI0MDgwODExMzgxMFowGTEXMBUGA1UEAwwOKi50YmNvbmxpbmUuZ2UwggEiMA0G
CSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDZIn5vwmwskjEDsKckrldqi76fD1ns
wxvIsBTZ4jH6D6OStvXJeauD0Fp5qc4h17lRJ8fqBIhdDMy2QE3T4lMHncXhp/H+
UMyYFrhR8pxA6ZL+Ju26moqJB+JkV4nvzCQ/YetVIRUIhfsVYUt7KEkvGyP7fIvv
FmD5Td4vph9Oaf1bbBqMKN7gSbiSZtX2Ltufs4PPDakCs0FdCQUWM923Hm+akaqH
eZA/orqoZgH6jGaAvJii5OjeNA546ztAsiJ0Ot3RfdvHqERuOEJFVNn5dLVoukQE
2AmLgzpDZf66P6IKVVlE+rRmpq5L7lqksgbWyZ+zoBoGIPep9V8nK8MRAgMBAAGj
ggM+MIIDOjAMBgNVHRMBAf8EAjAAMB0GA1UdJQQWMBQGCCsGAQUFBwMBBggrBgEF
BQcDAjAOBgNVHQ8BAf8EBAMCBaAwOAYDVR0fBDEwLzAtoCugKYYnaHR0cDovL2Ny
bC5nb2RhZGR5LmNvbS9nZGlnMnMxLTcxODUuY3JsMF0GA1UdIARWMFQwSAYLYIZI
AYb9bQEHFwEwOTA3BggrBgEFBQcCARYraHR0cDovL2NlcnRpZmljYXRlcy5nb2Rh
ZGR5LmNvbS9yZXBvc2l0b3J5LzAIBgZngQwBAgEwdgYIKwYBBQUHAQEEajBoMCQG
CCsGAQUFBzABhhhodHRwOi8vb2NzcC5nb2RhZGR5LmNvbS8wQAYIKwYBBQUHMAKG
NGh0dHA6Ly9jZXJ0aWZpY2F0ZXMuZ29kYWRkeS5jb20vcmVwb3NpdG9yeS9nZGln
Mi5jcnQwHwYDVR0jBBgwFoAUQMK9J47MNIMwojPX+2yz8LQsgM4wJwYDVR0RBCAw
HoIOKi50YmNvbmxpbmUuZ2WCDHRiY29ubGluZS5nZTAdBgNVHQ4EFgQUvHA6FQ7m
t46DXh6kF914sJFSoAQwggF/BgorBgEEAdZ5AgQCBIIBbwSCAWsBaQB2AO7N0GTV
2xrOxVy3nbTNE6Iyh0Z8vOzew1FIWUZxH7WbAAABiYIjh7IAAAQDAEcwRQIgJsac
S/sITJJmGlN5a8xZY3YooiRDP8r6iIgwWWm1fdUCIQCigj3b6dwnBIqhLL/moajs
NeUmmVaIV4EhbsCwIiS75QB2AEiw42vapkc0D+VqAvqdMOscUgHLVt0sgdm7v6s5
2IRzAAABiYIjiIUAAAQDAEcwRQIgAXaGO+N0UJGBkiwu09PE6v3EPB160zEmaPeq
1NhVWGwCIQCRioar8aYdDTuYELM4u65s+W3M//hDjPkK3QDMDVN59AB3ANq2v2s/
tbYin5vCu1xr6HCRcWy7UYSFNL2kPTBI1/urAAABiYIjiOoAAAQDAEgwRgIhAJim
T+pePHzLnXo7tivqzSK9QcCiKOBRRbTIse7vP+MwAiEAxQf7eKJI+wNtQ+UUZ5U9
Jn9HSgZKJDiA8U3S87kzBQEwDQYJKoZIhvcNAQELBQADggEBAGrzJ+8cstmUxQKi
bDfrg/NKcf8Fxj+UxUB+W/kLWfnxtsJzVfCyxfqr0isF3IswXFYu2C/DYH+MJpKn
KQvLMpKmz23IRh6ksbWK5cWDhGUYf5tr9vU3W4hxn3nXL8Oq+mJd1X24kI+cl4bN
if/oa9jtmJBtq8EDPJG/iK0Pd0JCdKMMX3oDIHnZO7t5oLGC/m1qAHOl17/SIXx7
01ch/VYMG5NZi2A9/9NPESaza5PJmiKxDgHdmLR8HY+2jU94JSSGA2KX4TPf9nqR
WxdnLbK6zKx6+4WL9qWhGu6R+7HNPAaKOb7KXEwjV2ekr6FVZneKRFe/XivMk66O
7LluVHo=
-----END CERTIFICATE-----`
    ])
  }
  let session: SessionV2
  let cookies
  let deviceTrusted = false
  let loginInfo: LoginResponse
  let otpDevice: OtpDeviceV2 | null = null
  const deviceInfo = generateDeviceInfo(auth?.deviceId ?? null)
  const deviceData = generateDeviceData(deviceInfo)
  if (auth == null || auth.passcode == null) {
    loginInfo = await fetchLoginByPasswordV2({ username: login, password, deviceInfo, deviceData })
    if (loginInfo.secondPhaseRequired) {
      otpDevice = getOtpDevice(loginInfo, true)
      cookies = await fetchCertifyLoginByOtpDeviceV2(await askOtpCodeV2(getOtpLoginCodeTextV2(otpDevice)), loginInfo.transactionId, otpDevice)
    } else {
      otpDevice = getOtpDevice(loginInfo)
      deviceTrusted = true
      cookies = loginInfo.cookies
    }
    const registrationId = await fetchRegisterDeviceV2({ deviceName: deviceInfo.manufacturer, passcode: PASSCODE, deviceId: deviceInfo.deviceId })
    session = {
      cookies,
      auth: {
        username: login,
        passcode: PASSCODE,
        registrationId,
        deviceId: deviceInfo.deviceId
      }
    }
  } else {
    const info = await fetchLoginByPasscodeV2(auth, deviceInfo, deviceData)
    if (info == null) {
      auth.passcode = null
      return await loginV2({ login, password }, auth, false)
    } else {
      loginInfo = info
    }
    if (loginInfo.secondPhaseRequired) {
      otpDevice = getOtpDevice(loginInfo, true)
      cookies = await fetchCertifyLoginByOtpDeviceV2(await askOtpCodeV2(getOtpLoginCodeTextV2(otpDevice)), loginInfo.transactionId, otpDevice)
    } else {
      otpDevice = getOtpDevice(loginInfo)
      deviceTrusted = true
      cookies = loginInfo.cookies
    }
    session = {
      cookies,
      auth
    }
  }
  if (session.auth.deviceId == null) {
    session.auth.deviceId = deviceInfo.deviceId
  }
  const sessionId = await fetchGetSessionIdV2(cookies)
  if (sessionId == null) {
    if (loop) {
      session.auth.passcode = null
      return await loginV2({ login, password }, session.auth, false)
    } else {
      throw new InvalidLoginOrPasswordError('Unauthorized, check login and password')
    }
  }
  if (!deviceTrusted) {
    // untrust before trust to avoid errors
    await fetchUnTrustDeviceV2(deviceData, sessionId, cookies)
    const orderId = await fetchTrustDeviceV2(deviceData, sessionId, cookies)
    const code = await askOtpCodeV2(getOtpTrustCodeTextV2(otpDevice))
    let trustId: string | null = null

    trustId = await fetchConfirmTrustedDeviceV2(code, orderId, cookies)

    if (trustId == null) {
      throw new InvalidOtpCodeError('Device trust failed')
    }

    session.auth.trustedDeviceId = trustId
  }

  return session
}

export async function fetchDepositsV2 (session: SessionV2): Promise<DepositDataV2[]> {
  const result: DepositDataV2[] = []
  const deposits = await fetchApiDepositsV2(session)
  for (const deposit of deposits.items) {
    const id = deposit.id
    const details = await fetchDepositDetailsV2(id, session)
    result.push({
      deposit,
      details
    })
  }
  return result
}

export async function fetchDepositStatementsV2 (id: number, session: SessionV2): Promise<DepositStatementV2[]> {
  return await fetchApiDepositStatementsV2(id, session)
}

export async function fetchLoansV2 (session: SessionV2): Promise<unknown> {
  return await fetchApiLoansV2(session)
}

export async function fetchTransactionsV2 (session: SessionV2, fromDate: Date, data: FetchHistoryV2Data): Promise<TransactionsByDateV2[]> {
  return await fetchHistoryV2(session, fromDate, data)
}

export async function fetchCardsV2 (session: SessionV2): Promise<CardProductV2[]> {
  return await fetchCardsListV2(session)
}

export async function fetchAccountsV2 (session: SessionV2): Promise<CardsAndAccounts> {
  return await fetchCardAndAccountsDashboardV2(session)
}
