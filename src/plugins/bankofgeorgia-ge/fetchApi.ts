import { fetch } from '../../common/network'
import qs from 'querystring'
import get, { getArray, getNumber, getOptArray, getOptString, getString } from '../../types/get'
import { APP_BUILD, APP_VERSION, Auth, Device, FetchedChecking, FetchedLoanDeposit, OS_VERSION, Preferences, Session } from './models'
import { defaultsDeep } from 'lodash'
import { generateRandomString } from '../../common/utils'
import { formatRFC1123DateTime, signRequest } from './utils'
import { BankMessageError, InvalidLoginOrPasswordError, InvalidOtpCodeError, InvalidPreferencesError } from '../../errors'

interface AccountApiRequest {
  operationName: string
  operationId: string
  query: string
  variables: unknown
  signRequestPrivateKey?: string
  sanitizeRequestLog: unknown
  sanitizeResponseLog: unknown
}

interface SessionData {
  authorizationBearer?: string
  accessToken?: string
  auth: {
    device: Device
    extCustomerId?: string
    extDeviceId?: string
  }
}

async function fetchAccountApi (request: AccountApiRequest, session: SessionData): Promise<unknown> {
  const now = new Date()
  const response = await fetch('https://account-api.bog.ge/account-api-1.0/graphql', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'EN',
      'User-Agent': 'okhttp/4.5.0',
      'Content-Type': 'application/json; charset=utf-8',
      extCustomerId: session.auth.extCustomerId != null ? session.auth.extCustomerId : ' ',
      ExtDeviceId: session.auth.extDeviceId != null ? session.auth.extDeviceId : 'null',
      X_Auth_Token: session.accessToken != null ? session.accessToken : ' ',
      'X-APOLLO-CACHE-DO-NOT-STORE': 'false',
      'X-APOLLO-CACHE-FETCH-STRATEGY': 'NETWORK_ONLY',
      'X-APOLLO-CACHE-KEY': generateRandomString(32, '0123456789abcdef'), // some md5 but doesnt matter
      'X-APOLLO-EXPIRE-AFTER-READ': 'false',
      'X-APOLLO-EXPIRE-TIMEOUT': '0',
      'X-APOLLO-OPERATION-ID': request.operationId,
      'X-APOLLO-OPERATION-NAME': request.operationName,
      'X-APOLLO-PREFETCH': 'false',
      'X-User-Agent': `SSOLib(${APP_VERSION} - ${APP_BUILD})|ANDROID(29)|${session.auth.device.manufacturer} ${session.auth.device.model}`,
      Authorization: `Bearer ${session.authorizationBearer != null ? session.authorizationBearer : 'null'}`,
      ...request.signRequestPrivateKey != null && {
        'X-Date': formatRFC1123DateTime(now),
        'X-Signature': signRequest(request.signRequestPrivateKey, request.variables, now),
        'X-Signature-Version': '1'
      }
    },
    body: {
      operationName: request.operationName,
      query: request.query,
      variables: request.variables
    },
    parse: JSON.parse,
    stringify: JSON.stringify,
    sanitizeRequestLog: defaultsDeep({
      headers: {
        'X-Signature': true,
        extCustomerId: true,
        ExtDeviceId: true,
        X_Auth_Token: true,
        Authorization: true
      }
    }, { body: { variables: request.sanitizeRequestLog } }),
    sanitizeResponseLog: { body: { data: request.sanitizeResponseLog } }
  })
  const errors = getOptArray(response.body, 'errors')
  return errors != null && errors.length > 0 ? errors[0] : get(response.body, 'data')
}

