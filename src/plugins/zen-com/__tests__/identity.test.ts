import { UserInteractionError } from '../../../errors'

jest.mock('../mobileApi', () => ({
  createMobileFaceAttempt: jest.fn(),
  fetchMobileIdentityRequirements: jest.fn(),
  initializeMobileIdentity: jest.fn(),
  notifyMobileFaceAttempt: jest.fn(),
  verifyMobileIdentityFactor: jest.fn()
}))
jest.mock('../face', () => ({ presentFaceVerification: jest.fn() }))
jest.mock('../../../common/utils', () => ({ ...jest.requireActual('../../../common/utils'), delay: jest.fn(async () => {}) }))
const { createMobileFaceAttempt, fetchMobileIdentityRequirements, initializeMobileIdentity, notifyMobileFaceAttempt, verifyMobileIdentityFactor }: jest.Mocked<typeof import('../mobileApi')> = jest.requireMock('../mobileApi')
const { presentFaceVerification }: jest.Mocked<typeof import('../face')> = jest.requireMock('../face')
const { delay }: jest.Mocked<typeof import('../../../common/utils')> = jest.requireMock('../../../common/utils')
const { completeMobileIdentity } = jest.requireActual<typeof import('../identity')>('../identity')

// Normalized workflow models test authorization gates, not successful bank JSON.
describe('ZEN.COM face verification workflow [model]', () => {
  const step = { authenticationId: 'model-auth', nextFactor: 'IDENTITY' as const, refreshToken: null, accessToken: 'model-token' }
  const session = { verificationId: 'model-verification', accessToken: 'model-session-token' }
  const requirements = { method: 'FACE_REAUTH', status: 'ACTIVE', providers: [], attempts: [] }
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(initializeMobileIdentity).mockResolvedValue(session)
    jest.mocked(fetchMobileIdentityRequirements).mockReset().mockResolvedValue(requirements)
    jest.mocked(createMobileFaceAttempt).mockResolvedValue({ id: 'model-attempt', token: 'model-face-token' })
    jest.mocked(presentFaceVerification).mockReset().mockResolvedValue(undefined)
  })
  it('stops background execution before initialization or browser work', async () => {
    await expect(completeMobileIdentity('model-device', step, true)).rejects.toBeInstanceOf(UserInteractionError)
    expect(initializeMobileIdentity).not.toHaveBeenCalled()
    expect(presentFaceVerification).not.toHaveBeenCalled()
  })
  it('requires bank success after the UI, notification and polling before verifying the factor', async () => {
    const done = { authenticationId: null, nextFactor: null, refreshToken: 'model-refresh', accessToken: 'model-final' }
    jest.mocked(fetchMobileIdentityRequirements).mockResolvedValueOnce(requirements).mockResolvedValueOnce(requirements).mockResolvedValueOnce({ ...requirements, status: 'SUCCESS' })
    jest.mocked(verifyMobileIdentityFactor).mockResolvedValue(done)
    await expect(completeMobileIdentity('model-device', step, false)).resolves.toEqual(done)
    expect(createMobileFaceAttempt).toHaveBeenCalledTimes(1)
    expect(presentFaceVerification).toHaveBeenCalledWith('model-face-token', false)
    expect(notifyMobileFaceAttempt).toHaveBeenCalledWith('model-device', session, 'model-attempt')
    expect(verifyMobileIdentityFactor).toHaveBeenCalledWith('model-device', 'model-auth', session)
    expect(jest.mocked(notifyMobileFaceAttempt).mock.invocationCallOrder[0]).toBeLessThan(jest.mocked(verifyMobileIdentityFactor).mock.invocationCallOrder[0])
    expect(delay).toHaveBeenCalledWith(5000)
  })
  it('does not treat closing the browser as successful identity verification', async () => {
    await expect(completeMobileIdentity('model-device', step, false)).rejects.toThrow('not confirmed')
    expect(verifyMobileIdentityFactor).not.toHaveBeenCalled()
    expect(notifyMobileFaceAttempt).toHaveBeenCalledTimes(1)
    expect(createMobileFaceAttempt).toHaveBeenCalledTimes(1)
  })
  it('stops immediately for the created FAILED attempt without retrying or verifying identity', async () => {
    jest.mocked(fetchMobileIdentityRequirements).mockResolvedValueOnce(requirements).mockResolvedValue({
      ...requirements, attempts: [{ id: 'model-attempt', status: 'FAILED' }]
    })
    await expect(completeMobileIdentity('model-device', step, false)).rejects.toThrow('attempt was rejected')
    expect(fetchMobileIdentityRequirements).toHaveBeenCalledTimes(2)
    expect(delay).not.toHaveBeenCalled()
    expect(createMobileFaceAttempt).toHaveBeenCalledTimes(1)
    expect(verifyMobileIdentityFactor).not.toHaveBeenCalled()
  })
  it('propagates browser failure without notification, factor verification or another attempt', async () => {
    const error = new Error('Model browser failure')
    jest.mocked(presentFaceVerification).mockRejectedValue(error)
    await expect(completeMobileIdentity('model-device', step, false)).rejects.toBe(error)
    expect(notifyMobileFaceAttempt).not.toHaveBeenCalled()
    expect(verifyMobileIdentityFactor).not.toHaveBeenCalled()
    expect(createMobileFaceAttempt).toHaveBeenCalledTimes(1)
  })
  it('stops at an unknown verification method before creating an attempt', async () => {
    jest.mocked(fetchMobileIdentityRequirements).mockResolvedValue({ ...requirements, method: 'UNKNOWN' })
    await expect(completeMobileIdentity('model-device', step, false)).rejects.toThrow()
    expect(createMobileFaceAttempt).not.toHaveBeenCalled()
  })
})
