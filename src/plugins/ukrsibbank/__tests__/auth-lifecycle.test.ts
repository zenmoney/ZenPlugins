import SHA256 from 'crypto-js/sha256'
const mockFetchJson = jest.fn()
jest.mock('../../../common/network', () => ({ fetchJson: (...args: unknown[]) => mockFetchJson(...args) }))
const saved = {
  schemaVersion: 1,
  loginHash: SHA256('+380991112233').toString(),
  device: { deviceId: '11111111-2222-4333-8444-555555555555' },
  authorization: 'old-authorization',
  refreshToken: 'old-refresh'
}
const preferences = { login: '+380992223344', password: 'current-password' }
const refreshed = { ok: true, status: 200, headers: { authorization: 'rotated-authorization', refreshtoken: 'rotated-refresh' }, body: undefined }

const { login }: { login: (preferences: object, background: boolean, state: object, onAuth: (auth: unknown) => unknown) => Promise<unknown> } = jest.requireActual('../api')

// These models verify saved-state compatibility and persistence ordering; response payloads do not establish bank classifications.
describe('[model] UKRSIB authorization state', () => {
  beforeEach(() => {
    mockFetchJson.mockReset()
    Object.assign(global, { ZenMoney: { device: {} } })
  })
  it('tries saved authorization despite changed login preferences and persists before later failure', async () => {
    const error = new Error('Post-login request failed')
    const persist = jest.fn()
    mockFetchJson.mockResolvedValueOnce(refreshed).mockImplementationOnce(async () => {
      expect(persist).toHaveBeenCalledWith(expect.objectContaining({ authorization: 'rotated-authorization', refreshToken: 'rotated-refresh', loginHash: saved.loginHash }))
      throw error
    })
    await expect(login(preferences, false, { auth: saved }, persist)).rejects.toBe(error)
    expect(mockFetchJson.mock.calls[0][0]).toMatch(/\/auth\/refreshtoken$/)
    expect(mockFetchJson).toHaveBeenCalledTimes(2)
  })
  it('does not persist a token from an unsuccessful response', async () => {
    const persist = jest.fn()
    mockFetchJson.mockResolvedValueOnce({ ...refreshed, ok: false, status: 500 })
    await expect(login(preferences, false, { auth: saved }, persist)).rejects.toBeInstanceOf(Error)
    expect(persist).not.toHaveBeenCalled()
    expect(mockFetchJson).toHaveBeenCalledTimes(1)
  })
})

it('[model] uses the observed rotated OTP authorization without persisting an incomplete login', async () => {
  const otp: { status: number, headers: { authorization: string }, body: unknown } = jest.requireActual('./otpRequired.json')
  const persist = jest.fn()
  const failure = new Error('OTP confirmation failed')
  mockFetchJson.mockReset()
  Object.assign(global, { ZenMoney: { device: {}, readLine: jest.fn(async () => '12345') } })
  mockFetchJson.mockResolvedValueOnce({ ok: true, status: 200, headers: { authorization: 'verification-authorization' } })
    .mockResolvedValueOnce({ ...otp, ok: false })
    .mockImplementationOnce(async (_url: unknown, options: { headers: { authorization: string } }) => {
      expect(options.headers.authorization).toBe(otp.headers.authorization)
      expect(persist).not.toHaveBeenCalled()
      throw failure
    })
  await expect(login(preferences, false, {}, persist)).rejects.toBe(failure)
  expect(persist).not.toHaveBeenCalled()
})
