import forge from 'node-forge'
import { ParseError } from '../../common/network'
import {
  BankMessageError,
  InvalidOtpCodeError,
  InvalidPreferencesError,
  TemporaryUnavailableError,
  UserInteractionError
} from '../../errors'
import {
  PumbApiError,
  SessionExpiredError,
  closeConnection,
  fetchAccounts as fetchAccountsImpl,
  fetchAuthenticationByBiometry,
  fetchAuthenticationByPassword,
  fetchAuthenticationOtp,
  fetchDeposits,
  fetchIdentify,
  fetchLoans,
  fetchOperationsHistory,
  openAuthenticatedConnection,
  openUnauthenticatedConnection
} from './fetchApi'

const AUTH_DATA_KEY = 'auth'
const AUTH_SCHEMA_VERSION = 2
const LEGACY_DEVICE_DATA_KEY = 'device'

function asRecord (value) {
  return value != null && typeof value === 'object' ? value : null
}

function getPhoneNumber (value) {
  const number = /^(?:\+?380)(\d{9})$/.exec(value.trim())
  return number ? `+380${number[1]}` : null
}

function validatePreferences ({ login, password }) {
  const phone = getPhoneNumber(login)
  if (!phone) {
    throw new InvalidPreferencesError('Неверный номер телефона')
  }
  const pin = password.trim()
  if (!/^\d{4}$/.test(pin)) {
    throw new InvalidPreferencesError('PIN-код приложения ПУМБ должен состоять из 4 цифр')
  }
  return { login: phone, password: pin }
}

export function generateDevice (login) {
  return {
    deviceId: '',
    hardwareID: forge.md.sha256.create().update(login).digest().toHex().slice(0, 16)
  }
}

function normalizeHardwareId (source, login) {
  const value = source?.hardwareID || source?.hardwareId
  return typeof value === 'string' && value ? value : generateDevice(login).hardwareID
}

function normalizeCurrentAuth (value, login) {
  const source = asRecord(value)
  const device = asRecord(source?.device)
  if (source?.schemaVersion !== AUTH_SCHEMA_VERSION || device == null) {
    return null
  }
  return {
    schemaVersion: AUTH_SCHEMA_VERSION,
    device: {
      deviceId: typeof device.deviceId === 'string' ? device.deviceId : '',
      hardwareID: normalizeHardwareId(device, login)
    },
    authKey: typeof source.authKey === 'string' && source.authKey ? source.authKey : null
  }
}

function persistAuth (auth) {
  ZenMoney.setData(AUTH_DATA_KEY, auth)
  ZenMoney.saveData()
}

export function loadAuth (login) {
  const stored = ZenMoney.getData(AUTH_DATA_KEY, null)
  const current = normalizeCurrentAuth(stored, login)
  if (current) {
    persistAuth(current)
    return current
  }

  const storedRecord = asRecord(stored)
  const legacyDevice = asRecord(storedRecord?.device) || asRecord(ZenMoney.getData(LEGACY_DEVICE_DATA_KEY, null))
  const migrated = {
    schemaVersion: AUTH_SCHEMA_VERSION,
    device: {
      deviceId: '',
      hardwareID: normalizeHardwareId(legacyDevice, login)
    },
    authKey: null
  }
  persistAuth(migrated)
  return migrated
}

function getApiErrorMessage (error, fallback) {
  return typeof error?.message === 'string' && error.message ? error.message : fallback
}

function throwUserFacingError (error) {
  if (error instanceof InvalidOtpCodeError ||
    error instanceof InvalidPreferencesError ||
    error instanceof BankMessageError ||
    error instanceof UserInteractionError ||
    error instanceof SessionExpiredError) {
    throw error
  }
  if (error instanceof ParseError) {
    throw new TemporaryUnavailableError('ПУМБ повернув некоректну відповідь')
  }
  if (error instanceof PumbApiError) {
    const message = getApiErrorMessage(error, 'ПУМБ повернув помилку')
    if (error.operationName === 'AuthenticationOtpCheck' && /otp|одноразов|sms|смс|код/i.test(message)) {
      throw new InvalidOtpCodeError(message)
    }
    if (error.operationName === 'AuthenticationByPasswordV2' &&
      /incorrect|invalid|невірн|неправильн|некоректн|password|парол|pin|пін/i.test(message)) {
      throw new InvalidPreferencesError('Неверный номер телефона или PIN-код')
    }
    if (error.status >= 500) {
      throw new TemporaryUnavailableError(message)
    }
    throw new BankMessageError(message)
  }
  throw error
}

