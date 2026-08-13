import forge from 'node-forge'
import {
  InvalidLoginOrPasswordError,
  InvalidOtpCodeError,
  InvalidPreferencesError,
  UserInteractionError
} from '../../errors'
import {
  SessionExpiredError,
  closeConnection,
  fetchAccounts,
  fetchAuthenticationByBiometry,
  fetchAuthenticationByPassword,
  fetchAuthenticationOtp,
  fetchDepositDetails,
  fetchDepositOperations,
  fetchDeposits,
  fetchDepositsArchive,
  fetchIdentify,
  fetchLoanOperations,
  fetchLoans,
  fetchOperationsHistory,
  openAuthenticatedConnection,
  openUnauthenticatedConnection
} from './fetchApi'

export const AUTH_SCHEMA_VERSION = 3

const INVALID_CREDENTIAL_CODES = new Set([
  'INVALID_CREDENTIALS',
  'INVALID_PASSWORD',
  'INVALID_PIN',
  'WRONG_PASSWORD'
])
const INVALID_OTP_CODES = new Set([
  'INVALID_OTP',
  'INVALID_OTP_CODE',
  'OTP_CODE_EXPIRED',
  'OTP_EXPIRED'
])

function asRecord (value) {
  return value != null && typeof value === 'object' ? value : null
}

function getPhoneNumber (value) {
  if (typeof value !== 'string') {
    return null
  }
  const digits = value.trim().replace(/[\s()-]/g, '')
  const nationalMatch = /^0(\d{9})$/.exec(digits)
  if (nationalMatch) {
    return `+380${nationalMatch[1]}`
  }
  const internationalMatch = /^\+?380(\d{9})$/.exec(digits)
  return internationalMatch ? `+380${internationalMatch[1]}` : null
}

export function validatePreferences ({ login, password }) {
  const phone = getPhoneNumber(login)
  if (!phone) {
    throw new InvalidPreferencesError('Введіть коректний номер телефону у форматі 380XXXXXXXXX')
  }
  const pin = typeof password === 'string' ? password.trim() : ''
  if (!/^\d{4}$/.test(pin)) {
    throw new InvalidPreferencesError('PIN-код застосунку ПУМБ має складатися з 4 цифр')
  }
  return { login: phone, password: pin }
}

function getLoginHash (login) {
  return forge.md.sha256.create().update(login).digest().toHex()
}

export function generateDevice (login) {
  return {
    deviceId: '',
    hardwareID: getLoginHash(login).slice(0, 16)
  }
}

function normalizeHardwareId (source, login) {
  const value = source?.hardwareID || source?.hardwareId
  return typeof value === 'string' && value ? value : generateDevice(login).hardwareID
}

function makeColdAuthState (persistedState, login) {
  const storedAuth = asRecord(persistedState?.auth)
  const storedDevice = asRecord(storedAuth?.device) || asRecord(persistedState?.legacyDevice)
  return {
    schemaVersion: AUTH_SCHEMA_VERSION,
    loginHash: getLoginHash(login),
    device: {
      deviceId: '',
      hardwareID: normalizeHardwareId(storedDevice, login)
    },
    authKey: null
  }
}

export function normalizeAuthState (persistedState, login) {
  const source = asRecord(persistedState?.auth)
  const device = asRecord(source?.device)
  const loginHash = getLoginHash(login)
  if (source?.schemaVersion !== AUTH_SCHEMA_VERSION || source.loginHash !== loginHash || device == null) {
    return makeColdAuthState(persistedState, login)
  }
  return {
    schemaVersion: AUTH_SCHEMA_VERSION,
    loginHash,
    device: {
      deviceId: typeof device.deviceId === 'string' ? device.deviceId : '',
      hardwareID: normalizeHardwareId(device, login)
    },
    authKey: typeof source.authKey === 'string' && source.authKey ? source.authKey : null
  }
}

function getErrorCode (error) {
  return typeof error?.code === 'string' ? error.code.toUpperCase() : null
}

