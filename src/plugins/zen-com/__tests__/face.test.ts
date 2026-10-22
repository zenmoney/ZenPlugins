import { EventEmitter } from 'events'
import { headerMask } from '../request'
import { UserInteractionError } from '../../../errors'
import type { WebViewNavigationPolicy, WebViewRequestLogOptions } from '../../../common/webView'

const mockView = { show: jest.fn(), close: jest.fn(), goto: jest.fn(), setContent: jest.fn(), on: jest.fn(), off: jest.fn(), navigationPolicy: null }
const mockCreate = jest.fn(() => mockView)
const mockPolicy = jest.fn((policy: unknown, _options?: unknown) => policy)
jest.mock('../../../common/webView', () => ({
  WebView: Object.assign(mockCreate, {
    NavigationAction: { LOAD: undefined, BLOCK: true, OPEN_EXTERNAL: 2 }, createNavigationPolicy: mockPolicy
  })
}))
const { presentFaceVerification } = jest.requireActual<typeof import('../face')>('../face')

// Model browser lifecycle only. User dismissal never establishes bank success.
describe('ZEN.COM iDenfy browser lifecycle [model]', () => {
  let events: EventEmitter
  beforeEach(() => {
    jest.resetAllMocks()
    events = new EventEmitter()
    mockCreate.mockReturnValue(mockView)
    mockPolicy.mockImplementation((policy: unknown) => policy)
    mockView.on.mockImplementation((name: string, callback: () => void) => events.on(name, callback))
    mockView.off.mockImplementation((name: string, callback: () => void) => events.off(name, callback))
    mockView.goto.mockImplementation(async () => { events.emit('close') })
    mockView.setContent.mockImplementation(async () => {
      const policy = mockView.navigationPolicy as unknown as WebViewNavigationPolicy
      await policy({ url: 'https://face.authentication.idenfy.com/?token=model-face-token', method: 'GET', headers: {}, source: 'webView' })
      events.emit('close')
    })
  })
  afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers() })
  it('stops background execution before constructing a browser', async () => {
    await expect(presentFaceVerification('model-face-token', true)).rejects.toBeInstanceOf(UserInteractionError)
    expect(mockCreate).not.toHaveBeenCalled()
  })
  it('offers the official face UI in the external browser and masks navigation logs', async () => {
    await presentFaceVerification('model-face-token', false)
    expect(mockView.setContent).toHaveBeenCalledWith(expect.stringContaining('href="https://face.authentication.idenfy.com/?token=model-face-token"'), expect.objectContaining({ baseURL: 'https://face.authentication.idenfy.com/' }))
    expect(mockView.goto).not.toHaveBeenCalled()
    const policy = mockView.navigationPolicy as unknown as WebViewNavigationPolicy
    await expect(Promise.resolve(policy({ url: 'https://face.authentication.idenfy.com/?token=model-face-token', method: 'GET', headers: {}, source: 'webView' }))).resolves.toBe(2)
    expect(policy({ url: 'https://example.test/?token=model-face-token', method: 'GET', headers: {}, source: 'webView' })).toBe(true)
    expect(policy({ url: 'https://face.authentication.idenfy.com/?token=another-token', method: 'GET', headers: {}, source: 'webView' })).toBe(true)
    expect(mockPolicy).toHaveBeenCalledWith(expect.any(Function), { sanitizeRequestLog: { url: { query: { token: true } }, headers: headerMask } })
    expect(mockView.off).toHaveBeenCalledWith('close', expect.any(Function))
    expect(mockView.close).not.toHaveBeenCalled()
  })
  it('preserves a navigation failure when closing also fails', async () => {
    const error = new Error('Model face navigation failure')
    mockView.goto.mockRejectedValue(error)
    mockView.setContent.mockRejectedValue(error)
    mockView.close.mockRejectedValue(new Error('Model close failure'))
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(presentFaceVerification('model-face-token', false)).rejects.toBe(error)
    expect(mockView.close).toHaveBeenCalledTimes(1)
  })
  it('masks navigation credentials while preserving diagnostic headers and query fields', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    const { createNavigationPolicy } = jest.requireActual<typeof import('../../../common/webView')>('../../../common/webView')
    mockPolicy.mockImplementation((handler: unknown, options?: unknown) => createNavigationPolicy(handler as WebViewNavigationPolicy, options as WebViewRequestLogOptions))
    mockView.setContent.mockImplementation(async () => {
      const policy = mockView.navigationPolicy as unknown as WebViewNavigationPolicy
      await policy({ url: 'https://face.authentication.idenfy.com/?token=model-face-token&locale=en', method: 'GET', headers: { Cookie: 'model-provider-cookie', Authorization: 'model-provider-authorization', 'Request-Id': 'model-navigation-id' }, source: 'webView' })
      await policy({ url: 'https://face.authentication.idenfy.com/?token=model-face-token', method: 'GET', headers: {}, source: 'webView' })
      events.emit('close')
    })
    await presentFaceVerification('model-face-token', false)
    const logs = JSON.stringify(debug.mock.calls)
    expect(logs).not.toContain('model-face-token')
    expect(logs).not.toContain('model-provider-cookie')
    expect(logs).not.toContain('model-provider-authorization')
    expect(logs).toContain('model-navigation-id')
    expect(logs).toContain('locale=en')
    expect(logs).toContain('face.authentication.idenfy.com')
  })
  it('does not progress when the launcher is dismissed before opening verification', async () => {
    mockView.setContent.mockImplementation(async () => { events.emit('close') })
    await expect(presentFaceVerification('model-face-token', false)).rejects.toThrow('browser was not opened')
  })
  it('times out an unfinished view and closes it', async () => {
    jest.useFakeTimers({ doNotFake: ['performance'] })
    mockView.goto.mockResolvedValue(undefined)
    mockView.setContent.mockResolvedValue(undefined)
    const result = presentFaceVerification('model-face-token', false).catch(error => error as unknown)
    for (let i = 0; i < 6; i++) await Promise.resolve()
    jest.advanceTimersByTime(300000)
    await expect(result).resolves.toMatchObject({ message: 'ZEN.COM face verification window timed out' })
    expect(mockView.close).toHaveBeenCalledTimes(1)
  })
})
