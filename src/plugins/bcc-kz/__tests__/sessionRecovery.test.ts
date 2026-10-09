import fetchMock from 'fetch-mock'
import { UserInteractionError } from '../../../errors'
const { fetchTransactions, login, SessionExpiredError, withAuthRecovery }: {
  fetchTransactions: (auth: unknown, product: unknown, from: Date, to: Date) => Promise<unknown>
  login: (preferences: unknown, auth: unknown, isInBackground: boolean) => Promise<void>
  SessionExpiredError: new () => Error
  withAuthRecovery: (preferences: unknown, auth: unknown, action: () => Promise<unknown>, options: { isInBackground?: boolean, onAuth?: () => void }, deps: { login: () => Promise<void> }) => Promise<unknown>
} = jest.requireActual('../api')
const fixture: { status: number, body: { reason: string } } = jest.requireActual('../__fixtures__/session-expired-157368.json')

const preferences = { phone: '87000000000', password: 'model-password' }
const createAuth = (): Record<string, unknown> => ({ accessToken: 'model-token', sessionCode: 'model-session', device: { deviceId: 'model-device' } })

afterEach(() => {
  fetchMock.restore()
  jest.restoreAllMocks()
})

it('recognizes the observed session expiration during a statement request', async () => {
  ;(global as { ZenMoney?: unknown }).ZenMoney = { features: {} }
  fetchMock.get(/m\.bcc\.kz\/mb\//, { status: fixture.status, body: fixture.body })
  await expect(fetchTransactions(createAuth(), { productId: 'model-account' }, new Date('2026-10-01Z'), new Date('2026-10-08Z')))
    .rejects.toBeInstanceOf(SessionExpiredError)
})

describe('[model] session recovery invariants', () => {
  // These callbacks model control flow, not bank response formats.
  it('retries the complete action once and persists new auth before another failure', async () => {
    const auth = createAuth()
    const unexpected = new Error('statement schema changed')
    const action = jest.fn().mockRejectedValueOnce(new SessionExpiredError()).mockRejectedValueOnce(unexpected)
    const saved: unknown[] = []
    const authenticate = jest.fn(async () => { auth.accessToken = 'new-model-token'; auth.sessionCode = 'new-model-session' })
    await expect(withAuthRecovery(preferences, auth, action, { onAuth: () => saved.push({ ...auth }) }, { login: authenticate }))
      .rejects.toBe(unexpected)
    expect(action).toHaveBeenCalledTimes(2)
    expect(authenticate).toHaveBeenCalledTimes(1)
    expect(saved).toEqual([{ ...auth }])
    expect(saved[0]).toMatchObject({ accessToken: 'new-model-token', device: { deviceId: 'model-device' } })
  })

  it('does not retry or erase auth on an unknown error', async () => {
    const auth = createAuth()
    const error = new Error('unknown failure')
    const authenticate = jest.fn()
    await expect(withAuthRecovery(preferences, auth, async () => { throw error }, {}, { login: authenticate })).rejects.toBe(error)
    expect(authenticate).not.toHaveBeenCalled()
    expect(auth).toEqual(createAuth())
  })

  it('does not loop when the replacement session expires', async () => {
    const action = jest.fn().mockRejectedValue(new SessionExpiredError())
    const authenticate = jest.fn()
    await expect(withAuthRecovery(preferences, createAuth(), action, {}, { login: authenticate })).rejects.toBeInstanceOf(SessionExpiredError)
    expect(action).toHaveBeenCalledTimes(2)
    expect(authenticate).toHaveBeenCalledTimes(1)
  })

  it('stops background recovery before sending login or SMS requests', async () => {
    const authenticate = jest.fn()
    await expect(withAuthRecovery(preferences, createAuth(), async () => { throw new SessionExpiredError() }, { isInBackground: true }, { login: authenticate }))
      .rejects.toBeInstanceOf(UserInteractionError)
    expect(authenticate).not.toHaveBeenCalled()
    await expect(login(preferences, { device: { deviceId: 'model' } }, true)).rejects.toBeInstanceOf(UserInteractionError)
    expect(fetchMock.called()).toBe(false)
  })

  it('redacts session URLs and response cookies in the actual network log', async () => {
    ;(global as { ZenMoney?: unknown }).ZenMoney = { features: {} }
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.get(/m\.bcc\.kz\/mb\//, {
      status: fixture.status, body: fixture.body, headers: { 'set-cookie': 'mbsessionid=model-cookie-secret' }
    })
    await expect(fetchTransactions(createAuth(), { productId: 'model-account' }, new Date('2026-10-01Z'), new Date('2026-10-08Z'))).rejects.toThrow()
    const log = JSON.stringify(debug.mock.calls)
    for (const secret of ['model-token', 'model-session', 'model-cookie-secret']) expect(log).not.toContain(secret)
    expect(log).toContain('GET_EXT_STATEMENT')
    expect(log).toContain('model-account')
    expect(log).toContain(fixture.body.reason)
  })
})
