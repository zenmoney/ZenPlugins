import { Buffer } from 'buffer'
import { SHA256 } from 'crypto-js'
import { InvalidPreferencesError, UserInteractionError } from '../../errors'
import { beforeDeadline } from './deadline'
import { getResponseErrorCode } from './authResponse'
import { attachMobileSession, MOBILE_APP_ID, MOBILE_ORIGIN, WEB_ORIGIN, MobileAuth, MobileSession } from './mobileSession'

function record (value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function accountIdentity (body: unknown): string {
  if (!Array.isArray(body) || body.length === 0) throw new Error('Bank Hapoalim returned an empty or invalid accounts inventory')
  const ids = body.map((row: unknown) => {
    if (row === null || typeof row !== 'object' || Array.isArray(row)) throw new Error('Bank Hapoalim returned invalid account identity')
    const record = row as Record<string, unknown>
    const parts = ['bankNumber', 'branchNumber', 'accountNumber'].map(key => record[key])
    if (!parts.every(value => (typeof value === 'string' || typeof value === 'number') && /^\d+$/.test(String(value)) && !/^0+$/.test(String(value)))) throw new Error('Bank Hapoalim returned invalid account identity')
    return parts.join('-')
  })
  if (new Set(ids).size !== ids.length) throw new Error('Bank Hapoalim returned duplicate parent accounts')
  return SHA256(JSON.stringify(ids.sort())).toString()
}

function bankState (body: unknown): 'authenticated' | 'otp-required' | 'unknown' {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) return 'unknown'
  const value = body as Record<string, unknown>
  if (value.error != null || value.flow !== 'AUTHENTICATE') return 'unknown'
  return value.state === 'LANDPAGE' ? 'authenticated' : value.state === 'LOGONOTP' ? 'otp-required' : 'unknown'
}

function devicePayload (): string {
  const device = ZenMoney.device
  if (device == null || typeof device.os?.name !== 'string' || device.os.name.toLowerCase() !== 'android') throw new Error('Bank Hapoalim direct login requires supported Android device metadata')
  const system = { model: device.model, manufacturer: device.manufacturer, brand: device.brand, osVersion: device.os.version }
  if (!Object.values(system).every(value => typeof value === 'string' && value.length > 0 && value.length <= 200)) throw new Error('Bank Hapoalim device metadata is incomplete')
  // Only confirmed host attributes. No bank SDK version, hardware identifier,
  // location, attestation or security flags are invented.
  const encoded = Buffer.from(JSON.stringify({ deviceSignature: { system } }), 'utf8').toString('base64')
  return (encoded.match(/.{1,76}/g) ?? []).join('\n') + '\n'
}

async function proveSession (session: MobileSession, previousIdentity?: string): Promise<MobileAuth> {
  const response = await session.request(WEB_ORIGIN + '/ServerServices/general/accounts?lang=he', {
    method: 'GET', headers: { Accept: 'application/json', 'Accept-Encoding': 'identity' }
  })
  if (response.status !== 200) {
    const code = getResponseErrorCode(response)
    throw Object.assign(new Error('Bank Hapoalim direct login did not establish accounts access'), {
      responseSummary: { status: response.status, errCode: code === 'STEPUPOTP' ? code : null, isLoginPage: false }
    })
  }
  const identity = accountIdentity(response.body)
  if (previousIdentity !== undefined && identity !== previousIdentity) throw new Error('Bank Hapoalim authenticated account set differs from the existing connection')
  const auth = session.snapshot(identity, Date.now())
  attachMobileSession(auth, session)
  return auth
}

interface LoginOptions {
  preferences?: unknown
  isInBackground?: boolean
  previousIdentity?: string
  onAuthUpdate: (auth: MobileAuth) => Promise<void>
  onInteraction?: () => void
}

function configuredCredentials (preferences: unknown): { identifier: string, password: string } | null {
  if (preferences == null) return null
  const invalid = (): InvalidPreferencesError => new InvalidPreferencesError('Укажите логин и пароль Bank Hapoalim в настройках или очистите оба поля.')
  if (!record(preferences)) throw invalid()
  const { login, password } = preferences
  if ((login == null || login === '') && (password == null || password === '')) return null
  if (typeof login !== 'string' || login.trim() === '' || login.length > 500 ||
    typeof password !== 'string' || password === '' || password.length > 500) throw invalid()
  return { identifier: login.trim(), password }
}

