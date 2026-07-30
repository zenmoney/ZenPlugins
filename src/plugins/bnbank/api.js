import { fetchJson } from '../../common/network'
import { generateRandomString } from '../../common/utils'
import { InvalidOtpCodeError, InvalidPreferencesError, TemporaryError } from '../../errors'

const BASE_URL = 'https://bnb-mobile.bnb.by/'
const APP_VERSION = '1.8.3'
const PAGE_SIZE = 20
const DEVICE_KEY = 'device'
const AUTH_KEY = 'auth'
const TRUSTED_DEVICE_STATUS = 'TRUSTED'
const DEVICE_VERIFICATION_POLICY = 'ALL_SUCCESS'
const DEVICE_VERIFICATION_SUCCESS = 'SUCCESS'
const REFERENCE_DEVICE = Object.freeze({
  manufacturer: 'samsung',
  brand: 'samsung',
  model: 'SM-S948B',
  osVersion: '16',
  buildDisplay: 'S948BXXS4AZG5',
  buildId: 'BP4A.251205.006',
  product: 'm3qxxx',
  device: 'm3q'
})
const REFERENCE_BUILD_FINGERPRINT = `${REFERENCE_DEVICE.manufacturer}/${REFERENCE_DEVICE.product}/${REFERENCE_DEVICE.device}:${REFERENCE_DEVICE.osVersion}/${REFERENCE_DEVICE.buildId}/${REFERENCE_DEVICE.buildDisplay}:user/release-keys`
const REFERENCE_DEVICE_SYSTEM_FEATURES = Object.freeze([
  'android.hardware.audio.output',
  'android.hardware.bluetooth',
  'android.hardware.bluetooth_le',
  'android.hardware.camera',
  'android.hardware.camera.any',
  'android.hardware.camera.autofocus',
  'android.hardware.camera.flash',
  'android.hardware.camera.front',
  'android.hardware.fingerprint',
  'android.hardware.location',
  'android.hardware.location.gps',
  'android.hardware.location.network',
  'android.hardware.microphone',
  'android.hardware.nfc',
  'android.hardware.ram.normal',
  'android.hardware.screen.landscape',
  'android.hardware.screen.portrait',
  'android.hardware.sensor.accelerometer',
  'android.hardware.sensor.barometer',
  'android.hardware.sensor.compass',
  'android.hardware.sensor.gyroscope',
  'android.hardware.sensor.light',
  'android.hardware.sensor.proximity',
  'android.hardware.sensor.stepcounter',
  'android.hardware.sensor.stepdetector',
  'android.hardware.telephony',
  'android.hardware.telephony.gsm',
  'android.hardware.touchscreen',
  'android.hardware.touchscreen.multitouch',
  'android.hardware.touchscreen.multitouch.distinct',
  'android.hardware.touchscreen.multitouch.jazzhand',
  'android.hardware.usb.accessory',
  'android.hardware.usb.host',
  'android.hardware.vulkan.compute',
  'android.hardware.vulkan.level',
  'android.hardware.vulkan.version',
  'android.hardware.wifi',
  'android.hardware.wifi.direct',
  'android.software.app_widgets',
  'android.software.autofill',
  'android.software.backup',
  'android.software.companion_device_setup',
  'android.software.controls',
  'android.software.cts',
  'android.software.device_admin',
  'android.software.home_screen',
  'android.software.ipsec_tunnels',
  'android.software.midi',
  'android.software.picture_in_picture',
  'android.software.print',
  'android.software.secure_lock_screen',
  'android.software.webview',
  'com.google.android.feature.GOOGLE_BUILD',
  'com.google.android.feature.GOOGLE_EXPERIENCE'
])

const invalidPreferenceCodes = new Set([
  'DEVICE_LIMIT_EXCEEDED',
  'INCORRECT_PERSONAL_NUMBER_NOT_RESIDENT',
  'INCORRECT_PERSONAL_NUMBER_RESIDENT',
  'INVALID_DATA',
  'INVALID_RETAIL_USER_ERROR',
  'INVALID_USER_DATA_ERROR',
  'MISSING_RETAIL_USER_ERROR'
])

