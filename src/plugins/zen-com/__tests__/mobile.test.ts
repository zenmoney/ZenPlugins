import type { MobileAuth } from '../mobile'
import type { MobileStep } from '../mobileApi'
import { UserInteractionError, ZPAPIError } from '../../../errors'

const mockStart = jest.fn<Promise<MobileStep>, [string, string]>()
const mockVerify = jest.fn<Promise<MobileStep>, [string, MobileStep, string]>()
const mockFast = jest.fn<Promise<MobileStep>, [string, string, string]>()
const mockCompleteIdentity = jest.fn<Promise<MobileStep>, [string, MobileStep, boolean]>()
jest.mock('../mobileApi', () => ({
  startMobileAuthentication: async (...args: Parameters<typeof mockStart>) => await mockStart(...args),
  verifyMobileFactor: async (...args: Parameters<typeof mockVerify>) => await mockVerify(...args),
  fastMobileLogin: async (...args: Parameters<typeof mockFast>) => await mockFast(...args)
}))
jest.mock('../identity', () => ({ completeMobileIdentity: async (...args: Parameters<typeof mockCompleteIdentity>) => await mockCompleteIdentity(...args) }))
const { loginMobile } = jest.requireActual<typeof import('../mobile')>('../mobile')
const start = mockStart
const verify = mockVerify
const fast = mockFast

