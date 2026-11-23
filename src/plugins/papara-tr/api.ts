import { ui } from '../../common/ui'
import { delay } from '../../common/utils'
import { InvalidOtpCodeError, InvalidPreferencesError, TemporaryError, UserInteractionError } from '../../errors'
import {
  fetchBalance,
  fetchIsUserDeviceVerified,
  fetchLedgersPage,
  fetchLoginPassword,
  fetchLoginPhone,
  fetchLoginTfaPush,
  fetchValidatePhone,
  setDeviceIdentifierCookie,
  UnauthorizedError,
  WEB_ORIGIN
} from './fetchApi'
import type { PaparaResponse } from './fetchApi'
import { parseLedgerDate, parseTokenUtcDate } from './ledgerDate'
import { solveTurnstile } from './turnstile'

export interface Preferences {
  phone: string
  password: string
}

export interface Auth {
  token: string
  expiresAt: string
  /** Identifier of the device Papara approved at login; reused so later logins are not new devices. */
  deviceIdentifier: string
}

/** Papara error code returned by isUserDeviceVerified until the login is approved in the mobile app. */
export const DEVICE_NOT_YET_VERIFIED_CODE = 1004
export const DEVICE_POLL_INTERVAL_MS = 3000
// Step tokens live 3 minutes; stop polling before the ValidateUserDevice token expires.
export const DEVICE_POLL_TIMEOUT_MS = 170000
// Loading 17 history pages took about 40 s; skip a token that would expire during loading.
const TOKEN_EXPIRY_MARGIN_MS = 2 * 60 * 1000

export function validatePreferences (preferences: Partial<Preferences>): Preferences {
  const phone = typeof preferences.phone === 'string' ? preferences.phone.replace(/[\s()-]/g, '') : ''
  const password = typeof preferences.password === 'string' ? preferences.password : ''
  if (!/^\+\d{10,15}$/.test(phone)) {
    throw new InvalidPreferencesError('Telefon numarasını ülke koduyla birlikte girin, örneğin +905xxxxxxxxx.')
  }
  if (password === '') {
    throw new InvalidPreferencesError('Papara şifrenizi girin.')
  }
  return { phone, password }
}

const DEVICE_IDENTIFIER_PATTERN = /^[0-9a-f]{32}$/i

export function parseAuth (value: unknown): Auth | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const { token, expiresAt, deviceIdentifier } = value as Record<string, unknown>
  if (typeof token !== 'string' || token === '' || typeof expiresAt !== 'string' || !Number.isFinite(new Date(expiresAt).valueOf()) ||
    typeof deviceIdentifier !== 'string' || !DEVICE_IDENTIFIER_PATTERN.test(deviceIdentifier)) return undefined
  return { token, expiresAt, deviceIdentifier }
}

function isUsable (auth: Auth, now: Date): boolean {
  return new Date(auth.expiresAt).valueOf() - now.valueOf() > TOKEN_EXPIRY_MARGIN_MS
}

function stepContext (step: string, response: PaparaResponse): Record<string, unknown> {
  return {
    step,
    succeeded: response.succeeded,
    code: response.error?.code ?? null,
    message: response.error?.message ?? null,
    tokenType: typeof response.data === 'object' && response.data !== null ? (response.data as Record<string, unknown>).tokenType : undefined
  }
}

function readStepToken (response: PaparaResponse, step: string, expectedTokenTypes: string[]): { token: string, tokenType: string, data: Record<string, unknown> } {
  const data = response.data as Record<string, unknown> | null
  console.assert(response.succeeded && typeof data === 'object' && data !== null && expectedTokenTypes.includes(data.tokenType as string) &&
    typeof data.access_token === 'string' && data.access_token !== '', `Unexpected Papara ${step} response`, stepContext(step, response))
  const record = data as Record<string, unknown>
  return { token: record.access_token as string, tokenType: record.tokenType as string, data: record }
}

async function waitForDeviceApproval (token: string): Promise<PaparaResponse> {
  const startedAt = Date.now()
  for (;;) {
    const response = await fetchIsUserDeviceVerified(token)
    if (response.succeeded) return response
    console.assert(response.error?.code === DEVICE_NOT_YET_VERIFIED_CODE, 'Unexpected Papara isUserDeviceVerified response', stepContext('isUserDeviceVerified', response))
    if (Date.now() - startedAt + DEVICE_POLL_INTERVAL_MS > DEVICE_POLL_TIMEOUT_MS) {
      throw new TemporaryError('Papara uygulamasındaki giriş onayı alınamadı. Senkronizasyonu yeniden başlatın ve uygulamada girişi onaylayın.')
    }
    await delay(DEVICE_POLL_INTERVAL_MS)
  }
}

