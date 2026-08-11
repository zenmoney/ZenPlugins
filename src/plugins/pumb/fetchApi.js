import forge from 'node-forge'
import { fetch } from '../../common/network'
import Connection from '../../common/protocols/webSocket'
import { retry } from '../../common/retry'
import { generateUUID } from '../../common/utils'

const APP_VERSION = '2.338.05'
const GRAPHQL_URL = 'https://mobile.pumb.ua/graphql'
const WEB_SOCKET_URL = 'wss://mobile.pumb.ua/ws'
const GRAPHQL_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibW9iaWxlIGFwcCIsImlhdCI6MTY4OTMxODI2Miwic2NvcGUiOlsiYXV0aCIsInNldHRpbmdzLW1ldGFkYXRhIl19.TdQl0F-tudg9-XdnFSyBtT2fopFqtjCNK2tSCNQLkaw'

const AUTHENTICATION_BY_PASSWORD_QUERY = 'mutation AuthenticationByPasswordV2($input: AuthenticationPasswordDataInput!) { authenticationByPasswordV2(input: $input) { __typename ...AuthenticationFieldsV2 } }  fragment AuthenticationFieldsV2 on AuthenticationResponseV2 { __typename token authKey sessionId additionalCheck { __typename ... on AuthenticationOtpAdditionalCheck { correlationId } ... on AuthenticationLivenessAdditionalCheck { correlationId } ... on AuthenticationDiiaAdditionalCheck { correlationId } } launchTransition { __typename ... on ChangePasswordLaunchTransition { __typename } } userType }'
const AUTHENTICATION_BY_BIOMETRY_QUERY = 'mutation AuthenticationByBiometryV2($input: AuthenticationBiometryDataInput!) { authenticationByBiometryV2(input: $input) { __typename ...AuthenticationFieldsV2 } }  fragment AuthenticationFieldsV2 on AuthenticationResponseV2 { __typename token authKey sessionId additionalCheck { __typename ... on AuthenticationOtpAdditionalCheck { correlationId } ... on AuthenticationLivenessAdditionalCheck { correlationId } ... on AuthenticationDiiaAdditionalCheck { correlationId } } launchTransition { __typename ... on ChangePasswordLaunchTransition { __typename } } userType }'
const AUTHENTICATION_OTP_QUERY = 'mutation AuthenticationOtpCheck($input: AuthenticationOtpCheckInput!) { authenticationOtpCheck(input: $input) { __typename ...AuthenticationFields } }  fragment AuthenticationFields on AuthenticationResponse { __typename token authKey sessionId correlationId needOtp launchTransition { __typename ... on ChangePasswordLaunchTransition { __typename } } userType }'
const ACCOUNTS_QUERY = 'query AccountsWithCardsMain($includeCorpCards: Boolean) { accounts(includeCorpCards: $includeCorpCards) { __typename ...AccountWithCardsFields id } externalCards { __typename ...ExternalCardFields token } isCreditAccountOperationsAllowed }  fragment AccountCapabilitiesFields on AccountCapabilities { __typename isIssuanceAvailable }  fragment AccountFields on Account { __typename id productId type number iban currencyCode name balance status overdraftFlag overdraftInfo { __typename agreementId amount useAmount ownMoney } creditInfo { __typename agreementId useAmount sumTotalDebtAmount minPayment paymentDueDate totalCreditLimit ownMoney minPaymentPaid creditAccountStatus } arrested openBankingAccountConsentId fraudInsuranceId capabilities { __typename ...AccountCapabilitiesFields } }  fragment CardCapabilitiesFields on CardCapabilities { __typename isReissueAvailable isClosingAvailable }  fragment CardFields on Card { __typename id accountId productId number expirationDate embossingName type virtual status logo cardLevel backgroundId description capabilities { __typename ...CardCapabilitiesFields } }  fragment PendingCardFields on PendingCard { __typename agreementId accountId cardId deliveryId deliveryService }  fragment AccountWithCardsFields on Account { __typename ...AccountFields cards { __typename ...CardFields id } pendingCards { __typename ...PendingCardFields agreementId } id }  fragment ExternalCardFields on ExternalCard { __typename token number expirationDate description bankId bankName }'
const DEPOSITS_QUERY = 'query DepositsList($isTriggeredByUser: Boolean!) { deposits(isTriggeredByUser: $isTriggeredByUser) { __typename id programId programName displayName maturityDate currencyCode balance interestRate interestAccrued gradient { __typename start end } expirationTermPercentage } }'
const LOANS_QUERY = 'query Loans($input: LoansInput) { loans(input: $input) { __typename ... on ActiveLoanInfo { loanId productName productTypeV2 agreementAmount agreementNumber transitIban currencyCode openDate closeDate totalPaymentAmount nextPaymentAmount nextPaymentDate logoUrl loanStatus actualCloseDate replenishmentProgressInfo { __typename ...ReplenishmentProgressInfoFields } isRefunded } ... on WrittenOffLoanInfo { writtenOffLoanId loanId productName productTypeV2 agreementAmount currencyCode openDate closeDate totalPaymentAmount linkedAccountInfo { __typename id type number iban balance } logoUrl loanStatus paymentDescription fullName taxId actualCloseDate agreementNumber } ... on ActiveLoanInfo { loanId } ... on WrittenOffLoanInfo { writtenOffLoanId } } }  fragment ReplenishmentProgressInfoFields on ReplenishmentProgressInfo { __typename totalTerm passedTerm repaidTerm currentPaymentRepaid totalPaymentRepaid hasCurrentOverdue }'

