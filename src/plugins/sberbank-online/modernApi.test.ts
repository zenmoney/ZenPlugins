import fetchMock from 'fetch-mock'
import { readFileSync } from 'fs'
import { join } from 'path'
import { authenticate, fetchHistory, formatBankDate, ModernSession, parseMultipart } from './modernApi'
import { UserInteractionError } from '../../errors'

const operations: unknown[] = jest.requireActual('./modern-fixtures/operations.json')
const primaryXml = readFileSync(join(__dirname, 'modern-fixtures/primary.xml'), 'utf8')
const host = 'mobile-node3.online.sberbank.ru:8543'
const historyUrl = `https://${host}/uoh-bh/v1/operations/list`
const primaryUrl = 'https://online.sberbank.ru:4477/CSAMAPI/login.do'
const aggregateUrl = `https://${host}/sm-uko/v3/mobile/aggregate/session/create`
const session: ModernSession = { host, sessionId: 'model-session-secret', dataModel: {} }
const device = { id: 'model-device', idOld: 'model-old-device', model: 'Seeker' }
const preferences = { login: 'model-login-secret', pin: '12345' }
const savedAuth = { guid: 'model-guid-secret' }
const originalZenMoney = global.ZenMoney

beforeEach(() => { Object.assign(global, { ZenMoney: { readLine: jest.fn() } }) })
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks(); global.ZenMoney = originalZenMoney })

// [model] Multipart framing must reject truncated/ambiguous data, independently of bank fields.
describe('[model] aggregate framing', () => {
  const part = (code: string): string => `--model-boundary\r\nX-UFS-SubsystemCode: ${code}\r\nContent-Type: application/json\r\n\r\n{"success":true,"body":{}}\r\n`
  const complete = part('SM_UKO') + part('MAIN_SCREEN') + '--model-boundary--\r\n'
  it('accepts quoted boundaries and requires both successful subsystems', () => {
    expect(parseMultipart(complete, 'multipart/mixed; boundary="model-boundary"')).toEqual({ SM_UKO: { success: true, body: {} }, MAIN_SCREEN: { success: true, body: {} } })
  })
  it('rejects missing parts, duplicate subsystem IDs and truncated bodies', () => {
    expect(() => parseMultipart(part('SM_UKO') + '--model-boundary--', 'multipart/mixed; boundary=model-boundary')).toThrow('Incomplete bank session')
    expect(() => parseMultipart(part('SM_UKO') + complete, 'multipart/mixed; boundary=model-boundary')).toThrow('duplicate')
    expect(() => parseMultipart(complete.slice(0, -6), 'multipart/mixed; boundary=model-boundary')).toThrow('Incomplete aggregate')
  })
})

// Real source records and observed empty-page termination; no synthetic bank error classification.
describe('modern history transport', () => {
  it('continues after a short page, keeps the interval, and masks session headers in emitted diagnostics', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    const bodies: Array<Record<string, unknown>> = []
    fetchMock.post(historyUrl, (_url: string, options: { body?: string }) => {
      bodies.push(JSON.parse(options.body ?? '{}'))
      return { body: { success: true, body: { operations: bodies.length === 1 ? operations : [] } } }
    })
    expect(await fetchHistory(session, new Date('2026-10-17T21:00:00Z'))).toEqual(operations)
    expect(bodies).toEqual([
      { from: '18.10.2026T00:00:00', paginationSize: 100, paginationOffset: 0 },
      { from: '18.10.2026T00:00:00', paginationSize: 100, paginationOffset: operations.length }
    ])
    const logs = JSON.stringify(debug.mock.calls)
    expect(logs).not.toContain('model-session-secret')
    expect(logs).toContain('/uoh-bh/v1/operations/list')
    expect(logs).toContain('operations')
  })

  it('preserves a transport failure instead of returning partial history', async () => {
    const failure = new Error('Model history transport failure')
    fetchMock.post(historyUrl, { throws: failure })
    await expect(fetchHistory(session, new Date('2026-10-17T21:00:00Z'))).rejects.toBe(failure)
  })

  it('uses Moscow dates at the interval boundary', () => {
    expect(formatBankDate(new Date('2026-10-17T21:00:00Z'))).toBe('18.10.2026T00:00:00')
  })
})

// [model] Confirmed device authorization survives downstream failures; unknown hot failures never register a device.
describe('[model] authorization persistence and interaction', () => {
  it('persists the registered device before session creation fails, masking tokens and PIN in diagnostics', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    const persist = jest.fn(async () => {})
    const failure = new Error('Model aggregate transport failure')
    fetchMock.post(primaryUrl, primaryXml)
    fetchMock.post(aggregateUrl, () => {
      expect(persist).toHaveBeenCalledWith(savedAuth)
      throw failure
    })
    await expect(authenticate(preferences, savedAuth, device, persist)).rejects.toBe(failure)
    expect(persist).toHaveBeenCalledTimes(1)
    expect(global.ZenMoney.readLine).not.toHaveBeenCalled()
    const logs = JSON.stringify(debug.mock.calls)
    for (const secret of ['model-login-secret', 'model-guid-secret', 'model-token-secret', 'model-externalToken-secret', '12345']) expect(logs).not.toContain(secret)
    expect(logs).toContain('mobile-node3.online.sberbank.ru:8543')
  })

  it('does not start registration or SMS delivery in the background', async () => {
    fetchMock.post(primaryUrl, { throws: new Error('Network must not be used') })
    await expect(authenticate(preferences, undefined, device, jest.fn(), true)).rejects.toBeInstanceOf(UserInteractionError)
    expect(fetchMock.called()).toBe(false)
    expect(global.ZenMoney.readLine).not.toHaveBeenCalled()
  })

  it('propagates an unknown hot-login failure without replacing saved authorization', async () => {
    const failure = new Error('Model hot transport failure')
    const persist = jest.fn()
    fetchMock.post(primaryUrl, { throws: failure })
    await expect(authenticate(preferences, savedAuth, device, persist)).rejects.toBe(failure)
    expect(persist).not.toHaveBeenCalled()
    expect(global.ZenMoney.readLine).not.toHaveBeenCalled()
  })
})
