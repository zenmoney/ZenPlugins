export {}

interface DeviceState {
  version: number
  accountHash: string
  deviceNo: string
  otpKey: string
  identity: { dpassDeviceId: string, manufacturer: string, model: string }
}
interface Authorization { deviceNo: string, otp: string }
interface ProviderOptions {
  generateOtp?: (state: DeviceState, pin: string, now?: number) => string
  waitForNextOtpPeriod?: () => Promise<void>
}
type Provider = (options?: { afterOtp: string }) => Promise<Authorization>
const { createDeviceState, generateDeviceOtp, createDeviceAuthorizationProvider }: {
  createDeviceState: (options: { login: string, deviceNo: string, otpKey: string, identity: DeviceState['identity'] }) => DeviceState
  generateDeviceOtp: (state: DeviceState, pin: string, now?: number) => string
  createDeviceAuthorizationProvider: (state: DeviceState, pin: string, initialOtp: string, options?: ProviderOptions) => Provider
} = jest.requireActual('../deviceOtp')

const periodMs = 30000
const periodStart = Math.floor(Date.parse('2026-07-28T12:34:56.000Z') / periodMs) * periodMs
// This is the unchanged public synthetic cryptographic vector from deviceOtp.test.js, not a bank capture.
const pin = '582041'
const state = createDeviceState({
  login: 'User.Login',
  deviceNo: '123456',
  otpKey: Buffer.from(Array.from({ length: 20 }, (_value, index) => index + 1)).toString('hex'),
  identity: { dpassDeviceId: '00112233445566778899aabbccddeeff', manufacturer: 'unknown', model: 'Android SDK built for x86' }
})
const initialState: DeviceState = JSON.parse(JSON.stringify(state)) as DeviceState

function authorizationAt (now: number): Authorization {
  return { deviceNo: state.deviceNo, otp: generateDeviceOtp(state, pin, now) }
}

function provider (options?: ProviderOptions): Provider {
  return createDeviceAuthorizationProvider(state, pin, generateDeviceOtp(state, pin, periodStart - 1), options)
}

afterEach(() => {
  jest.useRealTimers()
  expect(state).toEqual(initialState)
})

// [model] These tests verify clock safety and explicit refresh without assuming a bank replay/acceptance window.
describe('[model] protected-action device authorization freshness', () => {
  it('returns the current period to a second caller after the first promise crossed a boundary', async () => {
    jest.useFakeTimers({ now: periodStart + periodMs - 3000, doNotFake: ['performance'] })
    const getAuthorization = provider()
    const previous = authorizationAt(Date.now())
    const first = getAuthorization()
    jest.setSystemTime(periodStart + periodMs + 1)
    const second = getAuthorization()

    expect(await first).toEqual(previous)
    expect(await second).toEqual(authorizationAt(Date.now()))
  })

  it('waits for the real next period when a code has less than two seconds remaining', async () => {
    jest.useFakeTimers({ now: periodStart + periodMs - 1, doNotFake: ['performance'] })
    const getAuthorization = provider()
    const result = getAuthorization()
    expect(jest.getTimerCount()).toBe(1)

    jest.advanceTimersByTime(251)
    expect(await result).toEqual(authorizationAt(Date.now()))
    expect(Date.now()).toBe(periodStart + periodMs + 250)
  })

  it('rechecks a boundary crossed during generation instead of returning the preceding code', async () => {
    jest.useFakeTimers({ now: periodStart + periodMs - 3000, doNotFake: ['performance'] })
    let crossed = false
    const generateOtp = jest.fn((currentState: DeviceState, currentPin: string, now?: number) => {
      const result = generateDeviceOtp(currentState, currentPin, now)
      if (!crossed) {
        crossed = true
        jest.setSystemTime(periodStart + periodMs + 1)
      }
      return result
    })
    const result = await provider({ generateOtp })()

    expect(result).toEqual(authorizationAt(Date.now()))
    expect(generateOtp).toHaveBeenCalledTimes(2)
  })

  it('waits for a new real code only after the caller explicitly identifies a rejected code', async () => {
    jest.useFakeTimers({ now: periodStart + 1000, doNotFake: ['performance'] })
    const getAuthorization = provider()
    const first = await getAuthorization()
    const refreshed = getAuthorization({ afterOtp: first.otp })
    expect(jest.getTimerCount()).toBe(1)

    jest.advanceTimersByTime(29250)
    const next = await refreshed
    expect(next).toEqual(authorizationAt(Date.now()))
    expect(next.otp).not.toBe(first.otp)
  })

  it('continues to reuse a sufficiently fresh current-period code without imposing a per-action wait', async () => {
    jest.useFakeTimers({ now: periodStart + 1000, doNotFake: ['performance'] })
    const getAuthorization = provider()

    expect(await getAuthorization()).toEqual(authorizationAt(Date.now()))
    expect(await getAuthorization()).toEqual(authorizationAt(Date.now()))
    expect(jest.getTimerCount()).toBe(0)
  })

  it('still avoids the code used for device login without requesting user input', async () => {
    jest.useFakeTimers({ now: periodStart + 1000, doNotFake: ['performance'] })
    const current = authorizationAt(Date.now())
    const getAuthorization = createDeviceAuthorizationProvider(state, pin, current.otp)
    const result = getAuthorization()
    jest.advanceTimersByTime(29250)

    expect(await result).toEqual(authorizationAt(Date.now()))
  })

  it('bounds waiting if the generator or clock does not advance', async () => {
    jest.useFakeTimers({ now: periodStart + 1000, doNotFake: ['performance'] })
    const current = authorizationAt(Date.now())
    const waitForNextOtpPeriod = jest.fn(async () => {})
    const getAuthorization = createDeviceAuthorizationProvider(state, pin, current.otp, {
      generateOtp: () => current.otp, waitForNextOtpPeriod
    })

    await expect(getAuthorization()).rejects.toMatchObject({ message: expect.stringContaining('Проверьте дату и время') })
    expect(waitForNextOtpPeriod).toHaveBeenCalledTimes(2)
  })
})