export class PumbApiError extends Error {
  constructor (message, status, operationName) {
    super(message)
    this.name = 'PumbApiError'
    this.status = status
    this.operationName = operationName
  }
}

export class SessionExpiredError extends PumbApiError {
  constructor (message = 'PUMB authentication session expired', status = 401, operationName = null) {
    super(message, status, operationName)
    this.name = 'SessionExpiredError'
  }
}

function getDeviceModel () {
  return ZenMoney.device?.model || 'ZenMoney Sync'
}

function getOsVersion () {
  return ZenMoney.device?.os?.version || '16'
}

function getWebSocketDeviceData (device) {
  return {
    full_environment: false,
    biometric_authentication_face_id: false,
    biometric_authentication_touch_id: false,
    device_hardware_id: device.hardwareID,
    imei: '',
    device_imprint: '',
    location: {},
    device_model: getDeviceModel(),
    os: 'Android',
    os_version: getOsVersion(),
    push_token: '',
    sims: []
  }
}

function getGraphqlDeviceData (device) {
  return {
    os: 'ANDROID',
    osVersion: getOsVersion(),
    deviceModel: getDeviceModel(),
    name: '',
    biometricAuthenticationFaceId: false,
    biometricAuthenticationTouchId: false,
    imei: '',
    deviceHardwareId: device.hardwareID,
    deviceImprint: '',
    fullEnvironment: false,
    activeCall: false,
    sims: [],
    location: {
      latitude: 0,
      longitude: 0
    },
    pushToken: ''
  }
}

function getGraphqlErrorMessage (response) {
  const error = Array.isArray(response?.body?.errors) ? response.body.errors[0] : null
  const message = error?.message || error?.extensions?.message || error?.extensions?.title
  return typeof message === 'string' && message ? message : null
}

function throwGraphqlError (response, operationName, isPublic) {
  const message = getGraphqlErrorMessage(response)
  const isBiometry = operationName === 'AuthenticationByBiometryV2'
  const isExpired = response.status === 401 || response.status === 403 ||
    /(?:auth(?:entication)?[ _-]?key|session|token).*(?:invalid|expired|невірн|простроч)/i.test(message || '')

  if ((!isPublic && isExpired) || (isBiometry && (response.status >= 400 || message))) {
    throw new SessionExpiredError(message || 'PUMB authentication session expired', response.status, operationName)
  }
  if (response.status < 200 || response.status >= 300 || message) {
    throw new PumbApiError(message || `PUMB returned HTTP ${response.status}`, response.status, operationName)
  }
}

