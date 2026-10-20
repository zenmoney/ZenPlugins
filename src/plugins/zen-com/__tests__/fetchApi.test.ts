import fetchMock from 'fetch-mock'
import { fetchAccountPage, fetchHistoryPage } from '../fetchApi'
import { accountsResponse } from '../__fixtures__/accounts'
import page1 from '../__fixtures__/mobile-history-page1.json'
import validationError from '../__fixtures__/mobile-device-validation-error.json'
import { arrayAt, stringAt } from '../validation'
import { ZPAPIError } from '../../../errors'

const session = { deviceId: 'model-device-secret', accessToken: 'model-access-secret' }
const base = 'https://api.zen.com/mobile'
beforeEach(() => {
  global.ZenMoney = { device: { os: { name: 'android', version: '9' }, model: 'Sync' } } as unknown as typeof ZenMoney
})
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

describe('ZEN.COM direct mobile transport', () => {
  it('returns the complete native account response without a portal request', async () => {
    fetchMock.get(`${base}/v2/accounts?hidden=true&checkCache=false`, JSON.stringify(accountsResponse))
    expect(await fetchAccountPage(session)).toEqual(accountsResponse)
    expect(fetchMock.lastOptions()?.headers).toEqual(expect.objectContaining({ 'Access-Token': session.accessToken, 'Device-Id': session.deviceId }))
    expect(fetchMock.lastOptions()?.body).toBeUndefined()
  })

  it('uses the native cursor without inventing a page-size query', async () => {
    const cursor = stringAt(arrayAt(page1, 'historyEntries')[19], 'id')
    fetchMock.get(`${base}/history-entries?lastHistoryEntryId=${cursor}`, JSON.stringify(page1))
    expect(await fetchHistoryPage(session, cursor)).toEqual(page1)
  })

  it('keeps unknown bank failures ordinary and reportable', async () => {
    fetchMock.get(`${base}/v2/accounts?hidden=true&checkCache=false`, { status: 400, body: JSON.stringify(validationError) })
    const error = await fetchAccountPage(session).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
  })

  // Model network/header secrets only; successful response bodies remain captured.
  it('[model] propagates transport errors unchanged without retrying', async () => {
    const failure = new Error('Model mobile network failure')
    fetchMock.get(`${base}/history-entries`, { throws: failure })
    await expect(fetchHistoryPage(session)).rejects.toBe(failure)
  })

  it('[model] masks auth, personal fields and cookies in actual financial logs while preserving useful data', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.get(`${base}/history-entries`, {
      body: JSON.stringify(page1), headers: { 'Set-Cookie': 'model-cookie=secret-cookie', 'Request-Id': 'model-request-id' }
    })
    expect(await fetchHistoryPage(session)).toEqual(page1)
    const logs = JSON.stringify(debug.mock.calls)
    for (const secret of ['model-device-secret', 'model-access-secret', 'secret-cookie', 'Alex Example', 'Taylor Example', 'Example Street', '10000 Example City']) expect(logs).not.toContain(secret)
    for (const diagnostic of ['HTP_PURCHASE', 'MP101 OAZA', '1309.65', 'mcc', 'model-request-id']) expect(logs).toContain(diagnostic)
    expect(debug.mock.calls.some(call => call[0] === 'request')).toBe(true)
    expect(debug.mock.calls.some(call => call[0] === 'response')).toBe(true)
  })
})
