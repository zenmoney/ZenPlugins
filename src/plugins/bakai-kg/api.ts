import crypto from 'crypto-js'
import { v4 as uuid } from 'uuid'
import moment from 'moment'
import get, { getArray, getOptBoolean, getOptNumber, getOptString } from '../../types/get'
import { InvalidPreferencesError, UserInteractionError } from '../../errors'
import { fetchAccountStatement, fetchAllAccounts, fetchAuthorization, fetchBalance, fetchConfirmation, fetchLogin, fetchSendOtp, fetchStatement, fetchVerifyOtp } from './fetchApi'
import { AuthState, FetchParams, Preferences } from './models'

export function passwordFields (login: string, password: string): Record<string, string> {
  return {
    password: crypto.MD5(password).toString(),
    password2: crypto.MD5(login + password).toString(),
    password3: crypto.SHA256(password).toString()
  }
}

function success (body: unknown, endpoint: string): void {
  const result = getOptNumber(body, 'result')
  assert(result === 0, 'Unexpected bank result', { endpoint, result })
}

function savedAuth (value: unknown): AuthState | null {
  if (getOptNumber(value, 'version') !== 1) return null
  const deviceId = getOptString(value, 'deviceId')
  const token = get(value, 'token')
  const otpVerified = getOptBoolean(value, 'otpVerified')
  if (deviceId == null || deviceId === '' || (token !== null && typeof token !== 'string') || otpVerified == null) return null
  if (token === '' || (otpVerified && token === null)) return null
  const appApprovalPending = getOptBoolean(value, 'appApprovalPending')
  return { version: 1, deviceId, token, otpVerified, ...(appApprovalPending === true ? { appApprovalPending: true } : {}) }
}

export async function login (preferences: Preferences, saved: unknown, isInBackground: boolean, persist: (state: AuthState) => void): Promise<AuthState> {
  let state = savedAuth(saved)
  if (state?.otpVerified === true) return state
  if (isInBackground) throw new UserInteractionError()
  if (state?.token == null) {
    if (typeof preferences.phone !== 'string' || !/^\d{10,15}$/.test(preferences.phone) ||
        typeof preferences.password !== 'string' || preferences.password.length === 0 ||
        typeof preferences.countryCode !== 'string' || !/^[A-Z]{2}$/.test(preferences.countryCode)) {
      throw new InvalidPreferencesError('Укажите номер телефона с кодом страны, пароль BakAi и двухбуквенный код страны телефона.')
    }
    state = { version: 1, deviceId: state?.deviceId ?? uuid(), token: null, otpVerified: false }
    persist(state)
    const lookup = await fetchLogin(state, preferences.phone)
    success(lookup, 'get_login')
    const bankLogin = getOptString(lookup, 'login')
    assert(bankLogin != null && bankLogin !== '', 'Bank login is missing')
    // The observed client used identical phone, username and returned login.
    assert(bankLogin === preferences.phone, 'Distinct bank login and phone require protocol research')
    const authorization = await fetchAuthorization(state, {
      code: preferences.countryCode,
      username: preferences.phone,
      login: bankLogin,
      ...passwordFields(bankLogin, preferences.password)
    })
    success(authorization, 'auth')
    const token = getOptString(authorization, 'token')
    assert(token != null && token !== '', 'Bank authorization token is missing')
    assert(getOptBoolean(authorization, 'is_2fa_selfie') === false, 'Unimplemented bank selfie confirmation')
    const needsAppApproval = getOptBoolean(authorization, 'is_2fa')
    assert(needsAppApproval != null, 'Bank approval mode is missing')
    state = { ...state, token, ...(needsAppApproval ? { appApprovalPending: true } : {}) }
    persist(state)
  }
  assert(state != null, 'Authorization state is missing')
  if (state.appApprovalPending === true) {
    persist(state)
    let confirmation = await fetchConfirmation(state)
    success(confirmation, 'users.check_confirmation')
    if (getOptBoolean(confirmation, 'verified') === false) {
      const code = getOptNumber(confirmation, 'code')
      assert(code != null && Number.isInteger(code), 'Bank approval number is missing')
      assert(getOptBoolean(confirmation, 'rejected') !== true, 'Bank device approval was rejected')
      await ZenMoney.alert(`Число для подтверждения входа: ${code}. Откройте BakAi на доверенном телефоне, разрешите вход устройства Zenmoney Sync и выберите это число. После подтверждения вернитесь в Zenmoney и нажмите ОК.`)
      confirmation = await fetchConfirmation(state)
      success(confirmation, 'users.check_confirmation')
    }
    assert(getOptBoolean(confirmation, 'verified') === true, 'Bank device approval has not completed')
    const sent = await fetchSendOtp(state)
    success(sent, 'ask_otp')
    state = { ...state, appApprovalPending: false }
    persist(state)
  }
  // is_2fa was false in the observed SMS flow; it must not bypass OTP.
  const otp = await ZenMoney.readLine('Введите код из SMS от BakAi для подключения устройства Zenmoney', { inputType: 'number' })
  assert(otp != null && otp.trim() !== '', 'Required OTP input was not provided')
  const confirmation = await fetchVerifyOtp(state, otp.trim())
  success(confirmation, 'verify_otp')
  state = { ...state, otpVerified: true }
  persist(state)
  return state
}

