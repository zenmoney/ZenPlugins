import forge from 'node-forge'
import { fetch } from '../../common/network'
import Connection from '../../common/protocols/webSocket'
import { delay, generateUUID } from '../../common/utils'

const APP_VERSION = '2.338.05'
const GRAPHQL_URL = 'https://mobile.pumb.ua/graphql'
const WEB_SOCKET_URL = 'wss://mobile.pumb.ua/ws'
const GRAPHQL_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibW9iaWxlIGFwcCIsImlhdCI6MTY4OTMxODI2Miwic2NvcGUiOlsiYXV0aCIsInNldHRpbmdzLW1ldGFkYXRhIl19.TdQl0F-tudg9-XdnFSyBtT2fopFqtjCNK2tSCNQLkaw'
const WEBSOCKET_TIMEOUT_MS = 30000
const DEPOSIT_HISTORY_PAGE_SIZE = 100
const MAX_DEPOSIT_HISTORY_PAGES = 1000

const AUTHENTICATION_BY_PASSWORD_QUERY = 'mutation AuthenticationByPasswordV2($input: AuthenticationPasswordDataInput!) { authenticationByPasswordV2(input: $input) { __typename ...AuthenticationFieldsV2 } }  fragment AuthenticationFieldsV2 on AuthenticationResponseV2 { __typename token authKey sessionId additionalCheck { __typename ... on AuthenticationOtpAdditionalCheck { correlationId } ... on AuthenticationLivenessAdditionalCheck { correlationId } ... on AuthenticationDiiaAdditionalCheck { correlationId } } launchTransition { __typename ... on ChangePasswordLaunchTransition { __typename } } userType }'
const AUTHENTICATION_BY_BIOMETRY_QUERY = 'mutation AuthenticationByBiometryV2($input: AuthenticationBiometryDataInput!) { authenticationByBiometryV2(input: $input) { __typename ...AuthenticationFieldsV2 } }  fragment AuthenticationFieldsV2 on AuthenticationResponseV2 { __typename token authKey sessionId additionalCheck { __typename ... on AuthenticationOtpAdditionalCheck { correlationId } ... on AuthenticationLivenessAdditionalCheck { correlationId } ... on AuthenticationDiiaAdditionalCheck { correlationId } } launchTransition { __typename ... on ChangePasswordLaunchTransition { __typename } } userType }'
const AUTHENTICATION_OTP_QUERY = 'mutation AuthenticationOtpCheck($input: AuthenticationOtpCheckInput!) { authenticationOtpCheck(input: $input) { __typename ...AuthenticationFields } }  fragment AuthenticationFields on AuthenticationResponse { __typename token authKey sessionId correlationId needOtp launchTransition { __typename ... on ChangePasswordLaunchTransition { __typename } } userType }'
const ACCOUNTS_QUERY = 'query AccountsWithCardsMain($includeCorpCards: Boolean) { accounts(includeCorpCards: $includeCorpCards) { __typename ...AccountWithCardsFields id } externalCards { __typename ...ExternalCardFields token } isCreditAccountOperationsAllowed }  fragment AccountCapabilitiesFields on AccountCapabilities { __typename isIssuanceAvailable }  fragment AccountFields on Account { __typename id productId type number iban currencyCode name balance status overdraftFlag overdraftInfo { __typename agreementId amount useAmount ownMoney } creditInfo { __typename agreementId useAmount sumTotalDebtAmount minPayment paymentDueDate totalCreditLimit ownMoney minPaymentPaid creditAccountStatus } arrested openBankingAccountConsentId fraudInsuranceId capabilities { __typename ...AccountCapabilitiesFields } }  fragment CardCapabilitiesFields on CardCapabilities { __typename isReissueAvailable isClosingAvailable }  fragment CardFields on Card { __typename id accountId productId number expirationDate embossingName type virtual status logo cardLevel backgroundId description capabilities { __typename ...CardCapabilitiesFields } }  fragment PendingCardFields on PendingCard { __typename agreementId accountId cardId deliveryId deliveryService }  fragment AccountWithCardsFields on Account { __typename ...AccountFields cards { __typename ...CardFields id } pendingCards { __typename ...PendingCardFields agreementId } id }  fragment ExternalCardFields on ExternalCard { __typename token number expirationDate description bankId bankName }'
const DEPOSITS_QUERY = 'query DepositsList($isTriggeredByUser: Boolean!) { deposits(isTriggeredByUser: $isTriggeredByUser) { __typename id programId programName displayName maturityDate currencyCode balance interestRate interestAccrued gradient { __typename start end } expirationTermPercentage } }'
const DEPOSITS_ARCHIVE_QUERY = 'query DepositsArchive { depositsArchive { __typename deposits { __typename depositId productName agreementNumber interestRate openDate maturityDate currencyCode lastBalance } } }'
const DEPOSIT_DETAILS_QUERY = 'query DepositDetails($depositId: Long!) { deposit(depositId: $depositId) { __typename depositId programId currencyCode accountId interestIban interestAccountId returnIban returnAccountId programName agreementNumber interestRate profitabilityAmount maturityDate autoprolongationFlag capitalizationFlag balance earlyTerminationAllowedFlag interestAccrued interestPaid manuallyProlongationFlag interestPaymentPeriod prolongationAllowed replenishmentAllowedFlag replenishmentMinAmount replenishmentMaxAmount withdrawalAllowedFlag expirationTermPercentage termMonths displayName } }'
const DEPOSIT_OPERATIONS_HISTORY_QUERY = 'query DepositOperationsHistoryV2($input: DepositOperationsInput!) { depositOperationsHistoryV2(input: $input) { __typename totalCount limit offset items { __typename amount description operationId operationDate processedDate balanceBefore balanceAfter operationType durationDays nextOperationDate prevOperationDate interestRate interestAccuredAmount taxAmount interestPaidAmount debetIban creditIban autoLongationDate taxPaidAmount militaryAmount isAutoProlongationEnabled currencyCode } } }'
const LOANS_QUERY = 'query Loans($input: LoansInput) { loans(input: $input) { __typename ... on ActiveLoanInfo { loanId productName productTypeV2 agreementAmount agreementNumber transitIban currencyCode openDate closeDate totalPaymentAmount nextPaymentAmount nextPaymentDate logoUrl loanStatus actualCloseDate replenishmentProgressInfo { __typename ...ReplenishmentProgressInfoFields } isRefunded } ... on WrittenOffLoanInfo { writtenOffLoanId loanId productName productTypeV2 agreementAmount currencyCode openDate closeDate totalPaymentAmount linkedAccountInfo { __typename id type number iban balance } logoUrl loanStatus paymentDescription fullName taxId actualCloseDate agreementNumber } ... on ActiveLoanInfo { loanId } ... on WrittenOffLoanInfo { writtenOffLoanId } } }  fragment ReplenishmentProgressInfoFields on ReplenishmentProgressInfo { __typename totalTerm passedTerm repaidTerm currentPaymentRepaid totalPaymentRepaid hasCurrentOverdue }'
const LOAN_HISTORY_OPERATIONS_QUERY = 'query LoanHistoryOperations($input: LoanHistoryOperationsInput!) { loanHistoryOperations(input: $input) { __typename loanOperations { __typename isRepaid operationDate termPeriodFrom termPeriodTo paymentAmount dueAmount interestAmount commissionAmount overdueAmount penaltyAmount } totalPaymentAmount totalReplenishmentAmount } }'