export async function fetchAuth (session: SessionData): Promise<{ authorizationBearer: string }> {
  const response = await fetchAccountApi({
    operationName: 'auth',
    operationId: 'ce6334938ad3bb9c266d76a18cfa4d89308bb49fc5fb56f23ce0cd51d1fa58b8',
    query: 'query auth($channel: String!, $secret: String!) { auth(request: {channel: $channel, channelSecret: $secret}) { __typename token } }',
    variables: { channel: 'MOBILE', secret: '82u1jksj91192!d!n2!k1mc!na?!' },
    sanitizeRequestLog: {},
    sanitizeResponseLog: { auth: { token: true } }
  }, session)
  return { authorizationBearer: getString(response, 'auth.token') }
}

export async function fetchRegisterDevice (data: { publicKey: string },
  session: { authorizationBearer: string, auth: { device: Device } }): Promise<{ extCustomerId: string, extDeviceId: string }> {
  const response = await fetchAccountApi({
    operationName: 'registerDevice',
    operationId: 'ff5339a64bc5356d723573153156783b4fcf9603285998a1e988960d2c5bf1f7',
    query: 'query registerDevice($appVersion: String, $deviceInfo: String, $deviceModel: String, $deviceType: DeviceType, $langCode: Locale, $softVersion: String, $recipientId : String, $devicePublicKey: String, $publicKeyAlgo: String, $deviceId: String) { deviceManagementServices { __typename registerDevice(request: {appVersion: $appVersion, deviceInfo: $deviceInfo, deviceModel: $deviceModel, deviceType: $deviceType, langCode: $langCode, softVersion: $softVersion, recipientId: $recipientId, devicePublicKey: $devicePublicKey, publicKeyAlgo: $publicKeyAlgo, deviceId: $deviceId}) { __typename extCustomerId deviceId } } }',
    variables: {
      appVersion: APP_BUILD,
      deviceInfo: session.auth.device.manufacturer.toLowerCase(),
      deviceModel: session.auth.device.model,
      deviceType: 'ANDROID',
      langCode: 'EN',
      softVersion: OS_VERSION,
      recipientId: '',
      devicePublicKey: data.publicKey,
      publicKeyAlgo: 'ecdsaSignatureMessageX962SHA256'
    },
    sanitizeRequestLog: { devicePublicKey: true },
    sanitizeResponseLog: { deviceManagementServices: { registerDevice: { deviceId: true, extCustomerId: true } } }
  }, session)

  return {
    extCustomerId: getString(response, 'deviceManagementServices.registerDevice.extCustomerId'),
    extDeviceId: getString(response, 'deviceManagementServices.registerDevice.deviceId')
  }
}

export async function fetchLogIn (preferences: Preferences,
  session: { authorizationBearer: string, auth: { device: Device, extCustomerId: string, extDeviceId: string } }): Promise<{ processReference: string }> {
  const response = await fetchAccountApi({
    operationName: 'logInQuery',
    operationId: '698039401e511f1f0be0f0ab9ae296a1612c1074136b8d87051a93e26d810e02',
    query: 'query logInQuery($username: String!, $password: String!, $processReference: String!) { loginServices { __typename login(request: {username: $username, password: $password, processReference: $processReference}) { __typename ...loginInfo } } } fragment loginInfo on LoginResponseContent { __typename isChannelActive isPasswordExpired isUsernameChangeRequired passwordChangeRequired processReference }',
    variables: { username: preferences.login, password: preferences.password, processReference: '' },
    sanitizeRequestLog: { username: true, password: true },
    sanitizeResponseLog: { loginServices: { login: { processReference: true } } }
  }, session)
  const errorKey = getOptString(response, 'extensions.errorKey')
  if (errorKey === 'INVALID_USERNAME_OR_PASSWORD_PASSCODE') {
    throw new InvalidPreferencesError('Enter password and not a 4-digit passcode')
  }
  if (errorKey === 'INVALID_USERNAME_OR_PASSWORD') {
    throw new InvalidLoginOrPasswordError()
  }
  return { processReference: getString(response, 'loginServices.login.processReference') }
}

export interface Contact {
  contact: string
  contactId: string
  contactType: string
}

