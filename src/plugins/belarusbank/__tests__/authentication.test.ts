import fetchMock from 'fetch-mock'
import { ZPAPIError } from '../../../errors'
import { getArray } from '../../../types/get'
import { authenticate } from '../api'
import { registrationRequiredResponse, wrongCredentialsResponse } from '../__fixtures__/loginRejections'
import { BASE_API_URL } from '../models'

const registrationInstruction = 'Зарегистрируйтесь в новом приложении Belarusbank или на сайте https://ib.asb.by. Затем укажите логин и пароль от нового онлайн-банка в настройках подключения Дзен-мани и повторите синхронизацию.'
const credentialsInstruction = 'Беларусбанк отклонил логин или пароль. Проверьте их на https://ib.asb.by, затем исправьте в настройках подключения Дзен-мани. Используйте пароль онлайн-банка Belarusbank.'
const preferences = { login: 'test-login', password: 'test-password' }
let alert: jest.Mock
let readLine: jest.Mock

beforeEach(() => {
  alert = jest.fn().mockResolvedValue(undefined)
  readLine = jest.fn()
  Object.defineProperty(globalThis, 'ZenMoney', {
    configurable: true,
    value: {
      getData: jest.fn((key: string, defaultValue: unknown) => key === 'belarusbankDeviceUid' ? 'test-device' : defaultValue),
      setData: jest.fn(),
      saveData: jest.fn(),
      alert,
      readLine
    }
  })
})

afterEach(() => {
  fetchMock.restore()
})

const expectReportableError = (error: unknown, code: number): void => {
  expect(error).toBeInstanceOf(Error)
  expect(error).not.toBeInstanceOf(ZPAPIError)
  expect(error).toHaveProperty('message', expect.stringContaining(`code ${code}`))
}

describe('Belarusbank observed login preparation rejections', () => {
  it.each([
    [registrationRequiredResponse, registrationInstruction],
    [wrongCredentialsResponse, credentialsInstruction]
  ])('shows the instruction for bank code $0.body.errorInfo.code and keeps log submission', async (response, instruction) => {
    // The legacy trusted-login fallbacks are modeled only to reach the captured SMS preparation request.
    fetchMock.postOnce(`${BASE_API_URL}users/auth/login`, { status: 401, body: {} })
    fetchMock.postOnce(`${BASE_API_URL}users/auth/login/preparation?loginMode=PIN`, { status: 401, body: {} })
    fetchMock.postOnce(`${BASE_API_URL}users/auth/login/preparation`, response)

    const error: unknown = await authenticate(preferences, false).catch((error: unknown) => error)

    expectReportableError(error, response.body.errorInfo.code)
    expect(alert).toHaveBeenCalledTimes(1)
    expect(alert).toHaveBeenCalledWith(instruction)
    expect(readLine).not.toHaveBeenCalled()
    expect(getArray(fetchMock.calls(), 'matched')).toHaveLength(3)
  })
})

describe('Belarusbank authentication invariants [model]', () => {
  // These tests reuse the observed rejection payload to model an earlier auth stage,
  // without claiming additional bank observations for direct/PIN login or background execution.
  it.each([false, true])('stops on a credential rejection before another login attempt (background: %s)', async (isInBackground) => {
    fetchMock.postOnce(`${BASE_API_URL}users/auth/login`, wrongCredentialsResponse)

    const error: unknown = await authenticate(preferences, isInBackground).catch((error: unknown) => error)

    expectReportableError(error, 1042)
    expect(getArray(fetchMock.calls(), 'matched')).toHaveLength(1)
    expect(alert).toHaveBeenCalledTimes(isInBackground ? 0 : 1)
    expect(readLine).not.toHaveBeenCalled()
  })

  it('stops after a registration rejection in PIN preparation', async () => {
    fetchMock.postOnce(`${BASE_API_URL}users/auth/login`, { status: 401, body: {} })
    fetchMock.postOnce(`${BASE_API_URL}users/auth/login/preparation?loginMode=PIN`, registrationRequiredResponse)

    const error: unknown = await authenticate(preferences, false).catch((error: unknown) => error)

    expectReportableError(error, 1011)
    expect(getArray(fetchMock.calls(), 'matched')).toHaveLength(2)
    expect(alert).toHaveBeenCalledWith(registrationInstruction)
    expect(readLine).not.toHaveBeenCalled()
  })

  it('waits for the instruction to close before rejecting authentication', async () => {
    let closeAlert: (() => void) | undefined
    let markAlertOpened: (() => void) | undefined
    const alertOpened = new Promise<void>((resolve) => { markAlertOpened = resolve })
    alert.mockImplementation(async () => {
      markAlertOpened?.()
      await new Promise<void>((resolve) => { closeAlert = resolve })
    })
    fetchMock.postOnce(`${BASE_API_URL}users/auth/login`, registrationRequiredResponse)
    let settled = false
    const pending = authenticate(preferences, false).catch((error: unknown) => {
      settled = true
      return error
    })

    // Complete the wait even on regression, when authentication rejects before opening the UI.
    await Promise.race([alertOpened, pending])
    expect(closeAlert).toBeDefined()
    expect(settled).toBe(false)
    closeAlert?.()
    expectReportableError(await pending, 1011)
  })

  it('propagates an unknown server rejection as an ordinary error without a registration instruction', async () => {
    fetchMock.postOnce(`${BASE_API_URL}users/auth/login`, { status: 503, body: {} })

    const error: unknown = await authenticate(preferences, false).catch((error: unknown) => error)

    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(error).toHaveProperty('message', expect.stringContaining('HTTP 503'))
    expect(alert).not.toHaveBeenCalled()
    expect(getArray(fetchMock.calls(), 'matched')).toHaveLength(1)
  })

  it.each([false, true])('does not send missing user input to the bank (code word required: %s)', async (needCodeWord) => {
    // A successful preparation and canceled input model the runtime input invariant.
    fetchMock.postOnce(`${BASE_API_URL}users/auth/login`, { status: 401, body: {} })
    fetchMock.postOnce(`${BASE_API_URL}users/auth/login/preparation?loginMode=PIN`, { status: 401, body: {} })
    fetchMock.postOnce(`${BASE_API_URL}users/auth/login/preparation`, {
      status: 200,
      body: { requestId: 'model-request-id', needCodeWord }
    })
    readLine.mockResolvedValue(null)

    const error: unknown = await authenticate(preferences, false).catch((error: unknown) => error)

    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(error).toHaveProperty('message', needCodeWord ? 'Belarusbank code word was not provided' : 'Belarusbank confirmation code was not provided')
    expect(getArray(fetchMock.calls(), 'matched')).toHaveLength(3)
    expect(readLine).toHaveBeenCalledTimes(1)
    expect(alert).not.toHaveBeenCalled()
  })
})
