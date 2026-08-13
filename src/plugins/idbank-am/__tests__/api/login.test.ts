import { InvalidOtpCodeError, TemporaryError, UserInteractionError } from '../../../../errors'
import { Preferences } from '../../models'

const mockFetchJson = jest.fn()

jest.mock('../../../../common/network', () => ({ fetchJson: mockFetchJson }))

const preferences: Preferences = { phone: '+37400000000', password: 'password' }

const UNVERIFIED_DEVICE = {
  OpCode: 255,
  AccountId: 100500,
  Phone: { ChannelType: 2, Value: '+374****00' },
  Email: { ChannelType: 3, Value: 'i*****v@example.com' }
}

const CONFIRMED_DEVICE = { OpCode: 0, Result: { SessionId: 'session', Token: 'token' } }

function respondWith (...bodies: unknown[]): void {
  for (const body of bodies) {
    mockFetchJson.mockResolvedValueOnce({ status: 200, url: 'https://www.idbanking.am/api', headers: {}, body })
  }
}

function requestBody (index: number): Record<string, unknown> {
  return mockFetchJson.mock.calls[index][1].body
}

function requestedDeviceIds (): string[] {
  return mockFetchJson.mock.calls.map(call => call[1].headers.device_id)
}

describe('вход', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { login } = require('../../api') as typeof import('../../api')
  let readLine: jest.Mock

  beforeEach(() => {
    readLine = jest.fn()
    global.ZenMoney = {
      readLine,
      setData: jest.fn(),
      saveData: jest.fn(),
      device: { os: { name: 'Android', version: '14' } },
      application: { version: '1.0' }
    } as unknown as typeof ZenMoney
  })

  afterEach(() => { jest.clearAllMocks() })

  it('не беспокоит пользователя, когда банк узнал устройство', async () => {
    respondWith({ OpCode: 0, SessionId: 'session', Token: 'token' })

    await expect(login(preferences, { deviceId: 'known-device' }, false)).resolves.toEqual({
      auth: { deviceId: 'known-device' },
      sessionId: 'session',
      token: 'token'
    })
    expect(readLine).not.toHaveBeenCalled()
  })

  it('спрашивает способ доставки кода и шлёт код выбранным каналом', async () => {
    respondWith(UNVERIFIED_DEVICE, { OpCode: 0 }, CONFIRMED_DEVICE)
    readLine.mockResolvedValueOnce('2').mockResolvedValueOnce('12345')

    const session = await login(preferences, { deviceId: 'device' }, false)

    expect(readLine.mock.calls[0][0]).toContain('1 — СМС на +374****00')
    expect(readLine.mock.calls[0][0]).toContain('2 — письмо на i*****v@example.com')
    expect(requestBody(1)).toEqual({ AccountId: 100500, ChannelType: 3 })
    expect(requestBody(2)).toEqual({ Code: '12345', AccountId: 100500, ChannelType: 3 })
    expect(session).toEqual({
      auth: { deviceId: 'device', otpChannelType: 3 },
      sessionId: 'session',
      token: 'token'
    })
  })

  it('не переспрашивает способ, выбранный в прошлый раз', async () => {
    respondWith(UNVERIFIED_DEVICE, { OpCode: 0 }, CONFIRMED_DEVICE)
    readLine.mockResolvedValueOnce('12345')

    await login(preferences, { deviceId: 'device', otpChannelType: 3 }, false)

    expect(readLine).toHaveBeenCalledTimes(1)
    expect(requestBody(1)).toEqual({ AccountId: 100500, ChannelType: 3 })
  })

  it('не спрашивает, когда способ доставки всего один', async () => {
    respondWith({ ...UNVERIFIED_DEVICE, Email: null }, { OpCode: 0 }, CONFIRMED_DEVICE)
    readLine.mockResolvedValueOnce('12345')

    await login(preferences, { deviceId: 'device' }, false)

    expect(readLine).toHaveBeenCalledTimes(1)
    expect(requestBody(1)).toEqual({ AccountId: 100500, ChannelType: 2 })
  })

  it('шлёт все запросы подтверждения с одним отпечатком устройства', async () => {
    respondWith(UNVERIFIED_DEVICE, { OpCode: 0 }, CONFIRMED_DEVICE)
    readLine.mockResolvedValueOnce('2').mockResolvedValueOnce('12345')

    const session = await login(preferences, undefined, false)
    const [loginDevice, otpDevice, confirmDevice] = requestedDeviceIds()

    expect(loginDevice).toMatch(/^[0-9a-f]{32}$/)
    expect(otpDevice).toEqual(loginDevice)
    expect(confirmDevice).toEqual(loginDevice)
    expect(session.auth.deviceId).toEqual(loginDevice)
  })

  it('не пытается спросить код в фоновой синхронизации', async () => {
    respondWith(UNVERIFIED_DEVICE)

    await expect(login(preferences, { deviceId: 'device' }, true)).rejects.toBeInstanceOf(UserInteractionError)
    expect(mockFetchJson).toHaveBeenCalledTimes(1)
  })

  it('подсказывает диапазон, когда способ выбран мимо списка', async () => {
    respondWith(UNVERIFIED_DEVICE)
    readLine.mockResolvedValueOnce('5')

    await expect(login(preferences, { deviceId: 'device' }, false)).rejects.toEqual(
      expect.objectContaining({ message: expect.stringContaining('от 1 до 2') })
    )
  })

  it('останавливается, когда код не введён, и не дёргает банк впустую', async () => {
    respondWith(UNVERIFIED_DEVICE, { OpCode: 0 })
    readLine.mockResolvedValueOnce('2').mockResolvedValueOnce('')

    await expect(login(preferences, { deviceId: 'device' }, false)).rejects.toBeInstanceOf(InvalidOtpCodeError)
    expect(mockFetchJson).toHaveBeenCalledTimes(2)
  })

  it('отправляет введённый код без лишних пробелов', async () => {
    respondWith(UNVERIFIED_DEVICE, { OpCode: 0 }, CONFIRMED_DEVICE)
    readLine.mockResolvedValueOnce('2').mockResolvedValueOnce('  12345 ')

    await login(preferences, { deviceId: 'device' }, false)

    expect(requestBody(2)).toEqual(expect.objectContaining({ Code: '12345' }))
  })

  it('отправляет к людям, когда банк не предложил ни одного способа', async () => {
    respondWith({ OpCode: 255, AccountId: 100500, Phone: null, Email: null })

    const error = await login(preferences, { deviceId: 'device' }, false).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(TemporaryError)
    expect(error).toEqual(expect.objectContaining({ message: expect.stringContaining('+374 60 700700') }))
  })
})
