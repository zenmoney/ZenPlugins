import { delay } from '../../common/utils'
import { UserInteractionError } from '../../errors'
import { presentFaceVerification } from './face'
import { createMobileFaceAttempt, fetchMobileIdentityRequirements, initializeMobileIdentity, notifyMobileFaceAttempt, verifyMobileIdentityFactor } from './mobileApi'
import type { MobileStep } from './mobileApi'

export async function completeMobileIdentity (deviceId: string, step: MobileStep, isInBackground: boolean): Promise<MobileStep> {
  if (isInBackground) throw new UserInteractionError()
  assert(step.nextFactor === 'IDENTITY' && step.authenticationId !== null, 'Invalid ZEN.COM identity verification state')
  const session = await initializeMobileIdentity(deviceId, step)
  const requirements = await fetchMobileIdentityRequirements(deviceId, session)
  assert(requirements.method === 'FACE_REAUTH' && requirements.status === 'ACTIVE', 'Unsupported ZEN.COM identity verification requirements', requirements)
  const attempt = await createMobileFaceAttempt(deviceId, session)
  await presentFaceVerification(attempt.token, false)
  await notifyMobileFaceAttempt(deviceId, session, attempt.id)
  for (let poll = 0; poll < 12; poll++) {
    const state = await fetchMobileIdentityRequirements(deviceId, session)
    assert(state.method === 'FACE_REAUTH', 'ZEN.COM identity verification method changed')
    const currentAttempt = state.attempts.find(value => value.id === attempt.id)
    assert(currentAttempt?.status !== 'FAILED', 'ZEN.COM face verification attempt was rejected', { attemptId: attempt.id, status: currentAttempt?.status })
    if (state.status === 'SUCCESS') return await verifyMobileIdentityFactor(deviceId, step.authenticationId, session)
    assert(state.status === 'ACTIVE', 'ZEN.COM face verification did not succeed', state)
    if (poll < 11) await delay(5000)
  }
  throw new Error('ZEN.COM face verification was not confirmed by the bank')
}