export async function fetchGetUserContacts ({ processReference }: { processReference: string },
  session: { authorizationBearer: string, auth: { device: Device, extCustomerId: string, extDeviceId: string } }): Promise<Contact[]> {
  const response = await fetchAccountApi({
    operationName: 'getUserContactsQuery',
    operationId: '387a3682993d7f2f3c7724bb8856a6df9c2d68a826c5e36efb1408880f3a96f9',
    query: 'query getUserContactsQuery($processReference: String!, $preSelectedContact: String) { commonServices { __typename getUserContacts(preSelectedContact: $preSelectedContact, processReference:$processReference) { __typename preSelected contact financial id type } } }',
    variables: { processReference },
    sanitizeRequestLog: { processReference: true },
    sanitizeResponseLog: { commonServices: { getUserContacts: { contact: true, id: true } } }
  }, session)
  const contacts = getArray(response, 'commonServices.getUserContacts')
  return contacts.map(contact => {
    return {
      contact: getString(contact, 'contact'),
      contactId: getString(contact, 'id'),
      contactType: getString(contact, 'type')
    }
  })
}

export async function fetchRequestOTP ({
  processReference,
  contact
}: { processReference: string, contact: Contact },
session: { authorizationBearer: string, auth: { device: Device, extCustomerId: string, extDeviceId: string } }): Promise<void> {
  const response = await fetchAccountApi({
    operationName: 'requestOTP',
    operationId: '49d18bf00c84f1d112bd898e88e403807a6342306a99112762772eda4e9568a8',
    query: 'query requestOTP($contact: String, $contactId: String, $contactType: UserContactType, $processReference: String, $manuallyEnteredContact: String, $manuallyEnteredContactType: UserContactType, $scaOperationReference: String) { commonServices { __typename requestOTP(request: {contact: $contact, contactId: $contactId, contactType: $contactType, processReference: $processReference, manuallyEnteredContact: $manuallyEnteredContact, manuallyEnteredContactType: $manuallyEnteredContactType, scaOperationReference: $scaOperationReference}) } }',
    variables: {
      contact: contact.contact,
      contactId: contact.contactId,
      contactType: contact.contactType,
      processReference
    },
    sanitizeRequestLog: { contact: true, contactId: true, processReference: true },
    sanitizeResponseLog: {}
  }, session)
  assert(get(response, 'commonServices.requestOTP') === null, 'unexpected response', response)
}

export async function fetchVerifyOTP ({ smsCode, processReference }: { smsCode: string, processReference: string },
  session: { authorizationBearer: string, auth: { device: Device, extCustomerId: string, extDeviceId: string } }): Promise<void> {
  const response = await fetchAccountApi({
    operationName: 'verifyOTP',
    operationId: 'ae78ed21a250fccae98fc121e940092e49df4c971ea4635aa7070e2b7e066b8f',
    query: 'query verifyOTP($onteTimePassword:String!, $processReference:String!, $relatedCompanyClientKey:String) { commonServices { __typename verifyOTP(request: {oneTimePassword: $onteTimePassword, processReference: $processReference, relatedCompanyClientKey: $relatedCompanyClientKey}) } }',
    variables: { onteTimePassword: smsCode, processReference },
    sanitizeRequestLog: { onteTimePassword: true, processReference: true },
    sanitizeResponseLog: {}
  }, session)
  if (getOptString(response, 'extensions.errorKey') === 'WRONG_OTP') {
    throw new InvalidOtpCodeError()
  }
  assert(get(response, 'commonServices.verifyOTP') === null, 'unexpected response', response)
}