const invalidOtpCodes = new Set([
  'INCORRECT_OTP',
  'INCORRECT_OTP_LIMIT_EXCEEDED_ERROR',
  'INVALID_OTP',
  'OTP_ATTEMPTS_EXCEEDED',
  'OTP_EXPIRED'
])

const blockedUserCodes = new Set([
  'FRAUD_BLOCKED_ERROR',
  'MISSING_FATCA_DATA_BLOCKED_ERROR',
  'PHOBOS_BLOCKED_ERROR',
  'USER_AGREEMENTS_BLOCKED_ERROR',
  'USER_AML_BLOCKED_ERROR',
  'USER_FRAUD_BLOCKED_ERROR',
  'USER_MANUAL_BLOCKED_ERROR',
  'USER_OTP_BLOCKED_ERROR'
])

export function generateDeviceID () {
  const randomHex = length => generateRandomString(length, 'abcdef0123456789')
  return `${randomHex(8)}-${randomHex(4)}-4${randomHex(3)}-${generateRandomString(1, '89ab')}${randomHex(3)}-${randomHex(12)}`
}

function getDeviceID () {
  let device = ZenMoney.getData(DEVICE_KEY)
  if (!isReferenceDevice(device)) {
    device = createDevice(device)
    ZenMoney.setData(DEVICE_KEY, device)
    ZenMoney.saveData()
  }
  return device.uuid
}

function createDefaultDeviceLocation () {
  return { latitude: '53.900000', longitude: '27.566700' }
}

function isDeviceLocationUsable (location) {
  const latitude = Number(location?.latitude)
  const longitude = Number(location?.longitude)
  return location != null &&
    typeof location === 'object' &&
    typeof location.latitude === 'string' && location.latitude.length > 0 &&
    typeof location.longitude === 'string' && location.longitude.length > 0 &&
    Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 &&
    Number.isFinite(longitude) && longitude >= -180 && longitude <= 180
}

function getDeviceOsVersion () {
  return REFERENCE_DEVICE.osVersion
}

function isReferenceDevice (device) {
  const fingerprint = device?.fingerprint
  return Boolean(device?.uuid && fingerprint &&
    isDeviceLocationUsable(fingerprint.location) &&
    fingerprint.deviceModel === `${REFERENCE_DEVICE.manufacturer} ${REFERENCE_DEVICE.model}` &&
    fingerprint.deviceName === REFERENCE_DEVICE.model &&
    fingerprint.osVersion === REFERENCE_DEVICE.osVersion &&
    fingerprint.locale === 'ru-RU' &&
    fingerprint.deviceDisplayData?.width === '1440' &&
    fingerprint.deviceDisplayData?.height === '3120' &&
    fingerprint.deviceDisplayData?.scale === '3.5' &&
    fingerprint.buildBootLoader === REFERENCE_DEVICE.buildDisplay &&
    fingerprint.buildDisplay === REFERENCE_DEVICE.buildDisplay &&
    fingerprint.buildFingerprint === REFERENCE_BUILD_FINGERPRINT &&
    fingerprint.buildId === REFERENCE_DEVICE.buildId &&
    fingerprint.buildRadio === REFERENCE_DEVICE.buildDisplay &&
    fingerprint.buildManufacturer === REFERENCE_DEVICE.manufacturer &&
    Array.isArray(fingerprint.systemFeatures) && fingerprint.systemFeatures.length > 0)
}

