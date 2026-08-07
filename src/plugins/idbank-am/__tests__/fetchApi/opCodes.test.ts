import crypto from 'crypto-js'
import { BankMessageError, InvalidLoginOrPasswordError, InvalidOtpCodeError, TemporaryError } from '../../../../errors'
import { Preferences, Session } from '../../models'

const mockFetchJson = jest.fn()

jest.mock('../../../../common/network', () => ({ fetchJson: mockFetchJson }))

const preferences: Preferences = { phone: '+37400000000', password: 'password' }
const session: Session = { auth: { deviceId: 'device' }, sessionId: 'session', token: 'k'.repeat(32) + '-' + 'i'.repeat(16) }

function respondWith (body: unknown): void {
  mockFetchJson.mockResolvedValue({ status: 200, url: 'https://www.idbanking.am/api', headers: {}, body })
}

describe('коды ответа банка', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { fetchLogin, fetchAccounts } = require('../../fetchApi') as typeof import('../../fetchApi')

  beforeEach(() => {
    global.ZenMoney = {
      device: { os: { name: 'iOS', version: '17.4' } },
      application: { version: '1.2.3' }
    } as unknown as typeof ZenMoney
  })

  afterEach(() => { jest.clearAllMocks() })

  it.each([
    ['неудачная попытка входа', 3, InvalidLoginOrPasswordError],
    ['неверный пароль', 55, InvalidLoginOrPasswordError],
    ['неверный код активации', 21, InvalidOtpCodeError],
    ['непринятый одноразовый код', 52, InvalidOtpCodeError]
  ])('превращает %s в ошибку для пользователя', async (_, opCode, error) => {
    respondWith({ OpCode: opCode, OpDesc: 'Err:EN-0' })
    await expect(fetchLogin(preferences, 'device')).rejects.toBeInstanceOf(error)
  })

  it('не гонит на экран настроек, когда общий код неудачи прилетел не на входе', async () => {
    respondWith({ OpCode: 3, OpDesc: 'Attempt unsuccessful' })
    const error = await fetchAccounts(session).catch((e: unknown) => e)
    expect(error).not.toBeInstanceOf(InvalidLoginOrPasswordError)
    expect(error).toEqual(expect.objectContaining({ bankMessage: 'Attempt unsuccessful' }))
  })

  it('называет банк недоступным вместо разбора чужой HTML-страницы', async () => {
    mockFetchJson.mockResolvedValue({ status: 503, url: 'https://www.idbanking.am/api', headers: {}, body: undefined })
    await expect(fetchAccounts(session)).rejects.toEqual(
      expect.objectContaining({ message: expect.stringContaining('временно недоступен') })
    )
  })

  it.each([
    ['заблокированный доступ', 7, 'контактный центр'],
    ['заблокированный аккаунт', 54, 'контактный центр'],
    ['завершённую сессию', 33, 'Повторите синхронизацию'],
    ['неузнанное устройство', 363, 'не узнал устройство']
  ])('объясняет %s словами', async (_, opCode, hint) => {
    respondWith({ OpCode: opCode, OpDesc: 'Err:EN-0' })
    await expect(fetchLogin(preferences, 'device')).rejects.toEqual(
      expect.objectContaining({ message: expect.stringContaining(hint) })
    )
  })

  it('разбирает неподтверждённое устройство в список способов доставки кода', async () => {
    respondWith({
      OpCode: 255,
      AccountId: 1,
      Phone: { ChannelType: 2, Value: '+374****00' },
      Email: { ChannelType: 3, Value: 'i*****v@example.com' }
    })
    await expect(fetchLogin(preferences, 'device')).resolves.toEqual({
      isDeviceVerified: false,
      accountId: 1,
      channels: [
        { type: 2, kind: 'phone', recipient: '+374****00' },
        { type: 3, kind: 'email', recipient: 'i*****v@example.com' }
      ]
    })
  })

  it.each([
    ['числом', 0],
    ['строкой', '0']
  ])('принимает код результата %s: иначе вход падал бы внутренней ошибкой', async (_, opCode) => {
    respondWith({ OpCode: opCode, SessionId: 'session', Token: 'token' })
    await expect(fetchLogin(preferences, 'device')).resolves.toEqual({
      isDeviceVerified: true,
      sessionId: 'session',
      token: 'token'
    })
  })

  it('просит повторить синхронизацию, если банк ответил успехом без данных сессии', async () => {
    respondWith({ OpCode: 0 })
    await expect(fetchLogin(preferences, 'device')).rejects.toEqual(
      expect.objectContaining({ message: expect.stringContaining('не открыл сессию') })
    )
  })

  it('принимает ответ без кода результата: выписка приходит именно такой', async () => {
    respondWith({ Result: [{ AccountNumber: '1' }] })
    await expect(fetchAccounts(session)).resolves.toEqual([{ AccountNumber: '1' }])
  })

  it('показывает сообщение банка, если оно человеческое', async () => {
    respondWith({ OpCode: 100, OpDesc: 'Service is temporarily unavailable' })
    await expect(fetchLogin(preferences, 'device')).rejects.toEqual(
      expect.objectContaining({ bankMessage: 'Service is temporarily unavailable' })
    )
  })

  it.each([
    ['машинного кода', 'Err:EN-100'],
    ['пустого текста', '']
  ])('вместо %s показывает номер кода: пустое сообщение уронило бы плагин', async (_, opDesc) => {
    respondWith({ OpCode: 100, OpDesc: opDesc })
    const error = await fetchLogin(preferences, 'device').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(BankMessageError)
    expect(error).toEqual(expect.objectContaining({ bankMessage: 'OpCode 100' }))
  })

  it('не наследует TemporaryError там, где нужно менять пароль', async () => {
    respondWith({ OpCode: 55, OpDesc: 'Err:EN-0' })
    await expect(fetchLogin(preferences, 'device')).rejects.not.toBeInstanceOf(TemporaryError)
  })
})

