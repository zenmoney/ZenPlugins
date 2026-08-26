import { requestPath, signRequest } from '../fetchApi'

describe('OKX request signing', () => {
  it('serializes the exact path that is signed', () => {
    const path = requestPath('/api/v5/asset/deposit-history', { after: 20, before: 10, limit: 100, empty: undefined })
    expect(path).toBe('/api/v5/asset/deposit-history?after=20&before=10&limit=100')
    expect(signRequest('secret', '2026-08-26T00:00:00.000Z', path)).toBe('OxGy/bCK6o9PTCbhhIzsqk9Ylwn9U5zMDJ6BaWtNn8Q=')
  })
})