function createDevice (savedDevice) {
  savedDevice = savedDevice || {}
  const savedFingerprint = savedDevice?.fingerprint || {}
  const { manufacturer, model, osVersion, buildDisplay, buildId } = REFERENCE_DEVICE

  return {
    uuid: savedDevice.uuid || generateDeviceID(),
    fingerprint: {
      location: isDeviceLocationUsable(savedFingerprint.location)
        ? savedFingerprint.location
        : createDefaultDeviceLocation(),
      deviceModel: `${manufacturer} ${model}`,
      deviceName: model,
      deviceId: savedFingerprint.deviceId || generateRandomString(16, 'abcdef0123456789'),
      locale: 'ru-RU',
      timeZone: '180',
      osName: 'Android',
      osVersion,
      deviceDisplayData: {
        width: '1440',
        height: '3120',
        scale: '3.5'
      },
      buildBootLoader: buildDisplay,
      buildDisplay,
      buildFingerprint: REFERENCE_BUILD_FINGERPRINT,
      buildId,
      buildRadio: buildDisplay,
      buildManufacturer: manufacturer,
      systemFeatures: [...REFERENCE_DEVICE_SYSTEM_FEATURES],
      simInfo: typeof savedFingerprint.simInfo === 'string' ? savedFingerprint.simInfo : '',
      adsUUID: savedFingerprint.adsUUID || generateDeviceID()
    }
  }
}

function getDeviceFingerprint () {
  getDeviceID()
  return ZenMoney.getData(DEVICE_KEY).fingerprint
}

function getUserAgent () {
  return `Android/GOOGLE/${getDeviceOsVersion()}/${REFERENCE_DEVICE.brand}/${REFERENCE_DEVICE.model}/${APP_VERSION}`
}

function getErrorMessage (response) {
  return response.body?.userMessage || response.body?.message || response.statusText || `HTTP ${response.status}`
}

function throwApiError (response, url, context) {
  const code = response.body?.code || response.body?.serverCode || response.body?.errorCode
  const bankMessage = getErrorMessage(response)
  const message = `Ответ банка: ${bankMessage}`

  if ([
    'user/v1/auth/otp/validation',
    'user/v1/devices/verification/phone',
    'user/v1/users/otp/validation'
  ].includes(url) && invalidOtpCodes.has(code)) {
    throw new InvalidOtpCodeError(message)
  }
  if (url === 'user/v1/auth/otp' && code === 'INCORRECT_PHONE_ERROR') {
    throw new InvalidPreferencesError(message)
  }
  if (url === 'user/v1/auth' && invalidPreferenceCodes.has(code)) {
    throw new InvalidPreferencesError(message)
  }
  if (blockedUserCodes.has(code)) {
    throw new TemporaryError('BNB Iskra заблокировал доступ к данным. Откройте приложение Iskra и выполните указанные там действия или обратитесь в поддержку BNB, затем повторите синхронизацию.')
  }
  if (code === 'DEVICE_VERIFICATION_TIMEOUT') {
    throw new TemporaryError('Время подтверждения доверенного устройства истекло. Повторите синхронизацию и запросите новый SMS-код.')
  }
  throw new TemporaryError(`${context}. ${message}`)
}

async function fetchApi (url, options = {}) {
  const response = await fetchJson(BASE_URL + url.replace(/^\//, ''), {
    ...options,
    headers: {
      uuid: getDeviceID(),
      time: new Date().toISOString(),
      'accept-language': 'RU',
      'user-agent': getUserAgent(),
      ...options.headers
    },
    sanitizeRequestLog: {
      ...options.sanitizeRequestLog,
      headers: {
        Authorization: true,
        ...options.sanitizeRequestLog?.headers
      },
      body: {
        ...options.sanitizeRequestLog?.body
      }
    }
  })

  return response
}

async function fetchApiJson (url, options, context) {
  let response = await fetchApi(url, options)
  if (response.status === 401 && options?.headers?.Authorization) {
    const savedAuth = ZenMoney.getData(AUTH_KEY)
    const refreshedAuth = savedAuth?.refreshToken && await refreshAuth(savedAuth.refreshToken)
    if (refreshedAuth) {
      storeAuth({ ...savedAuth, ...refreshedAuth })
      response = await fetchApi(url, {
        ...options,
        headers: {
          ...options.headers,
          ...authHeaders(refreshedAuth.accessToken)
        }
      })
    } else {
      clearAuth()
    }
  }
  if (!response.ok) {
    throwApiError(response, url, context)
  }
  return response.body
}

