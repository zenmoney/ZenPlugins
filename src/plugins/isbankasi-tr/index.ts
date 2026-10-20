import { adjustTransactions } from '../../common/transactionGroupHandler'
import { InvalidOtpCodeError, InvalidPreferencesError, UserInteractionError } from '../../errors'
import { getOptNumber, getOptString } from '../../types/get'
import { ExtendedTransaction, ScrapeFunc } from '../../types/zenmoney'
import { IsBankApi, createDeviceIdentity, getCurrentDeviceProfile } from './api'
import { convertAccounts, convertTransaction } from './converters'
import { AuthSession, CookieStore, DeviceIdentity, Preferences, StoredAuthRejectedError } from './types'

const AUTH_STORAGE_KEY = 'authSession'
const DEVICE_STORAGE_KEY = 'deviceIdentity'
const OTP_TIMEOUT_MS = 180000

export const scrape: ScrapeFunc<Preferences> = async ({
  preferences,
  fromDate,
  toDate,
  isInBackground
}) => {
  ZenMoney.locale = 'tr'
  validatePreferences(preferences)
  const api = await authorize(preferences, isInBackground)
  saveSession(api.getSession())

  const convertedAccounts = convertAccounts(await api.fetchAccounts())
  const accounts = convertedAccounts.map(({ account }) => account)
  const transactions: ExtendedTransaction[] = []
  for (const converted of convertedAccounts) {
    if (ZenMoney.isAccountSkipped(converted.account.id)) continue
    const operations = await api.fetchTransactions(
      converted.fetchParams,
      fromDate,
      toDate ?? new Date()
    )
    for (const operation of operations) {
      transactions.push(convertTransaction(operation, converted.account))
    }
  }
  saveSession(api.getSession())
  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}

async function authorize (preferences: Preferences, isInBackground: boolean): Promise<IsBankApi> {
  const storedValue = ZenMoney.getData(AUTH_STORAGE_KEY)
  const storedSession = parseStoredSession(storedValue)
  if (storedSession !== null) {
    const api = new IsBankApi({
      identity: toIdentity(storedSession),
      session: storedSession
    })
    try {
      await api.refresh()
      return api
    } catch (error) {
      if (!(error instanceof StoredAuthRejectedError)) throw error
      console.info('Stored İşCep authorization was rejected; starting cold authorization', error.context)
      return await coldAuth(preferences, toIdentity(storedSession), isInBackground)
    }
  }

  if (storedValue !== undefined && storedValue !== null) {
    console.info('Stored İşCep authorization has an incompatible format; starting cold authorization', {
      version: getOptNumber(storedValue, 'version'),
      availableKeys: objectKeys(storedValue)
    })
  }
  const identity = parseStoredIdentity(storedValue) ??
    parseStoredIdentity(ZenMoney.getData(DEVICE_STORAGE_KEY)) ??
    createDeviceIdentity()
  return await coldAuth(preferences, identity, isInBackground)
}

async function coldAuth (
  preferences: Preferences,
  identity: DeviceIdentity,
  isInBackground: boolean
): Promise<IsBankApi> {
  const api = new IsBankApi({ identity })
  await api.initialize()
  saveIdentity(identity)
  if (isInBackground) throw new UserInteractionError()
  const firstFactor = await api.passwordVerification(preferences)
  const code = await ZenMoney.readLine('Cep telefonunuza gönderilen doğrulama kodunu girin', {
    inputType: 'number',
    time: OTP_TIMEOUT_MS
  })
  if (code === null || code === undefined || code.trim() === '') throw new InvalidOtpCodeError()
  const session = await api.verifyOtp(code.trim(), firstFactor.astType, firstFactor.accessToken)
  saveSession(session)
  return api
}

function validatePreferences (preferences: Preferences): void {
  const login = preferences.login.trim()
  if (!/^\d{3,9}$/.test(login) && !isValidCitizenId(login)) {
    throw new InvalidPreferencesError('Müşteri numarası veya T.C. kimlik numarası geçersiz.')
  }
  if (!/^\d{6}$/.test(preferences.password)) {
    throw new InvalidPreferencesError('Şifre 6 rakamdan oluşmalıdır.')
  }
  preferences.login = login
}

function isValidCitizenId (value: string): boolean {
  if (!/^[1-9]\d{10}$/.test(value)) return false
  const digits = value.split('').map(Number)
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8]
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7]
  const tenth = ((oddSum * 7 - evenSum) % 10 + 10) % 10
  const eleventh = digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0) % 10
  return digits[9] === tenth && digits[10] === eleventh
}

function saveSession (session: AuthSession): void {
  ZenMoney.setData(AUTH_STORAGE_KEY, session)
  saveIdentity(session, false)
  ZenMoney.saveData()
}

function saveIdentity (identity: DeviceIdentity, flush = true): void {
  ZenMoney.setData(DEVICE_STORAGE_KEY, toIdentity(identity))
  if (flush) ZenMoney.saveData()
}

function parseStoredSession (value: unknown): AuthSession | null {
  const version = getOptNumber(value, 'version')
  if (version !== 1 && version !== 2 && version !== 3) return null
  const identity = parseStoredIdentity(value)
  const accessToken = getOptString(value, 'accessToken')
  const refreshToken = getOptString(value, 'refreshToken')
  const randNo = getOptString(value, 'randNo')
  if (identity === null || !isNonBlank(accessToken) || !isNonBlank(refreshToken)) return null
  return {
    version: 3,
    ...identity,
    accessToken: accessToken as string,
    refreshToken: refreshToken as string,
    ...(isNonBlank(randNo) ? { randNo: randNo as string } : {}),
    cookies: parseCookies(value)
  }
}

function parseStoredIdentity (value: unknown): DeviceIdentity | null {
  const deviceId = getOptString(value, 'deviceId')
  const androidId = getOptString(value, 'androidId')
  const manufacturer = getOptString(value, 'manufacturer')
  const model = getOptString(value, 'model')
  const osVersion = getOptString(value, 'osVersion')
  if (!isNonBlank(deviceId) || !isNonBlank(androidId) || !isNonBlank(model)) return null
  const currentProfile = getCurrentDeviceProfile()
  return {
    deviceId: deviceId as string,
    androidId: androidId as string,
    manufacturer: isNonBlank(manufacturer) ? manufacturer as string : currentProfile.manufacturer,
    model: model as string,
    osVersion: isNonBlank(osVersion) ? osVersion as string : currentProfile.osVersion
  }
}

function parseCookies (value: unknown): CookieStore {
  const cookies: CookieStore = {}
  for (const name of ['JSESSIONID', 'osc', 'f5osc', 'softtechSessionId'] as Array<keyof CookieStore>) {
    const cookie = getOptString(value, `cookies.${name}`)
    if (isNonBlank(cookie)) cookies[name] = cookie
  }
  return cookies
}

function toIdentity (value: DeviceIdentity): DeviceIdentity {
  return {
    deviceId: value.deviceId,
    androidId: value.androidId,
    manufacturer: value.manufacturer,
    model: value.model,
    osVersion: value.osVersion
  }
}

function objectKeys (value: unknown): string[] {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value) : []
}

function isNonBlank (value?: string): boolean {
  return value !== undefined && value.trim() !== ''
}