function rethrowClassifiedError (error) {
  if (error instanceof InvalidLoginOrPasswordError ||
    error instanceof InvalidOtpCodeError ||
    error instanceof InvalidPreferencesError ||
    error instanceof UserInteractionError ||
    error instanceof SessionExpiredError) {
    throw error
  }
  const code = getErrorCode(error)
  if (error?.operationName === 'AuthenticationByPasswordV2' && code && INVALID_CREDENTIAL_CODES.has(code)) {
    throw new InvalidLoginOrPasswordError('Невірний номер телефону або PIN-код')
  }
  if (error?.operationName === 'AuthenticationOtpCheck' && code && INVALID_OTP_CODES.has(code)) {
    throw new InvalidOtpCodeError('Невірний або прострочений код підтвердження')
  }
  throw error
}

function validateAuthenticationResult (result) {
  console.assert(result != null && typeof result === 'object', 'PUMB authentication result is missing', {
    actualType: result == null ? String(result) : typeof result
  })
  console.assert(result.launchTransition?.__typename !== 'ChangePasswordLaunchTransition', 'PUMB requested an unsupported PIN change', {
    launchTransition: result.launchTransition?.__typename || null,
    userType: result.userType || null
  })
  console.assert(typeof result.token === 'string' && result.token, 'PUMB authentication token is missing', {
    resultType: result.__typename || null,
    hasSessionId: typeof result.sessionId === 'string' && Boolean(result.sessionId),
    additionalCheck: result.additionalCheck?.__typename || null
  })
  console.assert(typeof result.sessionId === 'string' && result.sessionId, 'PUMB authentication session ID is missing', {
    resultType: result.__typename || null,
    hasToken: typeof result.token === 'string' && Boolean(result.token),
    additionalCheck: result.additionalCheck?.__typename || null
  })
  return result
}

async function completeAuthentication (login, device, initialResult, isInBackground) {
  const additionalCheck = initialResult?.additionalCheck
  if (additionalCheck?.__typename === 'AuthenticationOtpAdditionalCheck') {
    console.assert(typeof additionalCheck.correlationId === 'string' && additionalCheck.correlationId,
      'PUMB OTP challenge correlation ID is missing', {
        additionalCheck: additionalCheck.__typename,
        hasCorrelationId: Boolean(additionalCheck.correlationId)
      })
    if (isInBackground) {
      throw new UserInteractionError()
    }
    const otp = await ZenMoney.readLine('Введіть код із SMS від ПУМБ', {
      inputType: 'number',
      time: 120000
    })
    if (otp == null) {
      throw new UserInteractionError()
    }
    const normalizedOtp = otp.trim()
    if (!normalizedOtp) {
      throw new InvalidOtpCodeError('Введіть код підтвердження')
    }
    const result = await fetchAuthenticationOtp(login, normalizedOtp, additionalCheck.correlationId, device)
    return validateAuthenticationResult(result)
  }
  console.assert(additionalCheck == null, 'PUMB returned an unsupported additional authentication check', {
    additionalCheck: additionalCheck?.__typename || null,
    hasCorrelationId: typeof additionalCheck?.correlationId === 'string' && Boolean(additionalCheck.correlationId)
  })
  return validateAuthenticationResult(initialResult)
}

function makeAuthState (previousAuth, result) {
  return {
    schemaVersion: AUTH_SCHEMA_VERSION,
    loginHash: previousAuth.loginHash,
    device: { ...previousAuth.device },
    authKey: typeof result.authKey === 'string' && result.authKey ? result.authKey : previousAuth.authKey
  }
}

function makeSession (authState, result, connection) {
  return {
    connection,
    device: authState.device,
    sessionId: result.sessionId,
    token: result.token,
    authState
  }
}

async function closeConnectionSafely (connection, context) {
  if (!connection) {
    return
  }
  try {
    await closeConnection(connection)
  } catch (error) {
    console.warn(`Could not close the PUMB WebSocket ${context}`, error)
  }
}

