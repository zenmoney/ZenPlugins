jest.mock('../../../../common/network', () => ({
  fetch: jest.fn(),
  fetchJson: jest.fn(),
  openWebViewAndInterceptRequest: jest.fn(),
  RequestInterceptMode: {}
}))

jest.mock('../../config', () => ({
  clientId: 'client-id',
  clientSecret: 'client-secret',
  redirectUri: 'https://example.test/callback'
}), { virtual: true })

const { fetchJson } = require('../../../../common/network')
const { fetchAccounts } = require('../../api')

describe('fetchAccounts', () => {
  beforeEach(() => {
    fetchJson.mockReset()
  })

  it('requests reauthorization when the bank returns no response', async () => {
    fetchJson.mockRejectedValue(new Error('Network error'))

    await expect(fetchAccounts({ accessToken: 'access-token' })).resolves.toBeNull()
  })
})