const SESSION_EXPIRED_CODES = new Set([
  'AUTH_KEY_EXPIRED',
  'AUTH_KEY_INVALID',
  'EXPIRED_AUTH_KEY',
  'INVALID_AUTH_KEY',
  'SESSION_EXPIRED',
  'TOKEN_EXPIRED',
  'UNAUTHENTICATED'
])

const COMMON_RESPONSE_LOG_MASK = {
  headers: {
    'set-cookie': true,
    'Set-Cookie': true
  },
  body: {
    errors: {
      message: sanitizePersonalDataInText,
      extensions: {
        message: sanitizePersonalDataInText,
        title: sanitizePersonalDataInText
      }
    },
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
      },
      accounts: {
        name: true,
        account_name: true,
        cards: {
          embossingName: true,
          embossing_name: true
        }
      },
      loans: {
        fullName: true,
        full_name: true,
        taxId: true,
        tax_id: true
      }
    }
  }
}

function sanitizePersonalDataInText (value) {
  return typeof value === 'string'
    ? value.replace(/(?:\+?380\d{9}|\b0\d{9}\b)/g, '<phone>')
    : value
}

export class SessionExpiredError extends Error {
  constructor (code, operationName) {
    super(`PUMB rejected persisted authentication state: ${code}`)
    this.name = 'SessionExpiredError'
    this.code = code
    this.operationName = operationName
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
    location: { latitude: 0, longitude: 0 },
    pushToken: ''
  }
}