async function fetchGraphql ({ operationName, query, variables }, auth = null) {
  const isPublic = auth == null
  const deviceId = auth?.device?.deviceId || variables?.input?.deviceId
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...isPublic
        ? { 'Api-Key': `Bearer ${GRAPHQL_API_KEY}` }
        : {
            Authorization: `Bearer ${auth.token}`,
            'Session-ID': auth.sessionId
          },
      ...deviceId ? { 'Device-ID': deviceId } : {},
      Lang: 'UK'
    },
    body: {
      operationName,
      variables,
      query
    },
    stringify: JSON.stringify,
    parse: body => body === '' ? undefined : JSON.parse(body),
    sanitizeRequestLog: {
      headers: {
        'Api-Key': true,
        Authorization: true,
        'Device-ID': true,
        'Session-ID': true
      },
      body: {
        variables: {
          input: {
            login: true,
            password: true,
            authKey: true,
            otp: true,
            deviceId: true,
            deviceData: {
              deviceHardwareId: true
            }
          }
        }
      }
    },
    sanitizeResponseLog: {
      body: {
        data: {
          authenticationByPasswordV2: {
            token: true,
            authKey: true,
            sessionId: true
          },
          authenticationByBiometryV2: {
            token: true,
            authKey: true,
            sessionId: true
          },
          authenticationOtpCheck: {
            token: true,
            authKey: true,
            sessionId: true
          }
        }
      }
    }
  })

  throwGraphqlError(response, operationName, isPublic)
  if (response.body?.data == null) {
    throw new PumbApiError('PUMB returned an empty GraphQL response', response.status, operationName)
  }
  return response.body.data
}

function makeAuthenticationInput (login, device) {
  return {
    login,
    deviceId: device.deviceId,
    appVersion: APP_VERSION,
    appType: 'A_PROD',
    deviceData: getGraphqlDeviceData(device)
  }
}

export async function fetchAuthenticationByPassword (login, password, device) {
  const data = await fetchGraphql({
    operationName: 'AuthenticationByPasswordV2',
    query: AUTHENTICATION_BY_PASSWORD_QUERY,
    variables: {
      input: {
        ...makeAuthenticationInput(login, device),
        password: forge.util.encode64(password)
      }
    }
  })
  return data.authenticationByPasswordV2
}

export async function fetchAuthenticationByBiometry (login, authKey, device) {
  const data = await fetchGraphql({
    operationName: 'AuthenticationByBiometryV2',
    query: AUTHENTICATION_BY_BIOMETRY_QUERY,
    variables: {
      input: {
        ...makeAuthenticationInput(login, device),
        authKey
      }
    }
  })
  return data.authenticationByBiometryV2
}

export async function fetchAuthenticationOtp (login, otp, correlationId, device) {
  const data = await fetchGraphql({
    operationName: 'AuthenticationOtpCheck',
    query: AUTHENTICATION_OTP_QUERY,
    variables: {
      input: {
        login,
        deviceId: device.deviceId,
        correlationId,
        otp
      }
    }
  })
  return data.authenticationOtpCheck
}

export async function fetchAccounts (auth) {
  const data = await fetchGraphql({
    operationName: 'AccountsWithCardsMain',
    query: ACCOUNTS_QUERY,
    variables: { includeCorpCards: true }
  }, auth)
  return data.accounts || []
}

export async function fetchDeposits (auth) {
  const data = await fetchGraphql({
    operationName: 'DepositsList',
    query: DEPOSITS_QUERY,
    variables: { isTriggeredByUser: false }
  }, auth)
  return data.deposits || []
}