function normalizePhone (value) {
  let phone = String(value || '').replace(/[^+\d]/g, '')
  if (/^\d{9}$/.test(phone)) {
    phone = `+375${phone}`
  } else if (/^375\d{9}$/.test(phone)) {
    phone = `+${phone}`
  }
  if (!/^\+\d{7,15}$/.test(phone)) {
    throw new InvalidPreferencesError('Введите номер телефона Iskra в международном формате, например +375000000000.')
  }
  return phone
}

function normalizeIdentificationNumber (value) {
  const identificationNumber = String(value || '').replace(/\s/g, '').toUpperCase()
  if (!identificationNumber) {
    throw new InvalidPreferencesError('Введите личный номер резидента РБ или номер паспорта нерезидента.')
  }
  return identificationNumber
}

function clearAuth () {
  ZenMoney.setData(AUTH_KEY, null)
  ZenMoney.saveData()
}

function storeAuth ({ accessToken, refreshToken, deviceTrustStatus }) {
  if (!accessToken || !refreshToken) {
    throw new TemporaryError('Банк вернул неполные данные авторизации. Повторите синхронизацию позже.')
  }
  ZenMoney.setData(AUTH_KEY, { accessToken, refreshToken, deviceTrustStatus })
  ZenMoney.saveData()
}

async function refreshAuth (refreshToken) {
  const response = await fetchApi('user/v1/oauth/refresh', {
    method: 'POST',
    body: { refreshToken },
    sanitizeRequestLog: { body: { refreshToken: true } },
    sanitizeResponseLog: { body: { accessToken: true, refreshToken: true } }
  })
  if (!response.ok) {
    return null
  }
  return response.body?.accessToken && response.body?.refreshToken ? response.body : null
}

async function requestOtp (phone) {
  return fetchApiJson('user/v1/auth/otp', {
    method: 'POST',
    body: { phone },
    sanitizeRequestLog: { body: { phone: true } },
    sanitizeResponseLog: { body: { secret: true, recipient: true } }
  }, 'Не удалось запросить код подтверждения')
}

async function validateOtp (secret, otp) {
  return fetchApiJson('user/v1/auth/otp/validation', {
    method: 'POST',
    body: { secret, otp },
    sanitizeRequestLog: { body: { secret: true, otp: true } },
    sanitizeResponseLog: { body: { secret: true } }
  }, 'Не удалось подтвердить код')
}

async function authenticate (secret, identificationNumber, isResident) {
  return fetchApiJson('user/v1/auth', {
    method: 'POST',
    body: { secret, identificationNumber, isResident },
    sanitizeRequestLog: { body: { secret: true, identificationNumber: true } },
    sanitizeResponseLog: {
      body: {
        authData: {
          accessToken: true,
          refreshToken: true,
          userData: true
        },
        msiData: { secret: true }
      }
    }
  }, 'Не удалось войти в Iskra')
}

function authHeaders (accessToken) {
  const currentAccessToken = ZenMoney.getData(AUTH_KEY)?.accessToken || accessToken
  return { Authorization: `Bearer ${currentAccessToken}` }
}

function storeDeviceTrustStatus (deviceTrustStatus) {
  const savedAuth = ZenMoney.getData(AUTH_KEY)
  if (!savedAuth?.accessToken || !savedAuth.refreshToken) {
    throw new TemporaryError('Не удалось сохранить состояние доверенного устройства. Повторите синхронизацию позже.')
  }
  storeAuth({ ...savedAuth, deviceTrustStatus })
}

async function requestDeviceVerification (accessToken) {
  return fetchApiJson('user/v1/devices/verification', {
    method: 'POST',
    headers: authHeaders(accessToken)
  }, 'Не удалось проверить состояние доверенного устройства')
}

