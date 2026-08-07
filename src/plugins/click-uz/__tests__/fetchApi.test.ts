import fetchMock from 'fetch-mock'
import { InvalidOtpCodeError } from '../../../errors'
import { ClickApiError, fetchConfirmRegister, fetchDeviceRegister, fetchHistory } from '../fetchApi'

const apiUrl = 'https://api.click.uz/evo/'
const auth = {
  imei: '0123456789abcdef',
  deviceId: 'test-device-id',
  authToken: 'test-auth-token',
  sessionKey: 'test-session-key'
}

beforeEach(() => {
  global.ZenMoney = {
    device: {
      id: 'test-id',
      manufacturer: 'Test',
      model: 'Phone',
      brand: 'Test',
      os: { name: 'Android', version: '16' }
    }
  } as unknown as typeof ZenMoney
})

afterEach(() => {
  fetchMock.restore()
})

describe('Click mobile API', () => {
  it('uses the current application identity during device registration', async () => {
    fetchMock.once(apiUrl, {
      status: 200,
      body: { result: { device_id: 'registered-device-id' } }
    })

    await expect(fetchDeviceRegister('998001234567', auth.imei)).resolves.toBe('registered-device-id')

    const call = fetchMock.lastCall(apiUrl)
    if (call?.[1] == null) throw new Error('Expected a request')
    expect(call[1].headers).toMatchObject({
      Accept: 'application/json',
      'User-Agent': 'okhttp/5.3.2'
    })
    expect(JSON.parse(call[1].body as string)).toEqual({
      id: expect.any(Number),
      jsonrpc: '2.0',
      method: 'device.register.request',
      params: {
        app_version: '8.50.4',
        device_info: '36|16|Test Phone|Rooted: false',
        device_name: 'Test Phone',
        device_type: 1,
        imei: auth.imei,
        phone_number: '998001234567'
      }
    })
  })

  it.each([-32006, -32007])('maps invalid-code response %s to InvalidOtpCodeError', async code => {
    fetchMock.once(apiUrl, {
      status: 200,
      body: { error: { code, message: 'Invalid confirmation code' } }
    })

    await expect(fetchConfirmRegister('998001234567', '123456', auth))
      .rejects.toBeInstanceOf(InvalidOtpCodeError)
  })

  it('loads pages through get.synced.history with the card type', async () => {
    fetchMock.once(apiUrl, {
      status: 200,
      body: { result: [{ id: 'history-1' }] }
    })
    const from = new Date('2026-08-01T00:00:00.000Z')
    const to = new Date('2026-08-07T00:00:00.000Z')

    await expect(fetchHistory({ id: '12345678', cardType: 'SMARTV' }, from, to, auth))
      .resolves.toEqual([{ id: 'history-1' }])

    const call = fetchMock.lastCall(apiUrl)
    if (call?.[1] == null) throw new Error('Expected a request')
    expect(JSON.parse(call[1].body as string)).toEqual({
      id: expect.any(Number),
      jsonrpc: '2.0',
      method: 'get.synced.history',
      params: {
        account_id: 12345678,
        card_type: 'SMARTV',
        date_end: to.getTime(),
        date_start: from.getTime(),
        page_number: 1,
        page_size: 20
      }
    })
  })

  it('rejects a successful response without a result array', async () => {
    fetchMock.once(apiUrl, { status: 200, body: {} })

    await expect(fetchHistory(
      { id: '12345678', cardType: 'SMARTV' },
      new Date('2026-08-01T00:00:00.000Z'),
      new Date('2026-08-07T00:00:00.000Z'),
      auth
    )).rejects.toBeInstanceOf(ClickApiError)
  })
})
