import { readFileSync } from 'fs'
import { join } from 'path'
import get, { getArray, getString } from '../../../types/get'
import { login, passwordFields } from '../api'
import { UserInteractionError } from '../../../errors'
import fetchMock from 'fetch-mock'

const evidence: unknown = JSON.parse(readFileSync(join(__dirname, 'fixtures/auth.json'), 'utf8'))
const auth = getArray({ evidence }, 'evidence')
const appAuth: unknown = JSON.parse(readFileSync(join(__dirname, 'fixtures/app-approval-auth.json'), 'utf8'))
const confirmation: unknown = JSON.parse(readFileSync(join(__dirname, 'fixtures/pending-confirmation.json'), 'utf8'))
const approvalSuccess: unknown = JSON.parse(readFileSync(join(__dirname, 'fixtures/app-approval-success.json'), 'utf8'))
const preferences = { phone: '79990000000', password: 'password', countryCode: 'RU' }

beforeEach(() => {
  fetchMock.catch({ throws: new Error('Unexpected model network request') })
  global.ZenMoney = {
    device: { manufacturer: 'Apple', model: 'iPhone', os: { name: 'ios', version: '27.0' } },
    readLine: jest.fn().mockResolvedValue('000000'),
    alert: jest.fn().mockResolvedValue(undefined)
  } as unknown as typeof ZenMoney
})
afterEach(() => fetchMock.restore())