function getGraphqlError (response) {
  const error = Array.isArray(response?.body?.errors) ? response.body.errors[0] : null
  if (error == null || typeof error !== 'object') {
    return null
  }
  const extension = error.extensions != null && typeof error.extensions === 'object' ? error.extensions : null
  const originalError = extension?.originalError != null && typeof extension.originalError === 'object'
    ? extension.originalError
    : null
  const code = [extension?.code, extension?.errorCode, originalError?.code, error.code]
    .find(value => typeof value === 'string' && value)
  const message = [error.message, extension?.message, extension?.title]
    .find(value => typeof value === 'string' && value)
  return {
    code: typeof code === 'string' ? code.toUpperCase() : null,
    message: typeof message === 'string' ? message : null
  }
}

function makeHttpError (response, operationName, graphqlError) {
  const message = sanitizePersonalDataInText(graphqlError?.message || `PUMB returned HTTP ${response.status}`)
  const error = new Error(message)
  error.code = graphqlError?.code || null
  error.httpStatus = response.status
  error.operationName = operationName
  return error
}

function throwGraphqlError (response, operationName) {
  const graphqlError = getGraphqlError(response)
  if (graphqlError?.code && SESSION_EXPIRED_CODES.has(graphqlError.code)) {
    throw new SessionExpiredError(graphqlError.code, operationName)
  }
  if (response.status < 200 || response.status >= 300 || graphqlError) {
    throw makeHttpError(response, operationName, graphqlError)
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
        : { Authorization: `Bearer ${auth.token}`, 'Session-ID': auth.sessionId },
      ...deviceId ? { 'Device-ID': deviceId } : {},
      Lang: 'UK'
    },
    body: { operationName, variables, query },
    stringify: JSON.stringify,
    parse: body => body === '' ? undefined : JSON.parse(body),
    sanitizeRequestLog: {
      headers: {
        'Api-Key': true,
        Authorization: true,
        authorization: true,
        Cookie: true,
        cookie: true,
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
            deviceData: { deviceHardwareId: true }
          }
        }
      }
    },
    sanitizeResponseLog: COMMON_RESPONSE_LOG_MASK
  })

  throwGraphqlError(response, operationName)
  console.assert(response.body?.data != null, 'PUMB returned an empty GraphQL response', {
    operationName,
    status: response.status,
    hasBody: response.body != null
  })
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
    variables: { input: { ...makeAuthenticationInput(login, device), password: forge.util.encode64(password) } }
  })
  return data.authenticationByPasswordV2
}

export async function fetchAuthenticationByBiometry (login, authKey, device) {
  const data = await fetchGraphql({
    operationName: 'AuthenticationByBiometryV2',
    query: AUTHENTICATION_BY_BIOMETRY_QUERY,
    variables: { input: { ...makeAuthenticationInput(login, device), authKey } }
  })
  return data.authenticationByBiometryV2
}

export async function fetchAuthenticationOtp (login, otp, correlationId, device) {
  const data = await fetchGraphql({
    operationName: 'AuthenticationOtpCheck',
    query: AUTHENTICATION_OTP_QUERY,
    variables: { input: { login, deviceId: device.deviceId, correlationId, otp } }
  })
  return data.authenticationOtpCheck
}

function assertArray (value, operationName, fieldName) {
  console.assert(Array.isArray(value), 'PUMB GraphQL field must be an array', {
    operationName,
    fieldName,
    actualType: value == null ? String(value) : typeof value
  })
  return value
}

export async function fetchAccounts (auth) {
  const data = await fetchGraphql({
    operationName: 'AccountsWithCardsMain',
    query: ACCOUNTS_QUERY,
    variables: { includeCorpCards: true }
  }, auth)
  return assertArray(data.accounts, 'AccountsWithCardsMain', 'accounts')
}

export async function fetchDeposits (auth) {
  const data = await fetchGraphql({
    operationName: 'DepositsList',
    query: DEPOSITS_QUERY,
    variables: { isTriggeredByUser: false }
  }, auth)
  return assertArray(data.deposits, 'DepositsList', 'deposits')
}