export async function loginMobile ({ preferences, isInBackground = false, previousIdentity, onAuthUpdate, onInteraction = () => {} }: LoginOptions): Promise<MobileAuth> {
  if (isInBackground) throw new UserInteractionError()
  const credentials = configuredCredentials(preferences)
  const session = new MobileSession()
  const mfp = devicePayload()
  let complete = false
  const end = Date.now() + 10 * 60 * 1000
  const step = async <T>(operation: () => Promise<T>): Promise<T> => await beforeDeadline(operation, end,
    () => new Error('Bank Hapoalim direct login timed out'), () => { session.close() })
  let interacted = false
  const input = async (prompt: string, inputType: 'text' | 'textPassword' | 'numberPassword'): Promise<string> => {
    if (!interacted) {
      onInteraction()
      interacted = true
    }
    const value = await beforeDeadline(async () => await ZenMoney.readLine(prompt, { inputType, time: 180000 }), Math.min(end, Date.now() + 180000),
      () => new Error('Bank Hapoalim direct login timed out'), () => { session.close() })
    if (typeof value !== 'string' || value.length === 0 || value.length > 500) throw new Error('Bank Hapoalim required input was not provided')
    return value
  }
  const request = async (path: string, form: Record<string, string>): Promise<unknown> => {
    const response = await step(async () => await session.request(MOBILE_ORIGIN + path + '?appId=' + MOBILE_APP_ID, {
      method: 'POST',
      headers: { mobile: 'ca', Accept: 'application/json', 'Accept-Encoding': 'identity', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(form).toString()
    }))
    if (response.status !== 200) throw new Error('Bank Hapoalim authentication request failed')
    return response.body
  }
  try {
    console.log('Bank Hapoalim direct login', { credentialSource: credentials !== null ? 'preferences' : 'input' })
    let identifier: string | null = credentials?.identifier ?? await input('Логин Bank Hapoalim', 'text')
    let password: string | null = credentials?.password ?? await input('Пароль Bank Hapoalim', 'textPassword')
    let body: unknown
    try {
      // Public APK44.2.0 La/a.F appends loop indices, not MD5 bytes. This
      // reproduces its helper; it is not a unique or spoofed device identity.
      const generatedDeviceID = Array.from({ length: 16 }, (_, index) => ((index & 255) | 256).toString(16)).join('')
      body = await request('/authenticate/verify', { organization: '106402333', identifier, credentials: password, authType: '0', flow: 'authenticate', state: 'logon', mfp, generatedDeviceID })
    } finally { identifier = null; password = null }
    if (bankState(body) === 'otp-required') {
      const form: Record<string, string> = { otpchannel: 'sms', flow: 'authenticate', state: 'logonotp', appId: MOBILE_APP_ID, mfp }
      if (record(body) && typeof body.target === 'string' && body.target.length > 0 && body.target.length <= 200) form.target = body.target
      body = await request('/authenticate/logonotp/init', form)
      if (bankState(body) !== 'otp-required' || !record(body) || !Object.prototype.hasOwnProperty.call(body, 'error') || body.error !== null) throw new Error('Bank Hapoalim did not confirm the SMS challenge')
      const csrf = session.csrf()
      if (csrf === null || csrf === '' || csrf.length > 4096) throw new Error('Bank Hapoalim SMS challenge is missing its scoped CSRF cookie')
      let otp: string | null = await input('Код из SMS', 'numberPassword')
      try {
        if (!/^\d{4,10}$/.test(otp)) throw new Error('Bank Hapoalim required verification code was not provided')
        body = await request('/authenticate/logonotp/verify', { appId: MOBILE_APP_ID, csrffield: csrf, flow: 'authenticate', state: 'logonotp', otp, mfp })
      } finally { otp = null }
    }
    if (bankState(body) !== 'authenticated') throw new Error('Bank Hapoalim did not confirm authentication')
    const auth = await step(async () => await proveSession(session, previousIdentity))
    await onAuthUpdate(auth)
    complete = true
    return auth
  } finally {
    if (!complete) session.close()
  }
}

export async function recoverMobile (snapshot: string, previousIdentity: string | undefined, onAuthUpdate: (auth: MobileAuth) => Promise<void>): Promise<MobileAuth | null> {
  const session = new MobileSession(snapshot)
  if (!session.hasSession()) { session.close(); return null }
  try {
    const auth = await proveSession(session, previousIdentity)
    await onAuthUpdate(auth)
    return auth
  } catch (error) {
    session.close()
    throw error
  }
}
