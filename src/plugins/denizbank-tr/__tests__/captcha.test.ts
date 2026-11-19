import { EventEmitter } from 'events'
import crypto from 'crypto-js'
import type { Disposable, WebViewNavigationPolicy } from '../../../common/webView'
import { solveCaptcha } from '../captcha'
import { DenizBankApi } from '../api'
import { UserInteractionError, ZPAPIError } from '../../../errors'

type Bridge = (...args: unknown[]) => unknown | Promise<unknown>

// Model native UI lifecycle and opaque captcha challenges, without interpreting bank data.
class NativeView extends EventEmitter {
  static readonly NavigationAction = { LOAD: undefined, BLOCK: true, OPEN_EXTERNAL: 2 }
  static instance: NativeView
  static onContent: (view: NativeView) => Promise<void>
  private policy: WebViewNavigationPolicy | null = null
  get navigationPolicy (): WebViewNavigationPolicy | null { return this.policy }
  set navigationPolicy (value: WebViewNavigationPolicy | null) { this.policy = value }
  readonly bridges = new Map<string, Bridge>()
  readonly dispose = jest.fn(async () => {})
  readonly show = jest.fn(async () => {})
  readonly close = jest.fn(async () => { this.emit('close') })
  readonly setContent = jest.fn(async (_html: string) => { await NativeView.onContent(this) })
  constructor () { super(); NativeView.instance = this }
  async exposeFunction (name: string, callback: Bridge): Promise<Disposable> {
    this.bridges.set(name, callback)
    return { dispose: this.dispose }
  }

  async call (name: string, ...args: unknown[]): Promise<unknown> {
    const handler = this.bridges.get(name)
    if (handler === undefined) throw new Error('Missing model bridge')
    return await Promise.resolve(handler(...args))
  }
}

