import { fetchAccountsWithCachedAuthFallback } from '../index'

describe('fetchAccountsWithCachedAuthFallback', () => {
  it('uses saved token when fetchAccounts succeeds', async () => {
    const auth = {
      device: { deviceId: 'saved-device' },
      accessToken: 'saved-token',
      sessionCode: 'saved-session'
    }
    const fetchAccounts = jest.fn().mockResolvedValue(['ok'])
    const login = jest.fn()

    const result = await fetchAccountsWithCachedAuthFallback(
      { phone: '87000000000', password: 'x' },
      auth,
      { fetchAccounts, login }
    )

    expect(result).toEqual(['ok'])
    expect(fetchAccounts).toHaveBeenCalledTimes(1)
    expect(login).not.toHaveBeenCalled()
  })

  it('clears stale token and re-logins when fetchAccounts fails', async () => {
    const auth = {
      device: { deviceId: 'saved-device' },
      accessToken: 'expired-token',
      sessionCode: 'expired-session'
    }
    const fetchAccounts = jest.fn()
      .mockRejectedValueOnce(new Error('expired'))
      .mockResolvedValueOnce(['ok-after-login'])
    const login = jest.fn().mockResolvedValue(undefined)

    const result = await fetchAccountsWithCachedAuthFallback(
      { phone: '87000000000', password: 'x' },
      auth,
      { fetchAccounts, login }
    )

    expect(result).toEqual(['ok-after-login'])
    expect(fetchAccounts).toHaveBeenCalledTimes(2)
    expect(login).toHaveBeenCalledTimes(1)
    expect(auth.accessToken).toBeUndefined()
    expect(auth.sessionCode).toBeUndefined()
  })
})