export async function fetchAccounts (state: AuthState): Promise<unknown[]> {
  const body = await fetchAllAccounts(state)
  success(body, 'account.get_list')
  return getArray({ list: get(body, 'list') }, 'list')
}

export async function fetchAccountBalance (state: AuthState, accountId: number): Promise<number> {
  const body = await fetchBalance(state, accountId)
  success(body, 'account.get_balance')
  const balance = getOptNumber(body, 'balance')
  const creditLimit = getOptNumber(body, 'credit_limit')
  assert(balance != null && Number.isFinite(balance), 'Bank balance is missing or invalid')
  assert(creditLimit === 0, 'Credit balance semantics require bank evidence')
  return balance
}

export function getHistoryDates (params: FetchParams, fromDate: Date, toDate?: Date): { start: string, end: string } {
  assert(Number.isFinite(fromDate.getTime()) && (toDate == null || Number.isFinite(toDate.getTime())), 'Invalid scrape interval')
  assert(toDate == null || fromDate.getTime() <= toDate.getTime(), 'Scrape interval is reversed')
  // Current statements preserve lifecycle updates. Future padding can exceed the
  // card endpoint's advertised six-month request limit (observed result -5000).
  const endDate = moment(Math.max(toDate?.getTime() ?? 0, Date.now())).utcOffset(360).startOf('day')
  const earliest = endDate.clone().subtract(6, 'months')
  if ('cardId' in params && moment(fromDate).utcOffset(360).startOf('day').isBefore(earliest)) {
    throw new InvalidPreferencesError(`Период импорта операций по картам Bakai не должен превышать 6 месяцев. Выберите дату начала не раньше ${earliest.format('DD.MM.YYYY')}.`)
  }
  // Bank filtering uses operation/processing dates differently between sources.
  // Include the preceding day to cover the observed six-hour boundary difference.
  const start = moment(fromDate).utcOffset(360).subtract(1, 'day').format('YYYY-MM-DD')
  return { start, end: endDate.format('YYYY-MM-DD') }
}

export async function fetchTransactions (state: AuthState, params: FetchParams, fromDate: Date, toDate?: Date): Promise<unknown[]> {
  const { start, end } = getHistoryDates(params, fromDate, toDate)
  const isAccount = !('cardId' in params)
  const body = 'cardId' in params
    ? await fetchStatement(state, params, start, end)
    : await fetchAccountStatement(state, params.accountId, start, end)
  success(body, isAccount ? 'account.history' : 'card.online_statement')
  return getArray({ operations: get(body, 'operations') }, 'operations')
}
