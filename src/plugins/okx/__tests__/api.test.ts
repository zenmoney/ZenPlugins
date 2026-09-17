import { login } from '../api'

const preferences = {
  apiKey: 'key',
  apiSecret: 'secret',
  passphrase: 'passphrase',
  accountLabel: 'OKX',
  startDate: '2026-01-01T00:00:00.000Z'
}

describe('OKX API regions', () => {
  it.each([
    ['global', 'https://openapi.okx.com'],
    ['eea', 'https://eea.okx.com'],
    ['us', 'https://us.okx.com'],
    ['tr', 'https://tr.okx.com']
  ] as const)('uses the official %s API domain', (region, baseUrl) => {
    expect(login({ ...preferences, region })).toMatchObject({ baseUrl })
  })

  it('keeps existing preferences on the global API', () => {
    expect(login(preferences)).toMatchObject({ baseUrl: 'https://openapi.okx.com' })
  })
})