async function coldLogin (preferences: Preferences, deviceIdentifier: string | undefined): Promise<Auth> {
  const validated = await fetchValidatePhone(preferences.phone)
  console.assert(validated.succeeded && typeof validated.data === 'string' && validated.data !== '', 'Unexpected Papara validate/phone response', stepContext('validate/phone', validated))
  const phoneNumber = validated.data as string

  const humanVerificationToken = await solveTurnstile(`${WEB_ORIGIN}/`, false)
  const phoneStep = readStepToken(await fetchLoginPhone(phoneNumber, humanVerificationToken), 'login/phone', ['PasswordStep'])
  const passwordStep = readStepToken(await fetchLoginPassword(phoneStep.token, preferences.password), 'login/password', ['WebLoginPushNotification'])

  const code = await ui.readLine('Papara uygulamasına gelen kodu girin. Uygulamada giriş onayı istenirse kabul edin.', { inputType: 'number' })
  const tfaCode = code?.trim() ?? ''
  if (tfaCode === '') throw new InvalidOtpCodeError('Papara uygulamasına gelen kodu girmediniz.')
  // A new device gets ValidateUserDevice and must be approved in the app; a device Papara already
  // trusts gets the Master token directly (observed in the web client on 2026-11-26).
  const deviceStep = readStepToken(await fetchLoginTfaPush(passwordStep.token, tfaCode), 'login/tfapush', ['ValidateUserDevice', 'Master'])
  const master = deviceStep.tokenType === 'Master'
    ? deviceStep
    : readStepToken(await waitForDeviceApproval(deviceStep.token), 'login/isUserDeviceVerified', ['Master'])
  const expiresAt = parseTokenUtcDate(master.data['.expires'])
  console.assert(expiresAt !== null, 'Unexpected Papara token expiry', { expires: master.data['.expires'] })
  const issuedDevice = master.data.deviceIdentifier
  console.assert(typeof issuedDevice === 'string' && DEVICE_IDENTIFIER_PATTERN.test(issuedDevice), 'Papara Master token has no deviceIdentifier')
  if (deviceIdentifier !== undefined && issuedDevice !== deviceIdentifier) console.log('Papara issued a new deviceIdentifier at login')
  return { token: master.token, expiresAt: (expiresAt as Date).toISOString(), deviceIdentifier: issuedDevice as string }
}

function balanceData (response: PaparaResponse): unknown {
  console.assert(response.succeeded, 'Unexpected Papara balance response', stepContext('balance', response))
  return response.data
}

/**
 * Returns a usable session together with the `balance` data.
 * A saved token is reused until its known expiry; a 401 or local expiry starts an interactive login.
 * The device cookie is set before any request: login uses it to recognize an approved device, and
 * user/ledgers rejects a token without it (401, code 1528 "Cihaz bilgileri teyit edilemedi.", observed 2026-11-26).
 */
export async function authenticateAndFetchBalance (
  rawPreferences: Partial<Preferences>,
  saved: Auth | undefined,
  isInBackground: boolean,
  onAuth: (auth: Auth) => void
): Promise<{ auth: Auth, balance: unknown }> {
  if (saved !== undefined) await setDeviceIdentifierCookie(saved.deviceIdentifier)
  if (saved !== undefined && isUsable(saved, new Date())) {
    try {
      return { auth: saved, balance: balanceData(await fetchBalance(saved.token)) }
    } catch (error) {
      if (!(error instanceof UnauthorizedError)) throw error
      console.log('Saved Papara token was rejected with 401, starting a new login')
    }
  } else if (saved !== undefined) {
    console.log('Saved Papara token has expired, starting a new login')
  }
  const preferences = validatePreferences(rawPreferences)
  // Cold login opens Turnstile and sends a push code; neither can be completed in the background.
  if (isInBackground) throw new UserInteractionError()
  const auth = await coldLogin(preferences, saved?.deviceIdentifier)
  onAuth(auth)
  if (auth.deviceIdentifier !== saved?.deviceIdentifier) await setDeviceIdentifierCookie(auth.deviceIdentifier)
  return { auth, balance: balanceData(await fetchBalance(auth.token)) }
}

/**
 * Loads ledger pages (newest first) until an operation older than fromDate appears
 * or the last page reported by totalPageCount has been read.
 */
export async function fetchLedgers (token: string, fromDate: Date): Promise<unknown[]> {
  const items: unknown[] = []
  for (let page = 1; ; page++) {
    const response = await fetchLedgersPage(token, page)
    const data = response.data as Record<string, unknown> | null
    console.assert(response.succeeded && typeof data === 'object' && data !== null &&
      typeof data.totalPageCount === 'number' && Number.isInteger(data.totalPageCount) && Array.isArray(data.items),
    'Unexpected Papara ledgers response', { page, ...stepContext('user/ledgers', response) })
    const totalPageCount = (data as Record<string, unknown>).totalPageCount as number
    const pageItems = (data as Record<string, unknown>).items as unknown[]
    if (totalPageCount === 0 && page === 1 && pageItems.length === 0) return items
    console.assert(pageItems.length > 0 && page <= totalPageCount, 'Unexpected empty Papara ledgers page', { page, totalPageCount, count: pageItems.length })
    items.push(...pageItems)
    const reachedFromDate = pageItems.some(item => parseLedgerDate((item as Record<string, unknown> | null)?.createdAt) < fromDate)
    if (reachedFromDate || page >= totalPageCount) return items
  }
}
