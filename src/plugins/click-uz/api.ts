import { Auth, FetchedAccounts, Preferences, Product } from './models'
import { ClickApiError, fetchConfirmRegister, fetchDeviceRegister, fetchGetBalance, fetchGetCards, fetchHistory, fetchLogin, getAuthToken, SessionExpiredError } from './fetchApi'
import { InvalidOtpCodeError, InvalidPreferencesError, TemporaryError } from '../../errors'
import { getNumber } from '../../types/get'
import { generateRandomString } from '../../common/utils'
import { ParseError } from '../../common/network'

function getPhoneNumber (rawPhoneNumber: string): string | null {
  const normalizedPhoneNumber = /^(?:\+?998)(\d{9})$/.exec(rawPhoneNumber.trim())

  if (normalizedPhoneNumber != null) {
    return '998' + normalizedPhoneNumber[1]
  }

  return null
}

export function validatePreferences (rawPreferences: Preferences): Preferences {
  const phone = getPhoneNumber(rawPreferences.phone)
  if (phone === null) {
    throw new InvalidPreferencesError('Неверный формат номера телефона')
  }
  if (rawPreferences.password.match(/^\d{5}$/) === null) {
    throw new InvalidPreferencesError('CLICK-PIN должен состоять из 5 цифр')
  }

  return { phone, password: rawPreferences.password }
}

async function askSmsCode (): Promise<string> {
  const sms = await ZenMoney.readLine('Введите код из СМС сообщения', { inputType: 'number' })
  if (sms === null || sms === undefined || sms === '') {
    throw new InvalidOtpCodeError()
  }
  return sms
}

function throwUserFacingError (error: unknown): never {
  if (error instanceof SessionExpiredError || error instanceof InvalidOtpCodeError || error instanceof InvalidPreferencesError) {
    throw error
  }
  if (error instanceof ClickApiError) {
    throw new TemporaryError(`CLICK временно не выполнил запрос: ${error.message}`)
  }
  if (error instanceof ParseError) {
    throw new TemporaryError('CLICK вернул некорректный ответ. Повторите синхронизацию позже.')
  }
  throw error
}

export async function coldAuth (rawPreferences: Preferences): Promise<Auth> {
  const { phone, password } = validatePreferences(rawPreferences)
  try {
    const imei = generateRandomString(16, '0123456789abcdef')
    const deviceId = await fetchDeviceRegister(phone, imei)
    const smsCode = await askSmsCode()
    await fetchConfirmRegister(phone, smsCode, { deviceId })
    const authToken = getAuthToken(phone, deviceId, smsCode)
    const sessionKey = await fetchLogin(phone, password, { deviceId, authToken })
    return { imei, deviceId, authToken, sessionKey }
  } catch (error) {
    throwUserFacingError(error)
  }
}

export async function hotAuth (rawPreferences: Preferences, auth: Auth): Promise<Auth> {
  const { phone, password } = validatePreferences(rawPreferences)
  try {
    const sessionKey = await fetchLogin(phone, password, auth)
    return { ...auth, sessionKey }
  } catch (error) {
    throwUserFacingError(error)
  }
}

export async function fetchAccounts (auth: Auth): Promise<FetchedAccounts> {
  try {
    const cards = await fetchGetCards(auth)
    const balances = await fetchGetBalance(cards.map(x => getNumber(x, 'id')), auth)
    return { cards, balances }
  } catch (error) {
    throwUserFacingError(error)
  }
}

export async function fetchTransactions (product: Product, fromDate: Date, toDate: Date, auth: Auth): Promise<unknown[]> {
  try {
    return await fetchHistory(product, fromDate, toDate, auth)
  } catch (error) {
    throwUserFacingError(error)
  }
}