export async function fetchDepositsArchive (auth) {
  const data = await fetchGraphql({
    operationName: 'DepositsArchive',
    query: DEPOSITS_ARCHIVE_QUERY,
    variables: {}
  }, auth)
  return assertArray(data.depositsArchive?.deposits, 'DepositsArchive', 'depositsArchive.deposits')
}

export async function fetchDepositDetails (auth, depositId) {
  const data = await fetchGraphql({
    operationName: 'DepositDetails',
    query: DEPOSIT_DETAILS_QUERY,
    variables: { depositId }
  }, auth)
  console.assert(data.deposit != null && typeof data.deposit === 'object', 'PUMB deposit details are missing', {
    depositId,
    actualType: data.deposit == null ? String(data.deposit) : typeof data.deposit
  })
  return data.deposit
}

export async function fetchDepositOperationsPage (auth, depositId, limit, offset) {
  const data = await fetchGraphql({
    operationName: 'DepositOperationsHistoryV2',
    query: DEPOSIT_OPERATIONS_HISTORY_QUERY,
    variables: { input: { limit, offset, depositId } }
  }, auth)
  const page = data.depositOperationsHistoryV2
  console.assert(page != null && typeof page === 'object', 'PUMB deposit history page is missing', {
    depositId,
    offset,
    actualType: page == null ? String(page) : typeof page
  })
  assertArray(page.items, 'DepositOperationsHistoryV2', 'depositOperationsHistoryV2.items')
  console.assert(Number.isInteger(page.totalCount) && page.totalCount >= 0, 'PUMB deposit history total count is invalid', {
    depositId,
    offset,
    totalCount: page.totalCount
  })
  return page
}

export async function fetchDepositOperations (auth, depositId) {
  const items = []
  for (let pageNumber = 0; pageNumber < MAX_DEPOSIT_HISTORY_PAGES; pageNumber++) {
    const offset = items.length
    const page = await fetchDepositOperationsPage(auth, depositId, DEPOSIT_HISTORY_PAGE_SIZE, offset)
    items.push(...page.items)
    if (items.length >= page.totalCount) {
      console.assert(items.length === page.totalCount, 'PUMB deposit history page exceeded total count', {
        depositId,
        itemsCount: items.length,
        totalCount: page.totalCount
      })
      return items
    }
    console.assert(page.items.length > 0, 'PUMB deposit history pagination did not advance', {
      depositId,
      offset,
      totalCount: page.totalCount
    })
  }
  console.assert(false, 'PUMB deposit history exceeded the pagination limit', {
    depositId,
    itemsCount: items.length,
    pageLimit: MAX_DEPOSIT_HISTORY_PAGES
  })
}

export async function fetchLoans (auth) {
  const data = await fetchGraphql({
    operationName: 'Loans',
    query: LOANS_QUERY,
    variables: { input: null }
  }, auth)
  return assertArray(data.loans, 'Loans', 'loans')
}

export async function fetchLoanOperations (auth, loanId) {
  const data = await fetchGraphql({
    operationName: 'LoanHistoryOperations',
    query: LOAN_HISTORY_OPERATIONS_QUERY,
    variables: { input: { loanId } }
  }, auth)
  const history = data.loanHistoryOperations
  console.assert(history != null && typeof history === 'object', 'PUMB loan history is missing', {
    loanId,
    actualType: history == null ? String(history) : typeof history
  })
  return assertArray(history.loanOperations, 'LoanHistoryOperations', 'loanHistoryOperations.loanOperations')
}

function generateMessageId (sessionId) {
  const id = generateUUID().split('-').join('')
  return sessionId ? `${sessionId}_${id}` : id
}

function padDatePart (value, length = 2) {
  return String(value).padStart(length, '0')
}

function formatOperationsHistoryDate (date) {
  console.assert(date instanceof Date && !Number.isNaN(date.getTime()), 'Could not format an invalid operations history date', {
    valueType: date == null ? String(date) : typeof date
  })
  return `${padDatePart(date.getUTCDate())}.${padDatePart(date.getUTCMonth() + 1)}.${date.getUTCFullYear()}` +
    `T${padDatePart(date.getUTCHours())}:${padDatePart(date.getUTCMinutes())}:${padDatePart(date.getUTCSeconds())}` +
    `.${padDatePart(date.getUTCMilliseconds(), 3)}Z`
}