export async function fetchGetToken ({ processReference }: { processReference: string },
  session: { authorizationBearer: string, auth: { device: Device, extCustomerId: string, extDeviceId: string } }): Promise<{ accessToken: string, refreshToken: string }> {
  const response = await fetchAccountApi({
    operationName: 'getTokenQuery',
    operationId: '788f5101a0c55b109d72a9097d38c23955a4435ebb08d7e4e972c3997ee8dcbe',
    query: 'query getTokenQuery($processReference:String!) { loginServices { __typename getToken(processReference: $processReference) { __typename ...token } } } fragment token on TokenResponse { __typename keycloakRefreshToken keycloakToken }',
    variables: { processReference },
    sanitizeRequestLog: { processReference: true },
    sanitizeResponseLog: { loginServices: { getToken: { keycloakToken: true, keycloakRefreshToken: true } } }
  }, session)
  return {
    accessToken: getString(response, 'loginServices.getToken.keycloakToken'),
    refreshToken: getString(response, 'loginServices.getToken.keycloakRefreshToken')
  }
}

export async function fetchSaveUserOnDevice (session: { authorizationBearer: string, accessToken: string, auth: { device: Device, extCustomerId: string, extDeviceId: string } }): Promise<void> {
  const response = await fetchAccountApi({
    operationName: 'saveUserOnDevice',
    operationId: 'da13b80d2e2098e78dc884a6f3b941b8ae7851f7966bb38184531368d625bf5c',
    query: 'query saveUserOnDevice($appVersion: String, $deviceInfo: String, $deviceModel: String, $extCustomerId: String, $fcmToken: String, $signature: String, $softVersion: String) { commonServices { __typename saveUserOnDevice(request: {appVersion: $appVersion, deviceInfo: $deviceInfo, deviceModel: $deviceModel, extCustomerId: $extCustomerId, fcmToken: $fcmToken, signature: $signature, softVersion: $softVersion}) } }',
    variables: {
      appVersion: APP_BUILD,
      deviceInfo: session.auth.device.manufacturer.toLowerCase(),
      deviceModel: session.auth.device.model,
      extCustomerId: session.auth.extCustomerId,
      fcmToken: '',
      signature: null,
      softVersion: OS_VERSION
    },
    sanitizeRequestLog: { extCustomerId: true },
    sanitizeResponseLog: {}
  }, session)
  assert(get(response, 'commonServices.saveUserOnDevice') === null, 'unexpected response', response)
}

export async function fetchGetClientInfo ({ processReference }: { processReference: string },
  session: { authorizationBearer: string, accessToken: string, auth: { device: Device, extCustomerId: string, extDeviceId: string } }): Promise<{ userName: string }> {
  const response = await fetchAccountApi({
    operationName: 'getClientInfo',
    operationId: '7fe2251b1edcfccba5ca134cb37b736b6baa99dac7b7a0489d9920ac07d44dd9',
    query: 'query getClientInfo($processReference: String!) { commonServices { __typename getClientInfo(processReference: $processReference) { __typename address firstName lastName username imageURL profilePictureStatus isDefaultImage clientContacts { __typename id type preSelected financial contact } } } }',
    variables: { processReference },
    sanitizeRequestLog: { processReference: true },
    sanitizeResponseLog: { commonServices: { getClientInfo: true } }
  }, session)

  return { userName: getString(response, 'commonServices.getClientInfo.username') }
}

export async function fetchRefreshToken (refreshToken: string, processReference: string,
  session: { authorizationBearer: string, accessToken: string, auth: { device: Device, extCustomerId: string, extDeviceId: string } }): Promise<{ accessToken: string, refreshToken: string }> {
  const response = await fetchAccountApi({
    operationName: 'refreshToken',
    operationId: '16a1194ff38ca23a8fc2bda9da3b7870e5bb9085b8a668c74fb85a94a3150510',
    query: 'query refreshToken($processReference:String!, $refreshToken:String!) { loginServices { __typename refreshToken(processReference: $processReference, refreshToken: $refreshToken) { __typename ...token } } } fragment token on TokenResponse { __typename keycloakRefreshToken keycloakToken }',
    variables: {
      processReference,
      refreshToken
    },
    sanitizeRequestLog: { processReference: true, refreshToken: true },
    sanitizeResponseLog: { loginServices: { refreshToken: { keycloakToken: true, keycloakRefreshToken: true } } }
  }, session)
  return {
    accessToken: getString(response, 'loginServices.refreshToken.keycloakToken'),
    refreshToken: getString(response, 'loginServices.refreshToken.keycloakRefreshToken')
  }
}