async function requestDeviceVerificationOtp (accessToken, stepType) {
  return fetchApiJson(`user/v1/devices/verification/${stepType.toLowerCase()}/otp`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    sanitizeResponseLog: { body: { secret: true, recipient: true } }
  }, 'Не удалось запросить код подтверждения доверенного устройства')
}

async function validateDeviceVerificationStep (accessToken, stepType, secret, otp) {
  return fetchApiJson(`user/v1/devices/verification/${stepType.toLowerCase()}`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: { secret, otp },
    sanitizeRequestLog: { body: { secret: true, otp: true } }
  }, 'Не удалось подтвердить доверенное устройство')
}

function validateDeviceVerificationResponse (verification) {
  if (!verification || typeof verification !== 'object' ||
    verification.policy !== DEVICE_VERIFICATION_POLICY ||
    !Array.isArray(verification.steps) ||
    typeof verification.status !== 'string') {
    throw new TemporaryError('Банк вернул некорректное состояние подтверждения доверенного устройства. Повторите синхронизацию позже.')
  }
  return verification
}

async function ensureDeviceVerification (accessToken, deviceTrustStatus) {
  if (deviceTrustStatus === TRUSTED_DEVICE_STATUS) return

  let verification = validateDeviceVerificationResponse(await requestDeviceVerification(accessToken))
  if (verification.status === DEVICE_VERIFICATION_SUCCESS) {
    storeDeviceTrustStatus(TRUSTED_DEVICE_STATUS)
    return
  }
  if (verification.status !== 'IN_PROGRESS') {
    throw new TemporaryError(`Банк вернул неподдерживаемое состояние подтверждения устройства: ${verification.status}.`)
  }

  const enabledSteps = verification.steps.filter(step => step?.status === 'ENABLED')
  if (enabledSteps.length === 0) {
    throw new TemporaryError('Банк не вернул доступный способ подтверждения доверенного устройства.')
  }

  for (const step of enabledSteps) {
    if (step.type !== 'PHONE') {
      throw new TemporaryError(`Банк запросил неподдерживаемый способ подтверждения устройства: ${step.type || 'UNKNOWN'}.`)
    }
    const otpRequest = await requestDeviceVerificationOtp(accessToken, step.type)
    if (!otpRequest?.secret || otpRequest.validationType !== 'OTP') {
      throw new TemporaryError('Банк вернул неполные данные SMS-подтверждения доверенного устройства.')
    }
    const otp = await ZenMoney.readLine('Введите дополнительный код из SMS от BNB Iskra для подтверждения доверенного устройства', {
      time: Math.max(Number(otpRequest.expiredTime || 0) * 1000, 30000)
    })
    if (!otp) {
      throw new InvalidOtpCodeError('Код подтверждения доверенного устройства не был введен.')
    }
    verification = validateDeviceVerificationResponse(await validateDeviceVerificationStep(
      accessToken,
      step.type,
      otpRequest.secret,
      String(otp).trim()
    ))
  }

  const allStepsSuccessful = verification.steps.length > 0 &&
    verification.steps.every(step => step?.status === DEVICE_VERIFICATION_SUCCESS)
  if (verification.status !== DEVICE_VERIFICATION_SUCCESS || !allStepsSuccessful) {
    throw new TemporaryError('Банк не подтвердил доверенное устройство. Повторите синхронизацию позже.')
  }
  storeDeviceTrustStatus(TRUSTED_DEVICE_STATUS)
}

async function getDeviceFingerprintState (accessToken) {
  return fetchApiJson('user/v1/fingerprint', {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: getDeviceFingerprint(),
    sanitizeRequestLog: {
      body: {
        deviceId: true,
        simInfo: true,
        adsUUID: true
      }
    },
    sanitizeResponseLog: { body: { fingerprintId: true } }
  }, 'Не удалось проверить доверенное устройство')
}

