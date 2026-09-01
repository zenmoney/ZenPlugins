import { InvalidPreferencesError } from '../../../../errors'
import { login, normalizeBaseUrl } from '../../api'

describe('Bybit login preferences', () => {
  it('uses the global API host by default', () => {
    expect(normalizeBaseUrl()).toBe('https://api.bybit.com')
  })

  it('accepts an official regional API host and trims a trailing slash', async () => {
    const auth = await login({
      apiKey: 'key',
      apiSecret: 'secret',
      baseUrl: ' https://api.bybit.kz/ ',
      startDate: '2026-01-01T00:00:00.000Z'
    })

    expect(auth.credentials.baseUrl).toBe('https://api.bybit.kz')
  })

  it('maps Brazil to the global endpoint with the required site id', async () => {
    const auth = await login({
      apiKey: 'key',
      apiSecret: 'secret',
      region: 'brazil',
      startDate: '2026-01-01T00:00:00.000Z'
    })
    expect(auth.credentials).toMatchObject({
      baseUrl: 'https://api.bybit.com', siteId: 'BRA_BTL'
    })
  })

  it.each([
    'http://api.bybit.com',
    'https://api.bybit.com.example.org',
    'https://api.bybit.com/path',
    'https://user:password@api.bybit.com'
  ])('rejects a non-official API base URL: %s', (baseUrl) => {
    expect(() => normalizeBaseUrl(baseUrl)).toThrow(InvalidPreferencesError)
  })
})