export async function fetchCheckOperation ({ passCode, processReference }: { passCode: string, processReference: string },
  session: { authorizationBearer: string, accessToken: string, auth: { device: Device, extCustomerId: string, extDeviceId: string } }): Promise<{ operationReference: string }> {
  const response = await fetchAccountApi({
    operationName: 'checkOperationQuery',
    operationId: '38b786c096d34d13777447d74ff02b3090959b2c99f033c7269d7deed2e34df5',
    query: 'query checkOperationQuery($operationId: String!, $serviceId: String!, $operationProperties: [InputOperationProperty]!) { scaServices { __typename checkOperation(request: {operationId: $operationId, serviceId: $serviceId, operationProperties: $operationProperties}) { __typename operationReference requireSCA scaAuthCode } } }',
    variables: {
      operationId: '0',
      serviceId: 'LoginServices.setupSecurityParameters',
      operationProperties: [
        {
          propertyKey: 'operationData',
          propertyValue: JSON.stringify({
            biometricAuthRequired: false,
            passcode: passCode,
            processReference
          })
        }
      ]
    },
    sanitizeRequestLog: { operationProperties: { propertyValue: true } },
    sanitizeResponseLog: { scaServices: { checkOperation: { operationReference: true } } }
  }, session)
  return { operationReference: getString(response, 'scaServices.checkOperation.operationReference') }
}

export async function fetchPerformScaQuery ({ smsCode, operationReference }: { smsCode: string, operationReference: string },
  session: { authorizationBearer: string, accessToken: string, auth: { device: Device, extCustomerId: string, extDeviceId: string } }): Promise<{ scaAuthCode: string }> {
  const response = await fetchAccountApi({
    operationName: 'performScaQuery',
    operationId: 'ceec0d6d42552943c3cf93228afc95e33251a66323a71b4d0893144c7ca6e0b3',
    query: 'query performScaQuery($operationReference: String!, $deviceId: String!, $authElements: [InputScaAuthElement]!) { scaServices { __typename performSca(request: {operationReference: $operationReference, deviceId: $deviceId, authElements: $authElements}) } }',
    variables: {
      operationReference,
      deviceId: session.auth.extDeviceId,
      authElements: [{ type: 'OTP', value: smsCode }]
    },
    sanitizeRequestLog: { operationReference: true, deviceId: true, authElements: { value: true } },
    sanitizeResponseLog: { scaServices: { performSca: true } }
  }, session)
  if (getOptString(response, 'extensions.errorKey') === 'UNABLE_TO_PERFORM_SCA') {
    throw new InvalidOtpCodeError()
  }
  return { scaAuthCode: getString(response, 'scaServices.performSca') }
}