async function requestDeviceFingerprintVerification (accessToken, fingerprintId) {
  return fetchApiJson('user/v1/fingerprint/reference/verification', {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: { fingerprintId },
    sanitizeRequestLog: { body: { fingerprintId: true } },
    sanitizeResponseLog: { body: { secret: true, recipient: true } }
  }, 'Не удалось запросить подтверждение устройства')
}

async function validateDeviceOtp (accessToken, secret, otp) {
  return fetchApiJson('user/v1/users/otp/validation', {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: { secret, otp },
    sanitizeRequestLog: { body: { secret: true, otp: true } },
    sanitizeResponseLog: { body: { secret: true } }
  }, 'Не удалось подтвердить код устройства')
}

async function confirmDeviceFingerprint (accessToken, taskId) {
  await fetchApiJson('user/v1/fingerprint/reference', {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: { taskId },
    sanitizeRequestLog: { body: { taskId: true } }
  }, 'Не удалось зарегистрировать доверенное устройство')
}

async function ensureDeviceFingerprint (accessToken) {
  const fingerprintState = await getDeviceFingerprintState(accessToken)
  if (fingerprintState?.referenceState === 'CONFIRMED') return
  if (fingerprintState?.referenceState !== 'NEED_CREATE_UPDATE' || !fingerprintState.fingerprintId) {
    throw new TemporaryError('Банк вернул неизвестное состояние доверенного устройства. Повторите синхронизацию позже.')
  }

  const verification = await requestDeviceFingerprintVerification(accessToken, fingerprintState.fingerprintId)
  if (!verification?.secret) {
    throw new TemporaryError('Банк вернул неполные данные подтверждения устройства. Повторите синхронизацию позже.')
  }
  let taskId = verification.secret

  if (['OTP', 'EMAIL_OTP'].includes(verification.validationType)) {
    const otp = await ZenMoney.readLine('Введите дополнительный код из SMS от BNB Iskra для регистрации устройства', {
      time: Math.max(Number(verification.expiredTime || 0) * 1000, 30000)
    })
    if (!otp) {
      throw new InvalidOtpCodeError('Код подтверждения устройства не был введен.')
    }
    const otpValidation = await validateDeviceOtp(accessToken, verification.secret, String(otp).trim())
    if (!otpValidation?.secret) {
      throw new TemporaryError('Банк не подтвердил код регистрации устройства. Повторите синхронизацию позже.')
    }
    taskId = otpValidation.secret
  } else if (!['LOCAL', 'HIDDEN'].includes(verification.validationType)) {
    throw new TemporaryError('Банк не поддерживает доступный способ подтверждения устройства.')
  }

  await confirmDeviceFingerprint(accessToken, taskId)
}

/**
 * Creates or refreshes an Iskra bearer session.
 */
export async function login ({ phone, identificationNumber, isResident }) {
  const savedAuth = ZenMoney.getData(AUTH_KEY)
  if (savedAuth?.refreshToken) {
    const refreshedAuth = await refreshAuth(savedAuth.refreshToken)
    if (refreshedAuth) {
      const refreshedSession = { ...savedAuth, ...refreshedAuth }
      storeAuth(refreshedSession)
      await ensureDeviceVerification(refreshedAuth.accessToken, refreshedSession.deviceTrustStatus)
      await ensureDeviceFingerprint(refreshedAuth.accessToken)
      return refreshedAuth.accessToken
    }
    clearAuth()
  }

  phone = normalizePhone(phone)
  identificationNumber = normalizeIdentificationNumber(identificationNumber)
  isResident = isResident !== 'false' && isResident !== false

  const otpRequest = await requestOtp(phone)
  if (!otpRequest?.secret) {
    throw new TemporaryError('Банк вернул неполные данные запроса SMS-кода. Повторите синхронизацию позже.')
  }
  const otp = await ZenMoney.readLine('Введите код из SMS от BNB Iskra', {
    time: Math.max(Number(otpRequest.expiredTime || 0) * 1000, 30000)
  })
  if (!otp) {
    throw new InvalidOtpCodeError('Код из SMS не был введен.')
  }

  const otpValidation = await validateOtp(otpRequest.secret, String(otp).trim())
  if (!otpValidation?.secret) {
    throw new TemporaryError('Банк не подтвердил SMS-код. Повторите синхронизацию позже.')
  }
  const authResponse = await authenticate(otpValidation.secret, identificationNumber, isResident)

  if (authResponse?.actionType !== 'SUCCESS_AUTHENTICATION' || !authResponse.authData) {
    throw new InvalidPreferencesError('Завершите регистрацию или подтверждение личности в приложении BNB Iskra, затем повторите синхронизацию.')
  }

  storeAuth(authResponse.authData)
  await ensureDeviceVerification(authResponse.authData.accessToken, authResponse.authData.deviceTrustStatus)
  await ensureDeviceFingerprint(authResponse.authData.accessToken)
  return authResponse.authData.accessToken
}

