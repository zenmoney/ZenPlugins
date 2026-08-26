import { login } from '../api'

describe('Bitget credentials', () => {
  it('keeps the three read-only API credentials', () => {
    expect(login({
      apiKey: 'key',
      apiSecret: 'secret',
      passphrase: 'passphrase',
      startDate: '2026-01-01T00:00:00.000Z'
    })).toEqual({ apiKey: 'key', apiSecret: 'secret', passphrase: 'passphrase' })
  })
})