export async function fetchSetupSecurityParameters (data: { passCode: string, operationReference: string, processReference: string, scaAuthCode: string },
  session: { authorizationBearer: string, accessToken: string, auth: { device: Device, extCustomerId: string, extDeviceId: string, privateKey: string } }): Promise<{ passcodeAuthToken: string }> {
  const response = await fetchAccountApi({
    operationName: 'setupSecurityParametersQuery',
    operationId: '323ef6c86ca7145d38d033d076ae4b6ae08c0f2a1c090e4e2a2ed348942955c0',
    query: 'query setupSecurityParametersQuery($biometricAuthRequired: Boolean!, $operationId: String, $operationReference: String, $passcode: String, $processReference: String!, $scaAuthCode: String) { loginServices { __typename setupSecurityParameters(request: {biometricAuthRequired: $biometricAuthRequired, operationId: $operationId, operationReference: $operationReference, passcode: $passcode, processReference: $processReference, scaAuthCode: $scaAuthCode}) { __typename ...securityParametersInfo } } } fragment securityParametersInfo on SetupSecurityParametersResponse { __typename biometricAuthToken passcodeAuthToken }',
    variables: {
      biometricAuthRequired: false,
      operationId: '0',
      operationReference: data.operationReference,
      passcode: data.passCode,
      processReference: data.processReference,
      scaAuthCode: data.scaAuthCode
    },
    signRequestPrivateKey: session.auth.privateKey,
    sanitizeRequestLog: { operationReference: true, passcode: true, processReference: true, scaAuthCode: true },
    sanitizeResponseLog: { loginServices: { setupSecurityParameters: { passcodeAuthToken: true, biometricAuthToken: true } } }
  }, session)
  if (getOptString(response, 'extensions.errorKey') === 'USER_IS_LOCKED') {
    throw new BankMessageError(getString(response, 'extensions.errorMessage'))
  }
  return { passcodeAuthToken: getString(response, 'loginServices.setupSecurityParameters.passcodeAuthToken') }
}

export async function fetchGetCustomerDeviceInfoQuery ({ username }: { username: string },
  session: { authorizationBearer: string, auth: { device: Device, extCustomerId: string, extDeviceId: string } }): Promise<void> {
  const response = await fetchAccountApi({
    operationName: 'getCustomerDeviceInfoQuery',
    operationId: '12f333fc5c803b02080fbc6b978c3e66ad6f87213296a66fac6fb5cc5a8ab07e',
    query: 'query getCustomerDeviceInfoQuery($username: String!) { deviceManagementServices { __typename getCustomerDeviceInfo(request: {username: $username}) { __typename isTrusted } } }',
    variables: {
      username
    },
    sanitizeRequestLog: { username: true },
    sanitizeResponseLog: {}
  }, session)
  assert(getString(response, 'deviceManagementServices.getCustomerDeviceInfo.isTrusted') === 'Y', 'device should be trusted')
}

export async function fetchPasscodeLogin (data: { username: string }, session: { auth: Auth, authorizationBearer: string }): Promise<{ processReference: string }> {
  const response = await fetchAccountApi({
    operationName: 'passcodeLoginQuery',
    operationId: 'b63a56186be120a8f8178ca33c8afb8a6a93882f26f2017a966e3ba9d41a2bc4',
    query: 'query passcodeLoginQuery($username:String!, $passcode: String!, $authToken:String!, $deviceId:String!, $processReference: String!) { loginServices { __typename login(request: {username: $username, passcode: $passcode, authToken: $authToken, deviceId: $deviceId, processReference: $processReference}) { __typename ...loginInfo } } } fragment loginInfo on LoginResponseContent { __typename isChannelActive isPasswordExpired isUsernameChangeRequired passwordChangeRequired processReference }',
    variables: {
      username: data.username,
      passcode: session.auth.passCode,
      authToken: session.auth.passcodeAuthToken,
      deviceId: session.auth.extCustomerId,
      processReference: ''
    },
    signRequestPrivateKey: session.auth.privateKey,
    sanitizeRequestLog: { username: true, passcode: true, authToken: true, deviceId: true },
    sanitizeResponseLog: { loginServices: { login: { processReference: true } } }
  }, session)

  return { processReference: getString(response, 'loginServices.login.processReference') }
}

