import fetchMock from 'fetch-mock'
import { readFileSync } from 'fs'
import { join } from 'path'
import { authenticate, fetchHistory, fetchOperationDetails, fetchArchiveProducts, fetchRequisites, formatBankDate, ModernSession, parseMultipart } from './modernApi'
import { JsonObject } from './modernValidation'
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
const transferDetail: { body: { uohId: string } } = jest.requireActual('./modern-fixtures/fee-fx/transfer-details.json')

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
  it('loads complete historical product snapshots and masks their contents and session header in logs', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    const fixture: { body: JsonObject } = jest.requireActual('./modern-fixtures/archive/products.json')
    const url = `https://${host}/personal-finance/pfmassets/v2/mobile/product/history/details`
    fetchMock.post(url, (_url: string, options: { body?: string }) => {
      expect(JSON.parse(options.body ?? '{}')).toEqual({ dateFrom: '2000-01-01', dateTo: '2026-10-26' })
      return { body: fixture }
    })
    expect(await fetchArchiveProducts(session, new Date('2026-10-25T22:30:00Z'))).toEqual(fixture.body)
    const logs = JSON.stringify(debug.mock.calls)
    expect(logs).not.toContain('model-session-secret')
    expect(logs).not.toContain('capitalOnDate')
  })

  it('requests actual old-card requisites once per card and masks the returned recipient data', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    const fixtures: Array<{ request: { id: number, type: string }, response: { body: JsonObject } }> = jest.requireActual('./modern-fixtures/archive/requisites.json')
    const first = fixtures[0]
    const url = `https://${host}/ufs-product-requisites/rest/v1/getProductRequisites`
    fetchMock.post(url, (_url: string, options: { body?: string }) => {
      expect(JSON.parse(options.body ?? '{}')).toEqual(first.request)
      return { body: first.response }
    })
    const id = String(first.request.id)
    expect(await fetchRequisites(session, [id, id])).toEqual(new Map([[id, first.response.body]]))
    expect(fetchMock.calls(url)).toHaveLength(1)
    const logs = JSON.stringify(debug.mock.calls)
    expect(logs).not.toContain('model-session-secret')
    expect(logs).not.toContain('productRequisites')
  })

  it('[model] propagates historical-product and requisite transport errors without partial success', async () => {
    const failure = new Error('Model archive transport failure')
    fetchMock.post(`https://${host}/personal-finance/pfmassets/v2/mobile/product/history/details`, { throws: failure })
    fetchMock.post(`https://${host}/ufs-product-requisites/rest/v1/getProductRequisites`, { throws: failure })
    await expect(fetchArchiveProducts(session)).rejects.toBe(failure)
    await expect(fetchRequisites(session, ['1234567890'])).rejects.toBe(failure)
  })

  it('loads the complete real transfer detail once and masks the session header in emitted logs', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    const url = `https://${host}/uoh-bh/v1/operation/details`
    fetchMock.post(url, (_url: string, options: { body?: string }) => {
      expect(JSON.parse(options.body ?? '{}')).toEqual({ uohId: transferDetail.body.uohId })
      return { body: transferDetail }
    })
    expect(await fetchOperationDetails(session, [transferDetail.body.uohId, transferDetail.body.uohId])).toEqual(new Map([[transferDetail.body.uohId, transferDetail.body]]))
    expect(fetchMock.calls(url)).toHaveLength(1)
    expect(JSON.stringify(debug.mock.calls)).not.toContain('model-session-secret')
    expect(JSON.stringify(debug.mock.calls)).toContain('/uoh-bh/v1/operation/details')
  })

  it('propagates detail transport failure instead of returning an unverified transfer', async () => {
    const failure = new Error('Model detail transport failure')
    fetchMock.post(`https://${host}/uoh-bh/v1/operation/details`, { throws: failure })
    await expect(fetchOperationDetails(session, [transferDetail.body.uohId])).rejects.toBe(failure)
  })

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
