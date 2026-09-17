import { login } from '../api'

describe('MEXC credentials', () => {
  it('keeps only the read-only API credentials', () => {
    expect(login({ apiKey: 'key', apiSecret: 'secret', startDate: '2026-01-01T00:00:00.000Z' })).toEqual({ apiKey: 'key', apiSecret: 'secret' })
  })
})