async function fetchApiConnector (serviceId: string, params: Record<string, unknown>,
  session: { accessToken: string, requestIndex: number, auth: { device: Device } }): Promise<unknown> {
  const query = {
    appVersion: APP_BUILD,
    channel: 'MOBILE',
    device: `${session.auth.device.manufacturer} ${session.auth.device.model}`,
    extCustomerId: '',
    keycloakSessionToken: session.accessToken,
    langCode: 'EN',
    os: 'ANDROID',
    osVersion: '29',
    requestIndex: session.requestIndex.toString(),
    serviceId,
    userAddress: '',
    userId: 'MOBILE',
    ...params
  }
  const response = await fetch(`https://ibank.bog.ge/rest/rb?${qs.stringify(query)}`, {
    method: 'GET',
    headers: {
      'User-Agent': 'okhttp/4.5.0'
    },
    parse: JSON.parse,
    sanitizeRequestLog: { url: { query: { keycloakSessionToken: true } } },
    sanitizeResponseLog: { url: { query: { keycloakSessionToken: true } } }
  })
  session.requestIndex++
  return response.body
}

async function fetchOperationsApi (params: Record<string, unknown>,
  session: { accessToken: string, requestIndex: number, auth: { device: Device } }): Promise<unknown> {
  // Convert params to the correct type for qs.stringify
  const query: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value != null) {
      query[key] = String(value)
    }
  }

  const response = await fetch(`https://ibank.bog.ge/rest/operations?${qs.stringify(query)}`, {
    method: 'GET',
    headers: {
      'User-Agent': 'okhttp/4.5.0',
      'Accept-Language': 'EN',
      Cookie: `access_token=${session.accessToken}; valid_token=1`
    },
    parse: JSON.parse,
    sanitizeRequestLog: {
      url: { query: true },
      headers: { Cookie: true }
    },
    sanitizeResponseLog: { body: true }
  })
  session.requestIndex++
  return response.body
}

export async function fetchTriggerLogin (session: { accessToken: string, requestIndex: number, auth: { extCustomerId: string, device: Device } }): Promise<void> {
  const response = await fetchApiConnector('COMMON_TRIGGER_LOGIN_CHANGES', {
    deviceId: session.auth.extCustomerId,
    extCustomerId: session.auth.extCustomerId
  }, session)
  assert(getNumber(response, 'code') === 0, 'unsuccessful login trigger', response)
}

export async function fetchAccountsWithDetails (session: Session): Promise<FetchedChecking[]> {
  const response = await fetchApiConnector('ACCOUNTS_GET_ACCOUNTS_AND_DETAILS', {}, session)
  const accounts = getArray(response, 'result.accounts.accounts')
  const accountsDetails = getArray(response, 'result.details')

  return accounts.map(product => {
    const acctKey = getNumber(product, 'acctKey')
    const details = accountsDetails.find(x => getNumber(x, 'acctKey') === acctKey)
    assert(details != null, 'cant find matching detail with acctKey', acctKey, 'from', accountsDetails)
    return { tag: 'account', product, details, cards: [] }
  })
}

export async function fetchCards (session: Session): Promise<unknown> {
  const response = await fetchApiConnector('CARDS_GET_CARDS_AND_DETAILS', {}, session)
  const cards = get(response, 'result.cards')
  assert(cards != null, 'cant get cards', response)
  return cards
}

export async function fetchDepositsAndBondsWithDetails (session: Session): Promise<FetchedLoanDeposit[]> {
  const response = await fetchApiConnector('COLLECTOR_GET_DEPOSITS_AND_BONDS_DETAILS', {}, session)
  const bonds = getArray(response, 'result.bonds.bonds.bonds')
  const bondsDetails = getArray(response, 'result.bonds.details')
  const deposits = getArray(response, 'result.deposits.deposits')
  const depositsDetails = getArray(response, 'result.deposits.details')

  assert(bonds.length === 0 && bondsDetails.length === 0, 'bond found', bonds, bondsDetails)
  return deposits.map(product => {
    const acctKey = getNumber(product, 'accountKey')
    const details = depositsDetails.find(x => getNumber(x, 'accountKey') === acctKey)
    assert(details != null, 'cant find matching detail with acctKey', acctKey, 'from', depositsDetails)
    return { tag: 'deposit', product, details }
  })
}