export async function fetchLoans (auth) {
  const data = await fetchGraphql({
    operationName: 'Loans',
    query: LOANS_QUERY,
    variables: { input: null }
  }, auth)
  return data.loans || []
}

function generateMessageId (sessionId) {
  const id = generateUUID().split('-').join('')
  return sessionId ? `${sessionId}_${id}` : id
}

function padDatePart (value, length = 2) {
  return String(value).padStart(length, '0')
}

function formatOperationsHistoryDate (date) {
  console.assert(date instanceof Date && !Number.isNaN(date.getTime()), 'could not format invalid operations history date')
  return `${padDatePart(date.getUTCDate())}.${padDatePart(date.getUTCMonth() + 1)}.${date.getUTCFullYear()}` +
    `T${padDatePart(date.getUTCHours())}:${padDatePart(date.getUTCMinutes())}:${padDatePart(date.getUTCSeconds())}` +
    `.${padDatePart(date.getUTCMilliseconds(), 3)}Z`
}

function getWebSocketProblem (response) {
  const problem = response?.data?.problem
  return typeof problem?.title === 'string' && problem.title ? problem.title : null
}

async function sendRequest (request, requestData, device, connection, sanitizeOptions = {}) {
  const response = await retry({
    getter: async () => {
      const messageId = generateMessageId(requestData.session_id)
      const body = {
        data: {
          device_id: device.deviceId,
          ...request
        },
        ...requestData,
        id: messageId,
        lang: 'UK'
      }
      const responseBody = (await connection.send(messageId, { body, ...sanitizeOptions })).body
      return getWebSocketProblem(responseBody)?.match(/Try (it )?later/i) ? null : responseBody
    },
    predicate: data => data,
    delayMs: 500,
    maxAttempts: 3
  })
  const problem = getWebSocketProblem(response)
  if (problem) {
    throw new PumbApiError(problem, 200, request?.cz?.functional)
  }
  return response
}

export async function openUnauthenticatedConnection () {
  const connection = new Connection()
  await connection.open(WEB_SOCKET_URL)
  return connection
}

export async function openAuthenticatedConnection (token, deviceId) {
  const connection = new Connection()
  await connection.open(WEB_SOCKET_URL, {
    headers: {
      authorization: token,
      'X-DEVICE-ID': deviceId
    },
    sanitizeRequestLog: {
      headers: {
        authorization: true,
        'X-DEVICE-ID': true
      }
    }
  })
  return connection
}

export async function closeConnection (connection) {
  if (connection) {
    await connection.close()
  }
}

export async function fetchIdentify (connection, device) {
  return sendRequest({
    app_version: APP_VERSION,
    device_data: getWebSocketDeviceData(device),
    hardware_id: device.hardwareID,
    cz: {
      form_id: '10.authentication',
      functional: 'INIT',
      request: 'IDENTIFY',
      version: 6
    }
  }, {
    type: 'INIT'
  }, device, connection, {
    sanitizeRequestLog: {
      body: {
        data: {
          device_id: true,
          hardware_id: true,
          device_data: {
            device_hardware_id: true
          }
        }
      }
    },
    sanitizeResponseLog: {
      body: {
        data: {
          device_id: true
        }
      }
    }
  })
}

export async function fetchOperationsHistory (connection, auth, product, fromDate) {
  const response = await sendRequest({
    current_account_ids: [product.id],
    is_credit_limit_available: true,
    is_offer_credit_limit_available: true,
    date_end: formatOperationsHistoryDate(fromDate),
    cz: {
      functional: 'OPERATIONS_HISTORY',
      request: 'GET_OPERATIONS_HISTORY',
      version: 14
    }
  }, {
    session_id: auth.sessionId,
    type: 'BUSINESS'
  }, auth.device, connection, {
    sanitizeRequestLog: {
      body: {
        data: {
          device_id: true
        },
        session_id: true
      }
    }
  })
  return response?.data?.transactions_history_list || []
}