describe('captcha WebView [model]', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['performance'] })
    jest.setSystemTime(new Date('2026-11-15T00:00:00Z'))
    global.ZenMoney = { WebView: NativeView } as unknown as typeof ZenMoney
    NativeView.onContent = async () => {}
  })
  afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks() })

  it('returns the latest challenge and normalized input, closes the view and removes bridges', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    const load = jest.fn(async () => ({ id: 'opaque-id', captchaByteData: 'opaque-image' }))
    NativeView.onContent = async view => {
      expect(await view.call('denizCaptchaRefresh')).toEqual({ image: 'opaque-image', revision: 1 })
      await view.call('denizCaptchaSubmit', 1, ' abcd ')
    }
    await expect(solveCaptcha(load, false)).resolves.toEqual({ id: 'opaque-id', code: 'ABCD' })
    expect(load).toHaveBeenCalledTimes(1)
    expect(NativeView.instance.close).toHaveBeenCalledTimes(1)
    expect(NativeView.instance.dispose).toHaveBeenCalledTimes(3)
    expect(NativeView.instance.listenerCount('close')).toBe(0)
    expect(NativeView.instance.setContent.mock.calls[0][0]).toContain("form-action 'none'")
    const policy = NativeView.instance.navigationPolicy
    expect(await policy?.({ url: 'https://example.test/?code=model-navigation-secret', method: 'GET', headers: { Cookie: 'model-cookie-secret', 'Request-Id': 'model-navigation-id' }, source: 'webView' })).toBe(true)
    const diagnostics = JSON.stringify(debug.mock.calls)
    expect(diagnostics).not.toContain('model-navigation-secret')
    expect(diagnostics).not.toContain('model-cookie-secret')
    expect(diagnostics).toContain('model-navigation-id')
    expect(diagnostics).toContain('GET')
  })

  it('refreshes an expired challenge and never returns its stale id or code', async () => {
    const load = jest.fn().mockResolvedValueOnce({ id: 'old-id', captchaByteData: 'old-image' }).mockResolvedValue({ id: 'fresh-id', captchaByteData: 'fresh-image' })
    NativeView.onContent = async view => {
      await view.call('denizCaptchaRefresh')
      jest.setSystemTime(new Date('2026-11-15T00:01:00Z'))
      expect(await view.call('denizCaptchaSubmit', 1, 'stale')).toEqual({ image: 'fresh-image', revision: 2 })
      await view.call('denizCaptchaSubmit', 2, 'fresh')
    }
    await expect(solveCaptcha(load, false)).resolves.toEqual({ id: 'fresh-id', code: 'FRESH' })
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('rejects cancellation without treating it as incorrect OTP or successful entry', async () => {
    NativeView.onContent = async view => { await view.call('denizCaptchaCancel') }
    let error: unknown
    try { await solveCaptcha(jest.fn(), false) } catch (caught) { error = caught }
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(NativeView.instance.close).toHaveBeenCalledTimes(1)
  })

  it('does not accept a stale answer racing with a pending image refresh', async () => {
    let finishRefresh!: (value: { id: string, captchaByteData: string }) => void
    const load = jest.fn().mockResolvedValueOnce({ id: 'old-id', captchaByteData: 'old-image' }).mockImplementation(async () => await new Promise(resolve => { finishRefresh = resolve }))
    NativeView.onContent = async view => {
      await view.call('denizCaptchaRefresh')
      const refresh = view.call('denizCaptchaRefresh')
      const stale = view.call('denizCaptchaSubmit', 1, 'old-answer')
      finishRefresh({ id: 'new-id', captchaByteData: 'new-image' })
      await expect(refresh).resolves.toEqual({ image: 'new-image', revision: 2 })
      await expect(stale).resolves.toEqual({ image: 'new-image', revision: 2 })
      await view.call('denizCaptchaSubmit', 2, 'new-answer')
    }
    await expect(solveCaptcha(load, false)).resolves.toEqual({ id: 'new-id', code: 'NEW-ANSWER' })
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('propagates the original captcha loading failure and closes the view', async () => {
    const error = new Error('Model captcha loading failure')
    NativeView.onContent = async view => { await view.call('denizCaptchaRefresh').catch(() => {}) }
    await expect(solveCaptcha(async () => { throw error }, false)).rejects.toBe(error)
    expect(NativeView.instance.close).toHaveBeenCalledTimes(1)
  })

  it('preserves a loading failure if native cleanup also fails', async () => {
    const original = new Error('Model loading failure')
    const cleanup = new Error('Model cleanup failure')
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    NativeView.onContent = async view => {
      view.close.mockRejectedValue(cleanup)
      await view.call('denizCaptchaRefresh').catch(() => {})
    }
    await expect(solveCaptcha(async () => { throw original }, false)).rejects.toBe(original)
  })

  it('stops background work before constructing a view or requesting a captcha', async () => {
    const create = jest.fn()
    global.ZenMoney = { WebView: create } as unknown as typeof ZenMoney
    const load = jest.fn()
    await expect(solveCaptcha(load, true)).rejects.toBeInstanceOf(UserInteractionError)
    expect(create).not.toHaveBeenCalled()
    expect(load).not.toHaveBeenCalled()
  })

  it('uses the captcha selected in WebView for the actual credential workflow', async () => {
    const stopped = new Error('Model credential submission stopped')
    const key = crypto.enc.Utf8.parse('1234567890123456')
    jest.spyOn(crypto.AES, 'decrypt').mockReturnValueOnce(key)
    const api = new DenizBankApi({ baseUrl: 'https://example.com/', encryptionStaticKeyBase64: '' })
    const internal = api as unknown as {
      getApplicationVersion: () => Promise<string>
      getInitialToken: () => Promise<{ token: string, encryptionKey: string }>
      getCaptcha: () => Promise<{ id: string, captchaByteData: string }>
      sendCredentials: (session: unknown, login: string, password: string, captchaId: string, code: string, version: string) => Promise<unknown>
      sendPush: () => Promise<unknown>
    }
    jest.spyOn(internal, 'getApplicationVersion').mockResolvedValue('model-version')
    jest.spyOn(internal, 'getInitialToken').mockResolvedValue({ token: 'model-token', encryptionKey: '' })
    jest.spyOn(internal, 'getCaptcha').mockResolvedValueOnce({ id: 'old-id', captchaByteData: 'old-image' }).mockResolvedValue({ id: 'chosen-id', captchaByteData: 'chosen-image' })
    const credentials = jest.spyOn(internal, 'sendCredentials').mockRejectedValue(stopped)
    const push = jest.spyOn(internal, 'sendPush')
    NativeView.onContent = async view => {
      await view.call('denizCaptchaRefresh')
      await view.call('denizCaptchaRefresh')
      expect(credentials).not.toHaveBeenCalled()
      await view.call('denizCaptchaSubmit', 2, 'abcd')
    }
    await expect(api.login({ login: 'model-login', password: 'model-password' }, false)).rejects.toBe(stopped)
    const request = credentials.mock.calls[0]
    expect(crypto.AES.decrypt(request[3], key, { mode: crypto.mode.CBC, padding: crypto.pad.Pkcs7, iv: key }).toString(crypto.enc.Utf8)).toBe('chosen-id')
    expect(request[4]).toBe('ABCD')
    expect(push).not.toHaveBeenCalled()
  })

  it('stops when the native window is dismissed', async () => {
    NativeView.onContent = async view => { view.emit('close') }
    await expect(solveCaptcha(jest.fn(), false)).rejects.toThrow('Captcha entry was cancelled')
    expect(NativeView.instance.show).not.toHaveBeenCalled()
    expect(NativeView.instance.close).not.toHaveBeenCalled()
  })

  it('releases the owned session on timeout', async () => {
    const pending = solveCaptcha(jest.fn(), false).catch(error => error as unknown)
    for (let i = 0; i < 12; i++) await Promise.resolve()
    jest.advanceTimersByTime(300000)
    await expect(pending).resolves.toMatchObject({ message: 'Captcha entry timed out' })
    expect(NativeView.instance.close).toHaveBeenCalledTimes(1)
  })
})
