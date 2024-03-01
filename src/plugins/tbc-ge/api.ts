import { Auth, ConvertedProduct, Device, FetchedAccount, FetchedAccounts, OtpDevice, Preferences, Session } from './models'
import {
  fetchAccountsList,
  fetchCertifyLoginByPasscode,
  fetchCertifyLoginBySms,
  fetchConfirmTrustedDevice,
  fetchDashboard,
  fetchDepositDetails,
  fetchDeposits,
  fetchDepositStatements,
  fetchGetLoginSalt,
  fetchGetRequestSalt,
  fetchHistory,
  fetchInitHeaders,
  fetchInitTrustedDevice,
  fetchLoans,
  fetchLoginByPasscode,
  fetchLoginByPassword,
  fetchRegisterDevice
} from './fetchApi'
import { generateRandomString } from '../../common/utils'
import { InvalidOtpCodeError } from '../../errors'
import { getNumber, getString } from '../../types/get'

async function askOtpCode (smsPrefix: string, mode: OtpDevice): Promise<string> {
  const deviceMap: Record<OtpDevice, string> = {
    SMS_OTP: `${smsPrefix}text message (SMS)`,
    TOKEN_GEMALTO: 'TBC Pass App',
    TOKEN_VASCO: 'VASCO token'
  }
  const sms = await ZenMoney.readLine(`Enter verification code from ${deviceMap[mode]}`,
    { inputType: 'number' })
  if (sms == null) {
    throw new InvalidOtpCodeError()
  }
  return sms.trim()
}

function generateDevice (): Device {
  return {
    androidId: generateRandomString(16, '0123456789abcdef'),
    device: ZenMoney.device.model.replace(/\s/g, '_').toLowerCase(), // Build.DEVICE
    manufacturer: ZenMoney.device.manufacturer,
    model: ZenMoney.device.model
  }
}

async function tempPatchClearCookies (): Promise<void> {
  await ZenMoney.clearCookies()
  const cookies = await ZenMoney.getCookies()
  for (const cookie of cookies) {
    await ZenMoney.setCookie(cookie.domain, cookie.name, '')
  }
}

export async function login ({ login, password }: Preferences, auth?: Auth): Promise<Session> {
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

  let session: Session
  const requestSalt = await fetchGetRequestSalt()
  if (auth == null) {
    const device = generateDevice()
    const loginSaltInfo = await fetchGetLoginSalt(login)
    const loginInfo = await fetchLoginByPassword({ login, password },
      {
        loginSalt: loginSaltInfo.salt,
        loginHashMethod: loginSaltInfo.hashMethod,
        requestSalt
      }, device)
    const ibsAccessToken = await fetchCertifyLoginBySms(await askOtpCode('', loginInfo.otpDevice), loginInfo)
    const lightSession = { auth: { device, passcode: generateRandomString(5, '0123456789') }, ibsAccessToken }
    const registrationId = await fetchRegisterDevice(lightSession.auth)
    // /mbs-json/remoting/ endpoints require a JSESSIONID from login, others require it from initHeaders
    await tempPatchClearCookies()
    await fetchInitHeaders(lightSession)
    const tmpSession = { auth: { ...lightSession.auth, registrationId }, ibsAccessToken }

    const trustedInitInfo = await fetchInitTrustedDevice(tmpSession)
    const trustedRegistrationId = await fetchConfirmTrustedDevice(await askOtpCode('the second ', trustedInitInfo.otpDevice), trustedInitInfo, tmpSession)
    session = { auth: { ...tmpSession.auth, trustedRegistrationId }, ibsAccessToken }
  } else {
    const loginInfo = await fetchLoginByPasscode(requestSalt, auth)
    const ibsAccessToken = await fetchCertifyLoginByPasscode(loginInfo, auth)
    session = { auth, ibsAccessToken }
    await tempPatchClearCookies()
    await fetchInitHeaders(session)
  }
  return session
}

export async function fetchAccounts (session: Session): Promise<FetchedAccounts> {
  const accounts = await fetchAccountsList(session)
  const deposits = await fetchDeposits(session)
  const loans = await fetchLoans(session)

  return {
    ...await fetchDashboard(session),
    accounts: [
      ...await Promise.all(accounts.map(async (account): Promise<FetchedAccount> => {
        const accountType = getString(account, 'accountMatrixCategorisations[0]')
        if (accountType === 'DEPOSITS') {
          const externalAccountId = parseInt(getString(account, 'externalAccountId'))
          const depositProduct = deposits.find(x => getNumber(x, 'externalAccountId') === externalAccountId)
          assert(depositProduct != null, 'cant find deposit product', account, deposits)
          const depositId = getNumber(depositProduct, 'id')
          const details = await fetchDepositDetails(depositId, session)
          return { tag: 'deposit', product: account, depositProduct, details }
        } else {
          return { tag: 'account', product: account }
        }
      })),
      ...loans.map((x): {tag: 'loan', product: unknown} => {
        return { tag: 'loan', product: x }
      })]
  }
}

export async function fetchTransactions (
  product: ConvertedProduct,
  fromDate: Date,
  toDate: Date,
  session: Session
): Promise<unknown[]> {
  switch (product.tag) {
    case 'card':
    case 'account':
      return await fetchHistory(product.coreAccountId, session, fromDate, toDate)
    case 'deposit':
      return await fetchDepositStatements(product.depositId, session)
    case 'loan':
      return []
  }
}