function getWebSocketProblem (response) {
  const problem = response?.data?.problem
  return typeof problem?.title === 'string' && problem.title ? problem.title : null
}

function abortConnection (connection) {
  if (connection == null) {
    return
  }
  const socket = connection._socket
  connection._socket = null
  connection._callbacks = {}
  if (socket && typeof socket.close === 'function') {
    try {
      socket.close()
    } catch (error) {
      console.warn('Could not abort the PUMB WebSocket', error)
    }
  }
}

function withWebSocketTimeout (promise, operation, connection) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      abortConnection(connection)
      reject(new Error(`PUMB WebSocket timed out while waiting for ${operation}`))
    }, WEBSOCKET_TIMEOUT_MS)
    Promise.resolve(promise).then(
      value => {
        clearTimeout(timer)
        resolve(value)
      },
      error => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

async function sendRequest (request, requestData, device, connection, sanitizeOptions = {}) {
  let response
  for (let attempt = 1; attempt <= 3; attempt++) {
    const messageId = generateMessageId(requestData.session_id)
    const body = {
      data: { device_id: device.deviceId, ...request },
      ...requestData,
      id: messageId,
      lang: 'UK'
    }
    const result = await withWebSocketTimeout(
      connection.send(messageId, { body, ...sanitizeOptions }),
      request?.cz?.functional || 'response',
      connection
    )
    response = result.body
    if (!getWebSocketProblem(response)?.match(/Try (it )?later/i)) {
      break
    }
    if (attempt < 3) {
      await delay(500)
    }
  }
  const problem = getWebSocketProblem(response)
  if (problem) {
    const error = new Error(sanitizePersonalDataInText(problem))
    error.operationName = request?.cz?.functional || null
    throw error
  }
  return response
}

export async function openUnauthenticatedConnection () {
  const connection = new Connection()
  await withWebSocketTimeout(connection.open(WEB_SOCKET_URL), 'connection opening', connection)
  return connection
}

export async function openAuthenticatedConnection (token, deviceId) {
  const connection = new Connection()
  await withWebSocketTimeout(connection.open(WEB_SOCKET_URL, {
    headers: { authorization: token, 'X-DEVICE-ID': deviceId },
    sanitizeRequestLog: { headers: { authorization: true, 'X-DEVICE-ID': true } },
    sanitizeResponseLog: { headers: { 'set-cookie': true, 'Set-Cookie': true } }
  }), 'authenticated connection opening', connection)
  return connection
}

export async function closeConnection (connection) {
  if (connection) {
    await withWebSocketTimeout(connection.close(), 'connection closing', connection)
  }
}

export async function fetchIdentify (connection, device) {
  return sendRequest({
    app_version: APP_VERSION,
    device_data: getWebSocketDeviceData(device),
    hardware_id: device.hardwareID,
    cz: { form_id: '10.authentication', functional: 'INIT', request: 'IDENTIFY', version: 6 }
  }, { type: 'INIT' }, device, connection, {
    sanitizeRequestLog: {
      body: {
        data: {
          device_id: true,
          hardware_id: true,
          device_data: { device_hardware_id: true }
        }
      }
    },
    sanitizeResponseLog: { body: { data: { device_id: true } } }
  })
}

export async function fetchOperationsHistory (connection, auth, accountIds, fromDate) {
  console.assert(Array.isArray(accountIds) && accountIds.length > 0, 'PUMB operation source must contain account IDs', {
    accountIdsType: accountIds == null ? String(accountIds) : typeof accountIds,
    accountIdsCount: Array.isArray(accountIds) ? accountIds.length : null
  })
  const response = await sendRequest({
    current_account_ids: accountIds,
    is_credit_limit_available: true,
    is_offer_credit_limit_available: true,
    date_end: formatOperationsHistoryDate(fromDate),
    cz: { functional: 'OPERATIONS_HISTORY', request: 'GET_OPERATIONS_HISTORY', version: 14 }
  }, { session_id: auth.sessionId, type: 'BUSINESS' }, auth.device, connection, {
    sanitizeRequestLog: {
      body: {
        data: { device_id: true },
        session_id: true
      }
    }
  })
  return assertArray(response?.data?.transactions_history_list, 'GET_OPERATIONS_HISTORY', 'transactions_history_list')
}