export async function coldAuth (preferences, authSeed, isInBackground) {
  const auth = {
    ...authSeed,
    device: {
      deviceId: '',
      hardwareID: authSeed.device.hardwareID
    },
    authKey: null
  }
  let connection
  try {
    connection = await openUnauthenticatedConnection()
    const identity = await fetchIdentify(connection, auth.device)
    const deviceId = identity?.data?.device_id
    console.assert(typeof deviceId === 'string' && deviceId, 'PUMB identify response did not contain a device ID', {
      hasData: identity?.data != null,
      dataKeys: identity?.data != null && typeof identity.data === 'object' ? Object.keys(identity.data) : []
    })
    auth.device.deviceId = deviceId

    if (isInBackground) {
      throw new UserInteractionError()
    }

    const initialResult = await fetchAuthenticationByPassword(preferences.login, preferences.password, auth.device)
    const result = await completeAuthentication(preferences.login, auth.device, initialResult, false)
    const authState = makeAuthState(auth, result)
    console.assert(typeof authState.authKey === 'string' && authState.authKey, 'PUMB cold authentication did not return a reusable auth key', {
      resultType: result.__typename || null,
      userType: result.userType || null
    })
    await closeConnectionSafely(connection, 'after cold authentication')
    connection = null
    const authenticatedConnection = await openAuthenticatedConnection(result.token, auth.device.deviceId)
    return makeSession(authState, result, authenticatedConnection)
  } catch (error) {
    await closeConnectionSafely(connection, 'after a cold authentication error')
    rethrowClassifiedError(error)
  }
}

export async function hotAuth (preferences, auth, isInBackground) {
  try {
    const initialResult = await fetchAuthenticationByBiometry(preferences.login, auth.authKey, auth.device)
    const result = await completeAuthentication(preferences.login, auth.device, initialResult, isInBackground)
    const authState = makeAuthState(auth, result)
    const connection = await openAuthenticatedConnection(result.token, auth.device.deviceId)
    return makeSession(authState, result, connection)
  } catch (error) {
    rethrowClassifiedError(error)
  }
}

export async function login (rawPreferences, isInBackground, persistedState = {}) {
  const preferences = validatePreferences(rawPreferences)
  const auth = normalizeAuthState(persistedState, preferences.login)
  if (auth.authKey && auth.device.deviceId) {
    try {
      return await hotAuth(preferences, auth, isInBackground)
    } catch (error) {
      if (!(error instanceof SessionExpiredError)) {
        throw error
      }
      console.info('PUMB explicitly rejected persisted authentication; starting cold authentication', {
        code: error.code,
        operationName: error.operationName
      })
    }
  }
  return coldAuth(preferences, auth, isInBackground)
}

export async function logout (session) {
  await closeConnectionSafely(session?.connection, 'during logout')
}

export async function fetchProducts (session) {
  const [accounts, activeDeposits, archivedDeposits, loans] = await Promise.all([
    fetchAccounts(session),
    fetchDeposits(session),
    fetchDepositsArchive(session),
    fetchLoans(session)
  ])
  const deposits = await Promise.all(activeDeposits.map(async deposit => {
    console.assert(deposit.id != null, 'PUMB active deposit ID is missing', {
      typename: deposit.__typename || null,
      programId: deposit.programId || null
    })
    const details = await fetchDepositDetails(session, deposit.id)
    return { ...deposit, ...details, id: deposit.id, archived: false }
  }))
  deposits.push(...archivedDeposits.map(deposit => ({ ...deposit, id: deposit.depositId, archived: true })))
  return { accounts, deposits, loans }
}

export async function fetchTransactions (session, fetchParams, fromDate) {
  console.assert(Array.isArray(fetchParams?.sources), 'PUMB transaction fetch parameters are invalid', {
    hasFetchParams: fetchParams != null,
    sourcesType: fetchParams?.sources == null ? String(fetchParams?.sources) : typeof fetchParams.sources
  })
  const result = []
  for (const source of fetchParams.sources) {
    if (source.type === 'account') {
      const items = await fetchOperationsHistory(
        session.connection,
        { sessionId: session.sessionId, device: session.device },
        source.accountIds,
        fromDate
      )
      result.push(...items.map(data => ({ type: 'account', data })))
    } else if (source.type === 'deposit') {
      const items = await fetchDepositOperations(session, source.depositId)
      result.push(...items.map(data => ({ type: 'deposit', depositId: source.depositId, data })))
    } else if (source.type === 'loan') {
      const items = await fetchLoanOperations(session, source.loanId)
      result.push(...items.map(data => ({ type: 'loan', loanId: source.loanId, data })))
    } else {
      console.assert(false, 'PUMB transaction source type is unsupported', {
        sourceType: source?.type == null ? String(source?.type) : String(source.type)
      })
    }
  }
  return result
}
