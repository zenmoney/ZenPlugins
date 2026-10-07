import fetchMock from 'fetch-mock'
import { ZPAPIError } from '../../../errors'
const { fetchTransactions, getDeviceToken }: { fetchTransactions: (auth: object, product: object) => Promise<unknown>, getDeviceToken: (auth: object) => Promise<unknown> } = jest.requireActual('../api')
const { installFetchMockDeveloperFriendlyFallback }: { installFetchMockDeveloperFriendlyFallback: (mock: typeof fetchMock) => void } = jest.requireActual('../../../testUtils')

installFetchMockDeveloperFriendlyFallback(fetchMock)
const url = 'https://superapp.sensebank.com.ua/mob/history/card/getall?productId=card-id'
const auth = { accessToken: 'saved-token' }
const product = { productType: 'CARD', productId: 'card-id' }

beforeEach(() => { Object.assign(global, { ZenMoney: { features: {}, device: { manufacturer: 'Test', model: 'Device' } } }) })

describe('Sense API response failures', () => {
  it.each([
    { status: 403, body: '' },
    { status: 503, body: { code: 'fail.general.error' } },
    { status: 200, body: { code: 'unknown.protocol.state' } },
    { status: 200, body: { code: 'access.unauthenticated' } }
  ])('keeps an unexpected history response reportable: %j', async response => {
    fetchMock.getOnce(url, response)
    const error = await fetchTransactions(auth, product).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(error instanceof Error ? error.message : null).toMatch(/Unexpected Sense API response/)
    expect(error instanceof Error ? error.message : null).toContain(String(response.status))
    expect(auth.accessToken).toBe('saved-token')
  })

  it('preserves the original transport failure', async () => {
    const error = new Error('Connection error')
    fetchMock.getOnce(url, { throws: error })
    await expect(fetchTransactions(auth, product)).rejects.toBe(error)
  })

  it('retries a successful non-JSON loading response and then returns the real token', async () => {
    const tokenUrl = 'https://superapp.sensebank.com.ua/mob/device/token'
    fetchMock.postOnce(tokenUrl, { status: 200, body: '<html>loading</html>' })
    fetchMock.postOnce(tokenUrl, { status: 200, body: { code: 'OK', payload: { deviceToken: 'replacement-token' } } }, { overwriteRoutes: false })
    await expect(getDeviceToken({ device: { fingerPrint: 'test-fingerprint' } })).resolves.toBe('replacement-token')
    expect((fetchMock.calls() as unknown as { matched: unknown[] }).matched).toHaveLength(2)
  })
})
