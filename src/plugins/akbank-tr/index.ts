import { adjustTransactions } from '../../common/transactionGroupHandler'
import { InvalidOtpCodeError, InvalidPreferencesError, UserInteractionError } from '../../errors'
import { getOptNumber, getOptString } from '../../types/get'
import { ExtendedTransaction, ScrapeFunc } from '../../types/zenmoney'
import { AkbankApi, createDeviceIdentity } from './api'
import { convertAccounts, convertTransaction } from './converters'
import { AuthSession, DeviceIdentity, Preferences } from './types'

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
  console.assert(convertedAccounts.length > 0, 'Akbank returned no accounts')
  const accounts = convertedAccounts.map(({ account }) => account)
  const transactions: ExtendedTransaction[] = []
  for (const converted of convertedAccounts) {
    if (ZenMoney.isAccountSkipped(converted.account.id)) continue
    const operations = await api.fetchTransactions(converted.fetchParams, fromDate, toDate ?? new Date())
    for (const operation of operations) transactions.push(convertTransaction(operation, converted.account))
  }
  saveSession(api.getSession())
  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}

async function authorize (preferences: Preferences, isInBackground: boolean): Promise<AkbankApi> {
  const storedValue = ZenMoney.getData(AUTH_STORAGE_KEY)
  const storedSession = parseStoredSession(storedValue)
  if (storedSession !== null) {
    const api = new AkbankApi({
      identity: toIdentity(storedSession),
      session: storedSession
    })
    await api.hotLogin(preferences.password)
    return api
  }

  if (storedValue !== undefined && storedValue !== null) {
    console.info('Stored Akbank authorization has an incompatible format; starting cold authorization', {
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
): Promise<AkbankApi> {
  if (isInBackground) throw new UserInteractionError()
  const api = new AkbankApi({ identity })
  const firstFactor = await api.beginColdAuth(preferences)
  const code = await ZenMoney.readLine('Cep telefonunuza gönderilen doğrulama kodunu girin', {
    inputType: 'number',
    time: OTP_TIMEOUT_MS
  })
  if (code === null || code === undefined || !/^\d{6}$/.test(code.trim())) throw new InvalidOtpCodeError()
  const session = await api.verifySmsOtp(firstFactor, code.trim())
  saveSession(session)
  return api
}

function validatePreferences (preferences: Preferences): void {
  const login = preferences.login.trim()
  if (!/^\d{3,10}$/.test(login) && !isValidCitizenId(login)) {
    throw new InvalidPreferencesError('Müşteri numarası veya T.C. kimlik numarası geçersiz.')
  }
  if (!/^\d{6}$/.test(preferences.password)) {
    throw new InvalidPreferencesError('Akbank şifresi 6 rakamdan oluşmalıdır.')
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
  ZenMoney.setData(DEVICE_STORAGE_KEY, toIdentity(session))
  ZenMoney.saveData()
}

function parseStoredSession (value: unknown): AuthSession | null {
  if (getOptNumber(value, 'version') !== 1) return null
  const identity = parseStoredIdentity(value)
  const deviceClientId = getOptString(value, 'deviceClientId')
  const tripleDesKey = getOptString(value, 'tripleDesKey')
  const tokenSessionId = getOptString(value, 'tokenSessionId')
  if (identity === null || !isNonBlank(deviceClientId) || !/^[0-9A-Fa-f]{48}$/.test(tripleDesKey ?? '') || !isNonBlank(tokenSessionId)) return null
  return {
    version: 1,
    ...identity,
    deviceClientId: deviceClientId as string,
    tripleDesKey: tripleDesKey as string,
    tokenSessionId: tokenSessionId as string
  }
}

function parseStoredIdentity (value: unknown): DeviceIdentity | null {
  const clientUid = getOptString(value, 'clientUid')
  const model = getOptString(value, 'model')
  if (!/^[0-9A-Fa-f]{16}$/.test(clientUid ?? '') || !isNonBlank(model)) return null
  return { clientUid: clientUid as string, model: model as string }
}

function toIdentity (value: DeviceIdentity): DeviceIdentity {
  return { clientUid: value.clientUid, model: value.model }
}

function objectKeys (value: unknown): string[] {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value) : []
}

function isNonBlank (value?: string): boolean {
  return value !== undefined && value.trim() !== ''
}