describe('запрос выписки', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { fetchAccountTransactions } = require('../../fetchApi') as typeof import('../../fetchApi')

  function decryptRequestBody (): unknown {
    const decrypted = crypto.AES.decrypt(mockFetchJson.mock.calls[0][1].body as string, crypto.enc.Utf8.parse(session.token.slice(0, 32)), {
      iv: crypto.enc.Utf8.parse(session.token.slice(33)),
      mode: crypto.mode.CBC,
      padding: crypto.pad.Pkcs7
    })
    return JSON.parse(decrypted.toString(crypto.enc.Utf8))
  }

  beforeEach(() => {
    global.ZenMoney = {} as unknown as typeof ZenMoney
    respondWith({ AccTranByDaysList: [] })
  })

  afterEach(() => { jest.clearAllMocks() })

  it('просит период по календарю банка: ночная операция в Ереване иначе выпадет из выписки', async () => {
    // 05:00 пятого февраля в Ереване — это ещё четвёртое по Гринвичу
    await fetchAccountTransactions('12345678901200', new Date('2026-02-04T21:00:00Z'), new Date('2026-02-04T22:30:00Z'), session)

    expect(decryptRequestBody()).toEqual({
      account: '12345678901200',
      fromdate: '05/02/2026',
      todate: '05/02/2026',
      format: ''
    })
  })

  it('шифрует тело ключом из Token, а не шлёт его открытым', async () => {
    await fetchAccountTransactions('12345678901200', new Date('2026-02-05T10:00:00Z'), new Date('2026-02-05T10:00:00Z'), session)

    expect(mockFetchJson.mock.calls[0][1].body).toEqual(expect.any(String))
    expect(mockFetchJson.mock.calls[0][1].headers._EncMethod_).toBeUndefined()
  })
})

describe('заголовки запроса', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { fetchLogin } = require('../../fetchApi') as typeof import('../../fetchApi')

  afterEach(() => { jest.clearAllMocks() })

  it('представляется приложением и устройством пользователя', async () => {
    global.ZenMoney = {
      device: { os: { name: 'Android', version: '14' } },
      application: { version: '9.9.9' }
    } as unknown as typeof ZenMoney
    respondWith({ OpCode: 0, SessionId: 'session', Token: 'token' })

    await fetchLogin(preferences, 'device')

    expect(mockFetchJson.mock.calls[0][1].headers).toEqual(expect.objectContaining({
      'User-Agent': 'ZenMoney/9.9.9 (Android 14)',
      device_id: 'device'
    }))
  })

  it('обходится без данных об устройстве: банку важно лишь непустое поле', async () => {
    global.ZenMoney = {} as unknown as typeof ZenMoney
    respondWith({ OpCode: 0, SessionId: 'session', Token: 'token' })

    await fetchLogin(preferences, 'device')

    expect(mockFetchJson.mock.calls[0][1].headers['User-Agent']).toEqual('ZenMoney')
  })
})