// Normalized internal workflow models establish ordering and error invariants.
// These are not bank JSON responses or evidence of server acceptance.
describe('ZEN.COM mobile authorization [model]', () => {
  const otp: MobileStep = { accessToken: 'model-otp', refreshToken: null, authenticationId: 'model-id', nextFactor: 'OTP' }
  const pin: MobileStep = { ...otp, accessToken: 'model-pin', nextFactor: 'PASSCODE' }
  const done: MobileStep = { accessToken: 'model-final', refreshToken: 'model-refresh', authenticationId: null, nextFactor: null }
  const auth: MobileAuth = { version: 1, deviceId: 'model-device', loginToken: 'model-old', passcode: 'model-passcode' }
  let persist: jest.Mock
  beforeEach(() => {
    jest.resetAllMocks()
    persist = jest.fn().mockResolvedValue(undefined)
    global.ZenMoney = { readLine: jest.fn() } as unknown as typeof ZenMoney
    start.mockResolvedValue(otp)
    fast.mockResolvedValue(done)
  })

  it('stops cold background authentication before UI or an SMS request', async () => {
    await expect(loginMobile(null, true, persist)).rejects.toBeInstanceOf(UserInteractionError)
    expect(ZenMoney.readLine).not.toHaveBeenCalled()
    expect(start).not.toHaveBeenCalled()
  })

  it.each([null, '', '   '])('keeps absent required phone input reportable (%p)', async value => {
    jest.mocked(ZenMoney.readLine).mockResolvedValue(value)
    const error = await loginMobile(null, false, persist).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(start).not.toHaveBeenCalled()
    expect(persist).not.toHaveBeenCalled()
  })

  it.each(['OTP', 'PASSCODE'] as const)('never submits absent required %s input', async factor => {
    jest.mocked(ZenMoney.readLine).mockResolvedValueOnce('+12345678901').mockResolvedValueOnce(null)
    start.mockResolvedValue(factor === 'OTP' ? otp : pin)
    const error = await loginMobile(null, false, persist).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(verify).not.toHaveBeenCalled()
    expect(persist).not.toHaveBeenCalled()
  })

  it('persists verified passcode authorization before returning a financial session', async () => {
    jest.mocked(ZenMoney.readLine).mockResolvedValueOnce('+12345678901').mockResolvedValueOnce('model-sms').mockResolvedValueOnce('model-passcode')
    verify.mockImplementation(async (_deviceId, step) => {
      if (step.nextFactor === 'OTP') return pin
      expect(persist).not.toHaveBeenCalled()
      return done
    })
    await loginMobile(null, false, persist)
    expect(ZenMoney.readLine).toHaveBeenNthCalledWith(3, expect.stringContaining('app passcode'), { inputType: 'numberPassword' })
    expect(start).toHaveBeenCalledWith(expect.any(String), '+12345678901')
    expect(verify).toHaveBeenCalledTimes(2)
    expect(persist).toHaveBeenCalledTimes(1)
  })

  it('keeps an unverified passcode out of saved connection state', async () => {
    const error = new Error('Model passcode verification failure')
    jest.mocked(ZenMoney.readLine).mockResolvedValueOnce('+12345678901').mockResolvedValueOnce('model-sms').mockResolvedValueOnce('model-unverified-passcode')
    verify.mockResolvedValueOnce(pin).mockRejectedValueOnce(error)
    await expect(loginMobile(null, false, persist)).rejects.toBe(error)
    expect(persist).not.toHaveBeenCalled()
    expect(start).toHaveBeenCalledTimes(1)
  })

  it('uses saved credentials without prompts and rotates them in the background', async () => {
    await expect(loginMobile(auth, true, persist)).resolves.toEqual({ deviceId: auth.deviceId, accessToken: 'model-final' })
    expect(fast).toHaveBeenCalledWith(auth.deviceId, auth.loginToken, auth.passcode)
    expect(persist.mock.calls).toEqual([[{ ...auth, loginToken: 'model-final' }]])
    expect(start).not.toHaveBeenCalled()
    expect(ZenMoney.readLine).not.toHaveBeenCalled()
  })

  it('propagates unknown fast-login errors without overwriting state or restarting SMS', async () => {
    const error = new Error('Model unknown fast-login failure')
    fast.mockRejectedValue(error)
    await expect(loginMobile(auth, false, persist)).rejects.toBe(error)
    expect(persist).not.toHaveBeenCalled()
    expect(start).not.toHaveBeenCalled()
    expect(ZenMoney.readLine).not.toHaveBeenCalled()
  })

  it('does not discard an unsupported saved state', async () => {
    await expect(loginMobile({ ...auth, version: 2 }, false, persist)).rejects.toThrow()
    expect(fast).not.toHaveBeenCalled()
    expect(start).not.toHaveBeenCalled()
    expect(persist).not.toHaveBeenCalled()
  })

  it('finishes the identity factor after passcode before persisting completed authorization', async () => {
    jest.mocked(ZenMoney.readLine).mockResolvedValueOnce('+12345678901').mockResolvedValueOnce('model-sms').mockResolvedValueOnce('model-passcode')
    const identity: MobileStep = { ...otp, nextFactor: 'IDENTITY', accessToken: 'model-identity' }
    verify.mockResolvedValueOnce(pin).mockResolvedValueOnce(identity)
    mockCompleteIdentity.mockImplementation(async () => { expect(persist).not.toHaveBeenCalled(); return done })
    await loginMobile(null, false, persist)
    expect(mockCompleteIdentity).toHaveBeenCalledWith(expect.any(String), identity, false)
    expect(verify).toHaveBeenCalledTimes(2)
    expect(persist).toHaveBeenCalledWith(expect.objectContaining({ passcode: 'model-passcode', loginToken: 'model-final' }))
  })

  it('preserves state and the original identity discovery failure without restarting SMS', async () => {
    jest.mocked(ZenMoney.readLine).mockResolvedValue('+12345678901')
    start.mockResolvedValue({ ...otp, nextFactor: 'IDENTITY' })
    const error = new Error('Model identity initialization failure')
    mockCompleteIdentity.mockRejectedValue(error)
    await expect(loginMobile(null, false, persist)).rejects.toBe(error)
    expect(start).toHaveBeenCalledTimes(1)
    expect(persist).not.toHaveBeenCalled()
  })

  it('does not return a financial session from an incomplete hot login', async () => {
    fast.mockResolvedValue(pin)
    await expect(loginMobile(auth, true, persist)).rejects.toThrow('did not complete')
    expect(persist).not.toHaveBeenCalled()
  })
})
