import { enc } from 'crypto-js'
import get from '../../types/get'
import { requestMobile as request } from './request'
import { arrayAt, dateAt, stringAt } from './validation'

export interface MobileStep {
  accessToken: string
  refreshToken: string | null
  authenticationId: string | null
  nextFactor: 'OTP' | 'PASSCODE' | 'IDENTITY' | null
}

export interface MobileIdentitySession {
  verificationId: string
  accessToken: string
}

export interface MobileIdentityRequirements {
  method: string
  status: string
  providers: string[]
  attempts: Array<{ id: string, status: string }>
}

export interface MobileFaceAttempt {
  id: string
  token: string
}

// The APK keeps this extended envelope even when both native SDK providers fail.
// Owner-controlled cold and repeated fast-login runs accepted this fallback.
function unavailableSdkFingerprint (): string {
  const json = JSON.stringify({
    version: '1.0',
    data: [{ name: 'SEON', value: '' }, { name: 'THREATMETRIX', value: '' }]
  })
  return 'ZEN;' + enc.Base64.stringify(enc.Utf8.parse(json))
}

function parseStep (body: unknown): MobileStep {
  const factor = get(body, 'nextFactor')
  if (get(body, 'blockadeExpirationTime') != null) {
    dateAt(body, 'blockadeExpirationTime')
    // The official OTP screen starts a timer and still allows code verification.
    assert(factor === 'OTP', 'Unsupported ZEN.COM authentication timer')
  }
  const accessToken = stringAt(body, 'accessToken.token')
  dateAt(body, 'accessToken.validUntil')
  let refreshToken: string | null = null
  if (get(body, 'refreshToken') != null) {
    refreshToken = stringAt(body, 'refreshToken.token')
    dateAt(body, 'refreshToken.validUntil')
  }
  assert(factor == null || factor === 'OTP' || factor === 'PASSCODE' || factor === 'IDENTITY', 'Unknown ZEN.COM authentication factor')
  return {
    accessToken,
    refreshToken,
    authenticationId: factor == null ? null : stringAt(body, 'authenticationId'),
    nextFactor: factor ?? null
  }
}

export async function startMobileAuthentication (deviceId: string, phoneNumber: string): Promise<MobileStep> {
  return parseStep(await request(deviceId, 'mobile-authentication/authentications', {
    userIdentification: { phoneNumber }, operationType: 'LOGIN_INDIVIDUAL_CONTEXT', fingerPrintId: unavailableSdkFingerprint()
  }))
}

export async function verifyMobileFactor (deviceId: string, step: MobileStep, secret: string): Promise<MobileStep> {
  assert(step.authenticationId !== null && (step.nextFactor === 'OTP' || step.nextFactor === 'PASSCODE'), 'Unsupported ZEN.COM factor verification')
  return parseStep(await request(deviceId,
    'mobile-authentication/authentications/' + encodeURIComponent(step.authenticationId) + '/factors/' + step.nextFactor.toLowerCase() + '/verify',
    { secret }, { 'Authentication-Access-Token': step.accessToken }))
}

export async function fastMobileLogin (deviceId: string, loginToken: string, passcode: string): Promise<MobileStep> {
  return parseStep(await request(deviceId, 'mobile-authentication/authentications/fast-login', {
    accessToken: loginToken, secret: passcode, factorType: 'PASSCODE', operationType: 'LOGIN_INDIVIDUAL_CONTEXT', fingerPrintId: unavailableSdkFingerprint()
  }))
}

export async function initializeMobileIdentity (deviceId: string, step: MobileStep): Promise<MobileIdentitySession> {
  assert(step.nextFactor === 'IDENTITY' && step.authenticationId !== null, 'Invalid ZEN.COM identity initialization state')
  const body = await request(deviceId,
    'mobile-authentication/authentications/' + encodeURIComponent(step.authenticationId) + '/factors/identity/initialize',
    undefined, { 'Authentication-Access-Token': step.accessToken })
  // This endpoint returns a verification session, not the next login factor.
  assert(get(body, 'nextFactor') == null, 'Unexpected ZEN.COM identity initialization nextFactor')
  dateAt(body, 'accessToken.validUntil')
  if (get(body, 'blockadeExpirationTime') != null) dateAt(body, 'blockadeExpirationTime')
  return { verificationId: stringAt(body, 'verificationId'), accessToken: stringAt(body, 'accessToken.token') }
}

export async function fetchMobileIdentityRequirements (deviceId: string, session: MobileIdentitySession): Promise<MobileIdentityRequirements> {
  const body = await request(deviceId, 'reauth/' + encodeURIComponent(session.verificationId) + '/v2',
    undefined, { 'Access-Token': session.accessToken }, 'GET')
  // These are diagnostic labels from the APK, not a completed identity check.
  // Never return provider data: it can contain KYC tokens, URLs and personal data.
  const method = stringAt(body, 'method')
  const status = stringAt(body, 'status')
  const knownProviders = ['IVP_IDENFY', 'IVP_VERIFF', 'IVP_SUMSUB', 'AVP_SUMSUB', 'IVP_AUTHOLOGIC']
  const sourceAttempts = arrayAt(body, 'attempts')
  const providers = sourceAttempts.map(attempt => {
    const provider = stringAt(attempt, 'provider').toUpperCase()
    return knownProviders.includes(provider) ? provider : 'UNKNOWN'
  })
  const knownStatuses = ['SUCCESS', 'FAILED', 'WAITING_FOR_RESULT', 'IN_PROGRESS', 'EXPIRED', 'USER_CONFIRMATION', 'REVIEW']
  const attempts = sourceAttempts.map(attempt => {
    const status = stringAt(attempt, 'status')
    return { id: stringAt(attempt, 'id'), status: knownStatuses.includes(status) ? status : 'UNKNOWN' }
  })
  return {
    method: ['FACE_REAUTH', 'FULL_AUTH'].includes(method) ? method : 'UNKNOWN',
    status: ['ACTIVE', 'SUCCESS', 'FAILED'].includes(status) ? status : 'UNKNOWN',
    providers: [...new Set(providers)],
    attempts
  }
}

export async function createMobileFaceAttempt (deviceId: string, session: MobileIdentitySession): Promise<MobileFaceAttempt> {
  const body = await request(deviceId, 'reauth/' + encodeURIComponent(session.verificationId) + '/init-attempt/v2',
    { country: null }, { 'Access-Token': session.accessToken, 'Full-Reauth-Process-Flow': 'V2_USER_DATA_CONFIRMATION' })
  assert(get(body, 'provider') === 'IVP_IDENFY', 'Unsupported ZEN.COM face verification provider')
  return { id: stringAt(body, 'attemptId'), token: stringAt(body, 'data.authToken') }
}

export async function notifyMobileFaceAttempt (deviceId: string, session: MobileIdentitySession, attemptId: string): Promise<void> {
  await request(deviceId, 'reauth/' + encodeURIComponent(session.verificationId) + '/attempts/' + encodeURIComponent(attemptId) + '/notify',
    undefined, { 'Access-Token': session.accessToken })
}

export async function verifyMobileIdentityFactor (deviceId: string, authenticationId: string, session: MobileIdentitySession): Promise<MobileStep> {
  return parseStep(await request(deviceId, 'mobile-authentication/authentications/' + encodeURIComponent(authenticationId) + '/factors/identity/verify',
    undefined, { 'Authentication-Access-Token': session.accessToken }))
}