/**
 * Fetches the products exposed by Iskra's operations service.
 */
export async function fetchAccounts (accessToken) {
  console.log('>>> Загрузка списка счетов...')
  const products = await fetchApiJson('product-transaction/v1/operations/products', {
    headers: authHeaders(accessToken)
  }, 'Не удалось загрузить список счетов')
  if (!products || typeof products !== 'object' ||
    !Array.isArray(products.cards) ||
    !Array.isArray(products.accounts) ||
    !Array.isArray(products.deposits)) {
    throw new TemporaryError('Банк вернул некорректный список счетов. Повторите синхронизацию позже.')
  }

  let deposits = []
  if (products.deposits?.length > 0) {
    const depositResponse = await fetchApiJson('deposit/v1/deposits/sync', {
      method: 'POST',
      headers: authHeaders(accessToken)
    }, 'Не удалось загрузить данные вкладов')
    if (!Array.isArray(depositResponse?.deposits)) {
      throw new TemporaryError('Банк вернул некорректный список вкладов. Повторите синхронизацию позже.')
    }
    const operationDepositIds = new Set(products.deposits.map(deposit => deposit?.id).filter(Boolean))
    deposits = depositResponse.deposits.filter(deposit => operationDepositIds.has(deposit?.id))
  }

  return {
    cards: products.cards || [],
    checkingAccounts: products.accounts || [],
    deposits
  }
}

function toIskraProductType (account) {
  switch (account.type) {
    case 'card': return 'CARD'
    case 'checking': return 'ACCOUNT'
    case 'deposit': return 'DEPOSIT'
    default: return null
  }
}

/**
 * Fetches every operation in the requested interval using offset pagination.
 */
export async function fetchTransactions (accessToken, accounts, fromDate, toDate = new Date()) {
  console.log('>>> Загрузка списка транзакций...')
  const productTypes = accounts
    .map(account => ({ id: account.id, type: toIskraProductType(account) }))
    .filter(product => product.type)
  if (productTypes.length === 0) {
    return []
  }

  const operations = []
  let totalCount = 0
  do {
    const response = await fetchApiJson('product-transaction/v1/operations', {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: {
        filter: {
          date: {
            till: (toDate || new Date()).toISOString(),
            from: fromDate.toISOString()
          },
          productTypes
        },
        pagination: {
          limit: PAGE_SIZE,
          offset: operations.length
        }
      }
    }, 'Не удалось загрузить операции')
    const responseTotalCount = Number(response?.totalCount)
    if (!Array.isArray(response?.operations) || !Number.isInteger(responseTotalCount) || responseTotalCount < 0) {
      throw new TemporaryError('Банк вернул некорректный список операций. Повторите синхронизацию позже.')
    }
    if (response.operations.length === 0 && responseTotalCount > operations.length) {
      throw new TemporaryError('Банк вернул неполную страницу операций. Повторите синхронизацию позже.')
    }
    operations.push(...response.operations)
    totalCount = responseTotalCount
  } while (operations.length < totalCount)

  console.log(`>>> Загружено ${operations.length} операций.`)
  return operations
}