describe('[model] authentication invariants', () => {
  // These cases model cryptographic and host lifecycle invariants, not bank error codes.
  it('computes the independently verified digest constructions', () => {
    expect(passwordFields('79990000000', 'password')).toEqual({
      password: '5f4dcc3b5aa765d61d8327deb882cf99',
      password2: '9e2c7b3c2e05a5f33aa57802ddfe57e7',
      password3: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
    })
  })

  it('stops background cold authentication before any request can send SMS', async () => {
    await expect(login(preferences, null, true, jest.fn())).rejects.toBeInstanceOf(UserInteractionError)
    expect(fetchMock.calls()).toEqual({ matched: [], unmatched: [] })
  })

  it('reuses saved authorization even when preferences change', async () => {
    const saved = { version: 1 as const, deviceId: '00000000-0000-4000-8000-000000000000', token: 'test-token', otpVerified: true }
    await expect(login({ ...preferences, password: '' }, saved, true, jest.fn())).resolves.toEqual(saved)
  })

  it('persists pending and verified tokens before subsequent work', async () => {
    // Real response envelopes are loaded below; only callbacks/host input are modeled.
    fetchMock.postOnce('https://bakai24.bakai.kg/v2/get_login', { body: (auth[0] as { response: unknown }).response })
    fetchMock.postOnce('https://bakai24.bakai.kg/v2/auth', { body: (auth[1] as { response: unknown }).response })
    fetchMock.postOnce('https://bakai24.bakai.kg/v2/verify_otp', { body: (auth[2] as { response: unknown }).response })
    const persist = jest.fn()
    const result = await login(preferences, null, false, persist)
    expect(persist.mock.calls.map(call => call[0])).toEqual([
      { version: 1, deviceId: result.deviceId, token: null, otpVerified: false },
      { version: 1, deviceId: result.deviceId, token: getString((auth[1] as { response: unknown }).response, 'token'), otpVerified: false },
      { ...result, otpVerified: true }
    ])
  })

  it('preserves pending authorization and the original failure when OTP verification fails', async () => {
    const pending = { version: 1 as const, deviceId: '00000000-0000-4000-8000-000000000000', token: 'test-token', otpVerified: false }
    const failure = new Error('Model transport failure')
    fetchMock.postOnce('https://bakai24.bakai.kg/v2/verify_otp', { throws: failure })
    const persist = jest.fn()
    await expect(login(preferences, pending, false, persist)).rejects.toBe(failure)
    expect(persist).not.toHaveBeenCalled()
    expect(fetchMock.calls('https://bakai24.bakai.kg/v2/auth')).toHaveLength(0)
  })

  it('rejects required absent input without sending an unchecked OTP', async () => {
    const pending = { version: 1 as const, deviceId: '00000000-0000-4000-8000-000000000000', token: 'test-token', otpVerified: false }
    jest.mocked(ZenMoney.readLine).mockResolvedValue(null)
    await expect(login(preferences, pending, false, jest.fn())).rejects.toBeInstanceOf(Error)
    expect(fetchMock.calls()).toEqual({ matched: [], unmatched: [] })
  })

  it('shows the observed app approval number and does not request SMS while approval is pending', async () => {
    fetchMock.postOnce('https://bakai24.bakai.kg/v2/get_login', { body: (auth[0] as { response: unknown }).response })
    fetchMock.postOnce('https://bakai24.bakai.kg/v2/auth', { body: get(appAuth, 'response') })
    fetchMock.post('https://bakai24.bakai.kg/v2/users.check_confirmation', { body: get(confirmation, 'response') })
    const persist = jest.fn()
    await expect(login(preferences, null, false, persist)).rejects.toBeInstanceOf(Error)
    expect(ZenMoney.alert).toHaveBeenCalledWith(expect.stringContaining('42'))
    expect(ZenMoney.readLine).not.toHaveBeenCalled()
    expect(fetchMock.calls('https://bakai24.bakai.kg/v2/ask_otp')).toHaveLength(0)
    expect(persist.mock.calls.at(-1)?.[0]).toEqual(expect.objectContaining({ appApprovalPending: true, otpVerified: false }))
  })

  it('resumes app approval without credentials or a new auth request and stops background interaction', async () => {
    const pending = { version: 1 as const, deviceId: '00000000-0000-4000-8000-000000000000', token: 'test-token', otpVerified: false, appApprovalPending: true }
    await expect(login({ ...preferences, password: '' }, pending, true, jest.fn())).rejects.toBeInstanceOf(UserInteractionError)
    expect(fetchMock.calls()).toEqual({ matched: [], unmatched: [] })
    fetchMock.post('https://bakai24.bakai.kg/v2/users.check_confirmation', { body: get(confirmation, 'response') })
    const canceled = new Error('Model canceled approval dialog')
    jest.mocked(ZenMoney.alert).mockRejectedValue(canceled)
    await expect(login({ ...preferences, password: '' }, pending, false, jest.fn())).rejects.toBe(canceled)
    expect(fetchMock.calls('https://bakai24.bakai.kg/v2/auth')).toHaveLength(0)
    expect(ZenMoney.readLine).not.toHaveBeenCalled()
  })

  it('completes observed number approval, sends SMS only after confirmation and saves verified authorization', async () => {
    const records = getArray(approvalSuccess, 'records')
    fetchMock.postOnce('https://bakai24.bakai.kg/v2/get_login', { body: (auth[0] as { response: unknown }).response })
    fetchMock.postOnce('https://bakai24.bakai.kg/v2/auth', { body: get(appAuth, 'response') })
    fetchMock.post('https://bakai24.bakai.kg/v2/users.check_confirmation', (_url, _options) => {
      const index = fetchMock.calls('https://bakai24.bakai.kg/v2/users.check_confirmation').length - 1
      return { body: get(records[index], 'response') }
    })
    fetchMock.postOnce('https://bakai24.bakai.kg/v2/ask_otp', () => {
      expect(ZenMoney.alert).toHaveBeenCalledTimes(1)
      expect(fetchMock.calls('https://bakai24.bakai.kg/v2/users.check_confirmation')).toHaveLength(2)
      return { body: get(records[2], 'response') }
    })
    fetchMock.postOnce('https://bakai24.bakai.kg/v2/verify_otp', { body: get(records[3], 'response') })
    const persist = jest.fn()
    const state = await login(preferences, null, false, persist)
    expect(state).toEqual({ version: 1, deviceId: expect.any(String), token: getString(get(appAuth, 'response'), 'token'), otpVerified: true, appApprovalPending: false })
    expect(persist).toHaveBeenLastCalledWith(state)
    expect(persist.mock.calls[persist.mock.calls.length - 2][0]).toEqual({ ...state, otpVerified: false })
    expect(ZenMoney.readLine).toHaveBeenCalledTimes(1)
  })
})