function validateAuthenticationResult (result) {
  if (result?.launchTransition?.__typename === 'ChangePasswordLaunchTransition') {
    throw new BankMessageError('ПУМБ вимагає змінити PIN-код')
  }
  if (typeof result?.token !== 'string' || !result.token ||
    typeof result?.sessionId !== 'string' || !result.sessionId) {
    throw new TemporaryUnavailableError('ПУМБ не повернув дані сесії')
  }
  return result
}

async function completeAuthentication (login, device, result) {
  const additionalCheck = result?.additionalCheck
  if (additionalCheck?.__typename === 'AuthenticationOtpAdditionalCheck') {
    const otp = await ZenMoney.readLine('Введите код из SMS от ПУМБ', {
      inputType: 'number',
      time: 120000
    })
    if (otp == null) {
      throw new UserInteractionError()
    }
    if (!otp.trim()) {
      throw new InvalidOtpCodeError('Не введён код из SMS')
    }
    result = await fetchAuthenticationOtp(login, otp.trim(), additionalCheck.correlationId, device)
  } else if (additionalCheck != null) {
    throw new BankMessageError('ПУМБ запросив біометричну перевірку особи. Плагін не має доступу до камери, тому не може завершити цей вхід.')
  }
  return validateAuthenticationResult(result)
}

function applyAuthenticationResult (auth, result) {
  auth.authKey = typeof result.authKey === 'string' && result.authKey ? result.authKey : auth.authKey
  persistAuth(auth)
}

function makeSession (auth, result, connection) {
  return {
    connection,
    device: auth.device,
    sessionId: result.sessionId,
    token: result.token
  }
}

export async function coldAuth (preferences, auth, isInBackground) {
  if (isInBackground) {
    throw new UserInteractionError()
  }

  auth.device.deviceId = ''
  auth.authKey = null
  persistAuth(auth)

  let connection
  try {
    connection = await openUnauthenticatedConnection()
    const identity = await fetchIdentify(connection, { ...auth.device })
    const deviceId = identity?.data?.device_id
    if (typeof deviceId !== 'string' || !deviceId) {
      const message = identity?.data?.settings?.strings?.[0]
      throw new BankMessageError(message?.uk || message?.en || 'ПУМБ не повернув ідентифікатор пристрою')
    }
    auth.device.deviceId = deviceId

    const initialResult = await fetchAuthenticationByPassword(preferences.login, preferences.password, auth.device)
    const result = await completeAuthentication(preferences.login, auth.device, initialResult)
    applyAuthenticationResult(auth, result)
    await closeConnection(connection)
    connection = null
    const authenticatedConnection = await openAuthenticatedConnection(result.token, auth.device.deviceId)
    return makeSession(auth, result, authenticatedConnection)
  } catch (error) {
    try {
      await closeConnection(connection)
    } catch (closeError) {
      console.warn('Could not close PUMB WebSocket after authentication error', closeError)
    }
    throwUserFacingError(error)
  }
}

export async function hotAuth (preferences, auth) {
  try {
    const initialResult = await fetchAuthenticationByBiometry(preferences.login, auth.authKey, auth.device)
    const result = await completeAuthentication(preferences.login, auth.device, initialResult)
    applyAuthenticationResult(auth, result)
    const connection = await openAuthenticatedConnection(result.token, auth.device.deviceId)
    return makeSession(auth, result, connection)
  } catch (error) {
    throwUserFacingError(error)
  }
}

export async function login (rawPreferences, isInBackground) {
  const preferences = validatePreferences(rawPreferences)
  const auth = loadAuth(preferences.login)
  if (auth.authKey && auth.device.deviceId) {
    try {
      return await hotAuth(preferences, auth)
    } catch (error) {
      if (!(error instanceof SessionExpiredError)) {
        throw error
      }
      auth.device.deviceId = ''
      auth.authKey = null
      persistAuth(auth)
    }
  }
  return coldAuth(preferences, auth, isInBackground)
}

export async function logout (session) {
  if (session?.connection) {
    await closeConnection(session.connection)
  }
}

export async function fetchProducts (session) {
  try {
    const [accounts, deposits, loans] = await Promise.all([
      fetchAccountsImpl(session),
      fetchDeposits(session),
      fetchLoans(session)
    ])
    return { accounts, deposits, loans }
  } catch (error) {
    throwUserFacingError(error)
  }
}

export async function fetchTransactions (session, product, fromDate) {
  try {
    return await fetchOperationsHistory(session.connection, {
      sessionId: session.sessionId,
      device: session.device
    }, product, fromDate)
  } catch (error) {
    throwUserFacingError(error)
  }
}
