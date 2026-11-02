import { UserInteractionError, ZPAPIError } from '../../../errors'
import type { Authorization, Session } from '../models'

const mockRefresh = jest.fn()
const mockTenant = jest.fn()
const mockSendEmail = jest.fn()
const mockVerifyEmail = jest.fn()
const mockVerifyPin = jest.fn()
const mockSendMfa = jest.fn()
const mockVerifyMfa = jest.fn()
jest.mock('../fetchApi', () => ({
  ...jest.requireActual('../fetchApi'),
  refreshAuthorization: mockRefresh,
  resolveTenant: mockTenant,
  sendEmailCode: mockSendEmail,
  verifyEmailCode: mockVerifyEmail,
  verifyPin: mockVerifyPin,
  sendMfaCode: mockSendMfa,
  verifyMfaCode: mockVerifyMfa
}))

// These are internal authorization/page objects, after the provider validation
// boundary. They test recovery, interaction and persistence, not bank parsing.
describe('[model] Q-Pay authentication lifecycle', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { authenticate, createClient, collectPages } = require('../api') as typeof import('../api')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { SessionExpiredError, QPayApiError } = require('../fetchApi') as typeof import('../fetchApi')
  const now = Date.parse('2026-01-01T00:00:00Z')
  const tokens: Authorization = {
    accessToken: 'model-access',
    refreshToken: 'model-refresh',
    expiresAt: now + 60000,
    stage: 'active',
    methods: [],
    pinReset: false
  }
  const stored: Session = {
    version: 2,
    email: 'saved@example.com',
    tenantId: 'model-tenant',
    device: { id: 'model-device', fingerprint: 'model-fingerprint' },
    ...tokens
  }
  const saveSession = jest.fn()
  const saveDevice = jest.fn()
  const readLine = jest.fn()
  const options = { isInBackground: false, saveSession, saveDevice }
  const preferences = { email: 'current@example.com' }
  let clock: jest.SpyInstance
  const originalZenMoney = global.ZenMoney

  beforeEach(() => {
    jest.clearAllMocks()
    readLine.mockReset()
    clock = jest.spyOn(Date, 'now').mockReturnValue(now)
    global.ZenMoney = { readLine } as unknown as typeof ZenMoney
    mockTenant.mockResolvedValue('model-tenant')
    mockSendEmail.mockResolvedValue(undefined)
    mockVerifyEmail.mockResolvedValue(tokens)
    mockVerifyPin.mockResolvedValue(tokens)
    mockVerifyMfa.mockResolvedValue(tokens)
    mockRefresh.mockResolvedValue(tokens)
  })
  afterEach(() => { clock.mockRestore(); global.ZenMoney = originalZenMoney })

  it('preserves a working session when preferences change and never sends a login email', async () => {
    await expect(authenticate(preferences, stored, undefined, options)).resolves.toBe(stored)
    expect(mockRefresh).not.toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
    expect(saveSession).not.toHaveBeenCalled()
  })

  it('propagates a transient refresh failure without replacing the stored authorization', async () => {
    const failure = new Error('model network failure')
    mockRefresh.mockRejectedValue(failure)
    await expect(authenticate(preferences, { ...stored, expiresAt: now - 1 }, undefined, options)).rejects.toBe(failure)
    expect(mockSendEmail).not.toHaveBeenCalled()
    expect(saveSession).not.toHaveBeenCalled()
  })

  it('reuses the rotated session on a separate subsequent run without asking for any code', async () => {
    const rotated: Authorization = { ...tokens, accessToken: 'model-new-access', refreshToken: 'model-new-refresh' }
    mockRefresh.mockResolvedValue(rotated)
    let persisted: Session | undefined
    const checkpoint = { ...options, saveSession: (session: Session) => { persisted = session } }
    const first = await authenticate(preferences, { ...stored, expiresAt: now - 1 }, undefined, checkpoint)
    expect(persisted).toEqual({ ...stored, ...rotated })
    const second = await authenticate(preferences, persisted, undefined, checkpoint)
    expect(second).toBe(first)
    expect(mockRefresh).toHaveBeenCalledTimes(1)
    expect(mockSendEmail).not.toHaveBeenCalled()
    expect(readLine).not.toHaveBeenCalled()
  })

  it('resumes a saved PIN stage without sending another email challenge', async () => {
    readLine.mockResolvedValueOnce('1234')
    const pending: Session = { ...stored, stage: 'pending_pin' }
    await expect(authenticate(preferences, pending, undefined, options)).resolves.toEqual({ ...pending, ...tokens })
    expect(mockSendEmail).not.toHaveBeenCalled()
    expect(mockVerifyPin).toHaveBeenCalledWith(pending, '1234')
    expect(saveSession).toHaveBeenCalledWith({ ...pending, ...tokens })
  })

  it('completes email authentication without PIN when the server grants an active session', async () => {
    readLine.mockResolvedValueOnce('123456')
    const session = await authenticate(preferences, undefined, undefined, options)
    expect(session.stage).toBe('active')
    expect(readLine).toHaveBeenCalledTimes(1)
    expect(mockVerifyEmail).toHaveBeenCalledTimes(1)
    expect(mockVerifyPin).not.toHaveBeenCalled()
    expect(mockVerifyMfa).not.toHaveBeenCalled()
    expect(saveSession).toHaveBeenCalledWith(session)
  })

  it('completes MFA without PIN when MFA grants an active session', async () => {
    readLine.mockResolvedValueOnce('123456')
    const pending: Session = { ...stored, stage: 'pending_mfa', methods: ['totp'] }
    await expect(authenticate(preferences, pending, undefined, options)).resolves.toEqual({ ...pending, ...tokens })
    expect(mockVerifyMfa).toHaveBeenCalledWith(pending, 'totp', '123456')
    expect(mockVerifyPin).not.toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
    expect(readLine).toHaveBeenCalledTimes(1)
  })

  it('allows normal PIN verification when the server also offers PIN recovery', async () => {
    // Current official UI uses next_step.pin_reset to offer a Forgot PIN action;
    // it still permits normal PIN verification on the same pending session.
    readLine.mockResolvedValueOnce('1234')
    const pending: Session = { ...stored, stage: 'pending_pin', pinReset: true }
    await expect(authenticate(preferences, pending, undefined, options)).resolves.toEqual({ ...pending, ...tokens })
    expect(mockVerifyPin).toHaveBeenCalledWith(pending, '1234')
    expect(mockSendEmail).not.toHaveBeenCalled()
    expect(saveSession).toHaveBeenCalledWith({ ...pending, ...tokens })
  })

  it('stops a background cold login before sending an external challenge', async () => {
    await expect(authenticate(preferences, undefined, undefined, { ...options, isInBackground: true }))
      .rejects.toBeInstanceOf(UserInteractionError)
    expect(mockTenant).not.toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
    expect(readLine).not.toHaveBeenCalled()
  })

  it('uses current preferences for cold recovery after a confirmed refresh rejection', async () => {
    mockRefresh.mockRejectedValue(new SessionExpiredError())
    readLine.mockResolvedValue('123456')
    const session = await authenticate(preferences, { ...stored, expiresAt: now - 1 }, undefined, options)
    expect(mockSendEmail).toHaveBeenCalledWith('model-tenant', 'current@example.com')
    expect(mockVerifyEmail).toHaveBeenCalledWith('model-tenant', 'current@example.com', '123456', stored.device)
    expect(saveSession).toHaveBeenCalledWith(session)
  })

  it('rejects absent required input before attempting code verification', async () => {
    readLine.mockResolvedValue(null)
    const error = await authenticate(preferences, undefined, undefined, options).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(mockVerifyEmail).not.toHaveBeenCalled()
    expect(saveSession).not.toHaveBeenCalled()
  })

  it('persists each confirmed stage before asking the server to complete the next stage', async () => {
    const pending: Authorization = { ...tokens, stage: 'pending_pin' }
    mockVerifyEmail.mockResolvedValue(pending)
    readLine.mockResolvedValueOnce('123456').mockResolvedValueOnce('1234')
    mockVerifyPin.mockImplementation(async () => {
      expect(saveSession).toHaveBeenLastCalledWith(expect.objectContaining({ stage: 'pending_pin' }))
      return tokens
    })
    const result = await authenticate(preferences, undefined, undefined, options)
    expect(result.stage).toBe('active')
    expect(saveSession).toHaveBeenCalledTimes(2)
    expect(saveSession).toHaveBeenLastCalledWith(result)
  })

  it('blocks pending MFA delivery in background before sending SMS or email', async () => {
    await expect(authenticate(preferences, { ...stored, stage: 'pending_mfa', methods: ['sms'] }, undefined,
      { ...options, isInBackground: true })).rejects.toBeInstanceOf(UserInteractionError)
    expect(mockSendMfa).not.toHaveBeenCalled()
    expect(readLine).not.toHaveBeenCalled()
  })

  it('persists rotated authorization before retrying a data request and preserves a later failure', async () => {
    const rotated: Authorization = { ...tokens, accessToken: 'model-rotated-access', refreshToken: 'model-rotated-refresh' }
    mockRefresh.mockResolvedValue(rotated)
    const client = await createClient(preferences, stored, undefined, options)
    const failure = new Error('model history failure')
    const action = jest.fn()
      .mockRejectedValueOnce(new SessionExpiredError())
      .mockImplementationOnce(async () => {
        expect(saveSession).toHaveBeenLastCalledWith({ ...stored, ...rotated })
        throw failure
      })
    await expect(client.run(action)).rejects.toBe(failure)
    expect(mockRefresh).toHaveBeenCalledTimes(1)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('does not interpret an unrelated HTTP rejection as an expired session', async () => {
    const client = await createClient(preferences, stored, undefined, options)
    const failure = new QPayApiError(403, 'ACCOUNT_RESTRICTED')
    await expect(client.run(async () => { throw failure })).rejects.toBe(failure)
    expect(mockRefresh).not.toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('follows a cursor after a short page and deduplicates overlapping records', async () => {
    const load = jest.fn()
      .mockResolvedValueOnce({ items: [{ id: 'model-a' }], nextCursor: 'model-next' })
      .mockResolvedValueOnce({ items: [{ id: 'model-a' }, { id: 'model-b' }], nextCursor: null })
    await expect(collectPages(load)).resolves.toEqual([{ id: 'model-a' }, { id: 'model-b' }])
    expect(load).toHaveBeenLastCalledWith('model-next')
  })

  it('rejects repeated cursors rather than accepting incomplete history', async () => {
    const load = jest.fn().mockResolvedValue({ items: [], nextCursor: 'model-repeat' })
    const error = await collectPages(load).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(load).toHaveBeenCalledTimes(2)
  })
})