export async function fetchLoans (session: Session): Promise<FetchedLoanDeposit[]> {
  const response = await fetchApiConnector('LOANS_GET_LOANS_WITH_DETAILS', {}, session)
  const loans = getArray(response, 'result.loans')
  const loansDetails = getArray(response, 'result.details')
  // assert(loans.length === 0 && details.length === 0, 'loan found', loans, details)
  return loans.map(product => {
    const acctKey = getNumber(product, 'loanKey')
    const details = loansDetails.find(x => getNumber(x, 'loanKey') === acctKey)
    assert(details != null, 'cant find matching detail with acctKey', acctKey, 'from', loansDetails)
    return { tag: 'loan', product, details }
  })
}

export async function fetchAccountOperations (acctKey: string, fromDate: Date, toDate: Date, session: Session): Promise<unknown[]> {
  const batchSize = 25
  let searchAndSort = ''
  const result = []

  const includeFields = [
    'clientKey', 'prodGroup', 'docKey', 'entryId', 'essId', 'operationTitle', 'nominationOriginal',
    'beneficiary', 'docNomination', 'nomination', 'merchantId', 'essServiceId', 'groupImageId',
    'postDate', 'authDate', 'operationDate', 'bonusPoint', 'status', 'canCopy', 'amount', 'ccy',
    'merchantName', 'entryGroupNameId', 'sourceEntryGroup', 'bonusInfo', 'cashbackAmount',
    'productName', 'prodGroup', 'entryType', 'printSwift', 'isInternalOperation', 'transferBankBic',
    'printFormType', 'sourceEntryGroup', 'merchantNameInt', 'counterPartyClient', 'hasTransferBack',
    'cardLastDigits', 'accountKey', 'pfmId', 'pfmCatId', 'pfmCatName', 'pfmParentCatId',
    'pfmParentCatName', 'bonusType', 'bonusRate', 'cashback'
  ].join(',')

  const operationDateTimeLowerBound = fromDate.toISOString()
  const operationDateTimeUpperBound = toDate.toISOString()

  while (true) {
    const params: Record<string, unknown> = {
      accountKeys: acctKey, // comma-separated
      amountLowerBound: 'null',
      amountUpperBound: 'null',
      blocked: 'N',
      cardIds: '',
      includeFields,
      income: 'N',
      limit: batchSize,
      nomination: '',
      operationDateTimeLowerBound,
      operationDateTimeUpperBound,
      outcome: 'N',
      pfmCatIds: '',
      sortFields: 'operationDate,docKey&order=DESC'
    }

    if (searchAndSort !== '') {
      params.searchAndSort = searchAndSort
    }

    let response
    try {
      response = await fetchOperationsApi(params, session)
    } catch (error) {
      console.error('Error fetching operations for account', acctKey, 'page', error)
      throw error
    }

    const operations = getOptArray(response, 'data') ?? []

    if (operations.length === 0) {
      break
    }

    result.push(...operations)

    // Get pagination info from the last operation for the next request
    const previousSearchAndSort = searchAndSort
    if (operations.length > 0) {
      const lastOperation = operations[operations.length - 1]
      const sort = getOptArray(lastOperation, 'sort')
      if ((sort != null) && sort.length >= 3) {
        searchAndSort = `${String(sort[0])},${String(sort[1])},${String(sort[2])}`
      } else {
        // If we can't get proper sort info, stop pagination
        console.warn('No sort information found in last operation, stopping pagination')
        break
      }
    }

    // Check for infinite loop - if searchAndSort hasn't changed, we're stuck
    if (previousSearchAndSort !== '' && searchAndSort === previousSearchAndSort) {
      console.warn('Pagination cursor not advancing, stopping to prevent infinite loop')
      break
    }

    if (operations.length < batchSize) {
      break
    }
  }

  return result
}
