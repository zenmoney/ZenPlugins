import fetchMock from 'fetch-mock'
import { fetchApi } from '../fetchApi'
import { BASE_API_URL } from '../models'

describe('[model] Belarusbank request headers', () => {
  beforeEach(() => {
    jest.spyOn(console, 'debug').mockImplementation(() => {})
    Object.defineProperty(globalThis, 'ZenMoney', {
      configurable: true,
      value: { features: { binaryResponseBody: true } } as unknown as typeof ZenMoney
    })
  })

  afterEach(() => {
    fetchMock.restore()
    jest.restoreAllMocks()
  })

  it('sends Accept-Language, without which the bank API answers HTTP 500 to cards and accounts requests', async () => {
    const url = `${BASE_API_URL}cards`
    fetchMock.get(url, { cards: [] })
    await fetchApi('cards', { sessionToken: 'model-session-token', platformType: 'pwa' })
    expect(fetchMock.lastCall(url)?.[1]?.headers).toMatchObject({
      Authorization: 'Bearer model-session-token',
      'Accept-Language': 'ru',
      'Platform-Type': 'pwa'
    })
  })
})
