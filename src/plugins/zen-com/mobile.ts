import { generateUUID } from '../../common/utils'
import { UserInteractionError } from '../../errors'
import get from '../../types/get'
import { fastMobileLogin, startMobileAuthentication, verifyMobileFactor } from './mobileApi'
import { completeMobileIdentity } from './identity'
import type { MobileStep } from './mobileApi'
import type { MobileSession } from './models'
import { stringAt } from './validation'

export interface MobileAuth {
  version: 1
  deviceId: string
  loginToken: string
  passcode: string
}
export type PersistMobileAuth = (auth: MobileAuth) => Promise<void>

function parseAuth (saved: unknown): MobileAuth | null {
  if (saved == null) return null
  assert(get(saved, 'version') === 1, 'Unsupported ZEN.COM mobile authorization version')
  return {
    version: 1,
    deviceId: stringAt(saved, 'deviceId'),
    loginToken: stringAt(saved, 'loginToken'),
    passcode: stringAt(saved, 'passcode')
  }
}

async function input (message: string, inputType: 'text' | 'number' | 'numberPassword'): Promise<string> {
  const value = await ZenMoney.readLine(message, { inputType })
  assert(value !== null && value.trim() !== '', 'Required ZEN.COM authentication input was not provided')
  return value.trim()
}

async function finish (step: MobileStep, auth: MobileAuth, persist: PersistMobileAuth): Promise<MobileSession> {
  assert(step.nextFactor === null && step.refreshToken !== null, 'ZEN.COM mobile sign-in did not complete; open the official app')
  // The official client replaces its identification token with the final access token.
  const rotated: MobileAuth = { ...auth, loginToken: step.accessToken }
  await persist(rotated)
  return { deviceId: rotated.deviceId, accessToken: step.accessToken }
}

export async function loginMobile (saved: unknown, isInBackground: boolean, persist: PersistMobileAuth): Promise<MobileSession> {
  const auth = parseAuth(saved)
  if (auth !== null) {
    // Unknown fast-login failures must not silently initiate another SMS flow.
    return await finish(await fastMobileLogin(auth.deviceId, auth.loginToken, auth.passcode), auth, persist)
  }
  if (isInBackground) throw new UserInteractionError()
  const phone = (await input('ZEN.COM phone number with country code. ZEN.COM may send an SMS code.', 'text')).replace(/[\s()-]/g, '')
  assert(/^\+\d{6,15}$/.test(phone), 'Enter a ZEN.COM phone number with + and country code')
  const deviceId = generateUUID()
  let step = await startMobileAuthentication(deviceId, phone)
  let candidate: MobileAuth | null = null
  for (let attempt = 0; step.nextFactor !== null; attempt++) {
    assert(attempt < 6, 'ZEN.COM authentication exceeded the factor limit')
    if (step.nextFactor === 'IDENTITY') {
      step = await completeMobileIdentity(deviceId, step, false)
      continue
    }
    if (step.nextFactor === 'PASSCODE') {
      const passcode = await input('ZEN.COM app passcode (not the card PIN). It will be saved in this connection for automatic sign-in.', 'numberPassword')
      // Do not persist a passcode until the bank confirms the completed login.
      candidate = { version: 1, deviceId, loginToken: step.accessToken, passcode }
      step = await verifyMobileFactor(deviceId, step, passcode)
    } else {
      step = await verifyMobileFactor(deviceId, step, await input('Enter the SMS code from ZEN.COM', 'number'))
    }
  }
  assert(candidate !== null, 'ZEN.COM did not establish passcode authentication; open the official app')
  return await finish(step, candidate, persist)
}
