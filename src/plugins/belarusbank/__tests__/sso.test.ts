import { EventEmitter } from 'events'
import { runInNewContext } from 'vm'
import { TemporaryError, UserInteractionError, ZPAPIError } from '../../../errors'
import type { WebViewNavigationPolicy } from '../../../common/webView'
import { getAdapterDefinition } from '../../../common/webview/permissions/core/internal'
import { res } from '../res'

const domDispose = jest.fn(async () => {})
const domThrowIfFailed = jest.fn()
jest.mock('../../../common/webview/dom', () => ({
  ...jest.requireActual('../../../common/webview/dom'),
  installDomPolicies: jest.fn(async () => ({ dispose: domDispose, throwIfFailed: domThrowIfFailed }))
}))
const { installDomPolicies } = jest.requireMock<typeof import('../../../common/webview/dom')>('../../../common/webview/dom')

const permissionDispose = jest.fn(async () => {})
jest.mock('../../../common/webview/permissions', () => ({
  ...jest.requireActual('../../../common/webview/permissions'),
  installPermissions: jest.fn(async () => ({ dispose: permissionDispose }))
}))
// The esbuild Jest transformer does not hoist jest.mock above imports.
const { installPermissions } = jest.requireMock<typeof import('../../../common/webview/permissions')>('../../../common/webview/permissions')
const { authorizeInWebView } = jest.requireActual<typeof import('../sso')>('../sso')

// Model the native WebView and browser transport; run the production init script unchanged.
// Bank endpoint/token names were confirmed in PWA main-MMJYJCRQ.js and Android 2026.6.0 on 2026-10-09.
class NativeView extends EventEmitter {
  static readonly NavigationAction = { LOAD: undefined, BLOCK: true, OPEN_EXTERNAL: 2 }
  static instance: NativeView
  static onGoto: (view: NativeView) => Promise<void>
  static onInit: (browser: Record<string, unknown>) => void
  private policy: WebViewNavigationPolicy | null = null
  get navigationPolicy (): WebViewNavigationPolicy | null { return this.policy }
  set navigationPolicy (value: WebViewNavigationPolicy | null) { this.policy = value }
  bridge!: (...args: unknown[]) => unknown
  browser!: Record<string, unknown>
  readonly show = jest.fn(async () => {})
  readonly close = jest.fn(async () => { this.emit('close') })
  readonly navigate = jest.fn(async (url: string) => {
    await this.policy?.({ url, method: 'GET', headers: {}, source: 'webView' })
    await NativeView.onGoto(this)
  })

  readonly goto = this.navigate
  constructor () { super(); NativeView.instance = this }
  async exposeFunction (_name: string, callback: (...args: unknown[]) => unknown): Promise<void> { this.bridge = callback }
  async addInitScript (script: Function, arg: { origin: string, bridgeName: string }): Promise<void> {
    const window = {
      location: { origin: arg.origin, href: `${arg.origin}/auth-board` },
      top: null as unknown,
      fetch: jest.fn(),
      [arg.bridgeName]: this.bridge
    }
    window.top = window
    class Xhr extends EventEmitter {
      responseURL = ''
      status = 0
      responseType = ''
      responseText = ''
      response: unknown
      addEventListener (event: string, callback: () => void): void { this.once(event, callback) }
      send (): void { this.emit('load') }
    }
    this.browser = { window, XMLHttpRequest: Xhr, URL, arg, nativeFetch: window.fetch }
    NativeView.onInit(this.browser)
    runInNewContext(`(${script.toString()})(arg)`, this.browser)
  }
}

interface BrowserXhr {
  responseURL: string
  status: number
  responseType: string
  responseText: string
  response: unknown
  send: () => void
}
const xhr = (view: NativeView, url: string, status: number, response: unknown, json = false): void => {
  const Xhr = view.browser.XMLHttpRequest as new () => BrowserXhr
  const request = new Xhr()
  Object.assign(request, { responseURL: url, status, response, responseType: json ? 'json' : '', responseText: JSON.stringify(response) })
  request.send()
}

const tokenResult = { sessionToken: 'model-session', refreshToken: 'model-refresh', tokenType: 'Bearer' }

describe('interactive authorization [model]', () => {
  beforeEach(() => {
    global.ZenMoney = { WebView: NativeView, application: { platform: 'android' } } as unknown as typeof ZenMoney
    NativeView.onGoto = async () => {}
    NativeView.onInit = () => {}
    jest.mocked(installPermissions).mockClear()
    permissionDispose.mockClear()
    domDispose.mockReset().mockResolvedValue(undefined)
    domThrowIfFailed.mockReset()
    jest.mocked(installDomPolicies).mockClear()
  })

  it('stops background authorization before creating a browser or sending a challenge', async () => {
    const constructor = jest.fn()
    global.ZenMoney = { WebView: constructor } as unknown as typeof ZenMoney
    await expect(authorizeInWebView(true)).rejects.toBeInstanceOf(UserInteractionError)
    expect(constructor).not.toHaveBeenCalled()
  })

  it('installs Android geo fallback with the plugin-provided Minsk position before presentation', async () => {
    global.ZenMoney = { WebView: NativeView, application: { platform: 'android' }, device: { os: { name: 'Android' } } } as unknown as typeof ZenMoney
    NativeView.onGoto = async view => { xhr(view, 'https://mb.asb.by/ibanking/users/auth/login', 200, tokenResult) }
    await authorizeInWebView(false)
    expect(installPermissions).toHaveBeenCalledTimes(1)
    const config = jest.mocked(installPermissions).mock.calls[0][1]
    expect(config.origins).toEqual(['https://mb.asb.by'])
    expect(config.permissions).toEqual({ geolocation: 'granted' })
    expect(config.mode).toBe('fallback')
    if (config.mode !== 'fallback') throw new Error('Expected fallback configuration')
    const failure = { origin: 'https://mb.asb.by', permission: 'geolocation', operation: 'geolocation.getCurrentPosition', reason: 'denied' as const }
    expect(await config.fallbackWhen(failure)).toBe(true)
    expect(await config.fallbackWhen({ ...failure, reason: 'error' })).toBe(false)
    expect(await config.fallbackWhen({ ...failure, permission: 'camera' })).toBe(false)
    global.ZenMoney = { WebView: NativeView, application: { platform: 'ios' }, device: { os: { name: 'iOS' } } } as unknown as typeof ZenMoney
    expect(await config.fallbackWhen(failure)).toBe(false)
    const adapter = config.adapters?.[0]
    if (adapter === undefined) throw new Error('Expected geolocation adapter')
    expect(await getAdapterDefinition(adapter).invoke({ origin: failure.origin, operation: 'getCurrentPosition', data: { options: { enableHighAccuracy: false, maximumAge: 0, timeout: null } } })).toEqual({ latitude: 53.890496, longitude: 27.522425 })
    expect(jest.mocked(installPermissions).mock.invocationCallOrder[0]).toBeLessThan(NativeView.instance.show.mock.invocationCallOrder[0])
    expect(permissionDispose).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['android', 'https://play.google.com/store/apps/details?id=by.softclub.belarusbank', res.stores.android.title],
    ['ios', 'https://apps.apple.com/by/app/belarusbank/id6773332798', res.stores.ios.title]
  ])('uses application platform %s for guidance and opens its store externally', async (platform, url, title) => {
    // Application metadata takes priority over differing device metadata.
    global.ZenMoney = { WebView: NativeView, application: { platform }, device: { os: { name: 'other' } } } as unknown as typeof ZenMoney
    NativeView.onGoto = async view => { xhr(view, 'https://mb.asb.by/ibanking/users/auth/login', 200, tokenResult) }
    await authorizeInWebView(false)
    const config = jest.mocked(installDomPolicies).mock.calls[0][1]
    expect(config.arg).toHaveProperty('store', { url, title })
    expect(jest.mocked(installDomPolicies).mock.invocationCallOrder[0]).toBeLessThan(NativeView.instance.show.mock.invocationCallOrder[0])
    expect(await NativeView.instance.navigationPolicy?.({ url, method: 'GET', headers: {}, source: 'webView' })).toBe(2)
    expect(await NativeView.instance.navigationPolicy?.({ url: 'https://mb.asb.by/login', method: 'GET', headers: {}, source: 'webView' })).toBeUndefined()
    expect(domDispose).toHaveBeenCalledTimes(1)
  })

  it('terminates with actionable TemporaryError before a second external store opening', async () => {
    // The Android 26.9a1 WebView keeps the first external navigation pending.
    // The requested workaround blocks a repeated attempt and terminates this scrape.
    NativeView.onGoto = async view => {
      const navigation = { url: 'https://play.google.com/store/apps/details?id=by.softclub.belarusbank', method: 'GET', headers: {}, source: 'webView' as const }
      expect(await view.navigationPolicy?.(navigation)).toBe(2)
      expect(await view.navigationPolicy?.(navigation)).toBe(true)
    }
    const error = await authorizeInWebView(false).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(TemporaryError)
    expect(error).toHaveProperty('message', expect.stringContaining('повторите синхронизацию'))
    expect(domDispose).toHaveBeenCalledTimes(1)
    expect(NativeView.instance.close).toHaveBeenCalledTimes(1)
  })

  it('propagates DOM policy failure and closes the owned view', async () => {
    const error = new Error('[webview/dom/apply] Model policy failure')
    NativeView.onGoto = async () => { await jest.mocked(installDomPolicies).mock.calls[0][1].onError?.(error) }
    await expect(authorizeInWebView(false)).rejects.toBe(error)
    expect(domDispose).toHaveBeenCalledTimes(1)
    expect(NativeView.instance.close).toHaveBeenCalledTimes(1)
  })

  it.each([false, true])('captures login tokens from XHR (JSON response: %s) and closes the owned browser', async (json) => {
    NativeView.onGoto = async (view) => {
      xhr(view, 'https://mb.asb.by/ibanking/users/auth/login', 200, {
        token: tokenResult.sessionToken, refreshToken: tokenResult.refreshToken, tokenType: 'Bearer', firstName: 'PRIVATE NAME'
      }, json)
    }
    await expect(authorizeInWebView(false)).resolves.toEqual(tokenResult)
    expect(NativeView.instance.show).toHaveBeenCalledTimes(1)
    expect(NativeView.instance.close).toHaveBeenCalledTimes(1)
  })

  it('ignores preparation, rejected login, unrelated responses and another origin before accepting confirmation', async () => {
    NativeView.onGoto = async (view) => {
      xhr(view, 'https://mb.asb.by/ibanking/users/auth/login/preparation', 200, { requestId: 'model-request' })
      xhr(view, 'https://mb.asb.by/ibanking/users/auth/login', 400, {})
      xhr(view, 'https://other.test/ibanking/users/auth/login', 200, tokenResult)
      xhr(view, 'https://mb.asb.by/ibanking/users/auth/refresh-token', 200, tokenResult)
      xhr(view, 'https://mb.asb.by/ibanking/users/auth/login/model-request', 200, tokenResult)
    }
    await expect(authorizeInWebView(false)).resolves.toEqual(tokenResult)
  })

  it('observes fetch without consuming the response needed by the official client', async () => {
    NativeView.onGoto = async (view) => {
      const window = view.browser.window as { fetch: () => Promise<unknown> }
      // The init script retains the original fetch mock; replace its result rather than the wrapper.
      const nativeFetch = view.browser.nativeFetch as jest.Mock
      const response = { url: 'https://mb.asb.by/ibanking/users/auth/login', status: 200, ok: true, clone: () => ({ json: async () => tokenResult }) }
      nativeFetch.mockResolvedValue(response)
      await expect(window.fetch()).resolves.toBe(response)
    }
    await expect(authorizeInWebView(false)).resolves.toEqual(tokenResult)
  })

  it('preserves the bank Promise when Android installs rejection tracking after Zone.js', async () => {
    // Model the observed Android bootstrap guard and Zone.js constructor identity check.
    // The late tracker from the device reproduces this exact assertion on the real PWA.
    NativeView.onGoto = async (view) => {
      runInNewContext(`
        window.Promise = function ZoneAwarePromise () {}
        const zonePromise = window.Promise
        if (!window.__appZenmoneyPromiseRejectionTrackingInstalled) {
          window.__appZenmoneyPromiseRejectionTrackingInstalled = true
          window.Promise = function Promise () {}
        }
        if (window.Promise !== zonePromise) throw new Error('ZoneAwarePromise has been overwritten')
      `, view.browser)
      xhr(view, 'https://mb.asb.by/ibanking/users/auth/login', 200, tokenResult)
    }
    await expect(authorizeInWebView(false)).resolves.toEqual(tokenResult)
  })

  it('leaves an already installed Android tracker and the current Promise untouched', async () => {
    NativeView.onInit = (browser) => {
      runInNewContext(`
        window.__appZenmoneyPromiseRejectionTrackingInstalled = true
        window.Promise = Promise
        window.initialPromise = window.Promise
      `, browser)
    }
    NativeView.onGoto = async (view) => {
      expect(runInNewContext('window.Promise === window.initialPromise', view.browser)).toBe(true)
      xhr(view, 'https://mb.asb.by/ibanking/users/auth/login', 200, tokenResult)
    }
    await expect(authorizeInWebView(false)).resolves.toEqual(tokenResult)
  })

  it.each(['other origin', 'child frame'])('leaves native tracking enabled in %s', async (scope) => {
    NativeView.onInit = (browser) => {
      runInNewContext(scope === 'other origin'
        ? "window.location.origin = 'https://other.test'"
        : 'window.top = {}', browser)
    }
    NativeView.onGoto = async (view) => {
      expect(runInNewContext('window.__appZenmoneyPromiseRejectionTrackingInstalled', view.browser)).toBeUndefined()
      view.emit('close')
    }
    await expect(authorizeInWebView(false)).rejects.toThrow('webview closed before authorization')
  })

  it('preserves a navigation failure even if cleanup fails too', async () => {
    const error = new Error('[auth/cold] Model navigation failure')
    NativeView.onGoto = async (view) => {
      view.close.mockRejectedValue(new Error('[auth/cold] Model cleanup failure'))
      throw error
    }
    await expect(authorizeInWebView(false)).rejects.toBe(error)
    expect(NativeView.instance.close).toHaveBeenCalledTimes(1)
  })

  it('makes early dismissal reportable and avoids navigating a closed window', async () => {
    // Close while the exposed bridge is installed, before presentation/navigation.
    const expose = jest.spyOn(NativeView.prototype, 'exposeFunction').mockImplementation(async function (this: NativeView, _name, callback) {
      this.bridge = callback
      this.emit('close')
    })
    try {
      const error = await authorizeInWebView(false).catch((error: unknown) => error)
      expect(error).toBeInstanceOf(Error)
      expect(error).not.toBeInstanceOf(ZPAPIError)
      expect(error).toHaveProperty('message', expect.stringContaining('[auth/cold]'))
      expect(NativeView.instance.navigate).not.toHaveBeenCalled()
      expect(NativeView.instance.close).not.toHaveBeenCalled()
    } finally { expose.mockRestore() }
  })

  it('masks credentials and cookies in actual navigation logs', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    NativeView.onGoto = async (view) => {
      await view.navigationPolicy?.({
        url: 'https://mb.asb.by/auth-board?token=MODEL_SECRET_TOKEN&phone=MODEL_PRIVATE_PHONE',
        method: 'GET',
        headers: { Authorization: 'MODEL_SECRET_AUTH', Cookie: 'MODEL_SECRET_COOKIE' },
        source: 'webView'
      })
      view.emit('close')
    }
    try {
      await expect(authorizeInWebView(false)).rejects.toBeInstanceOf(Error)
      expect(debug).toHaveBeenCalled()
      const output = JSON.stringify(debug.mock.calls)
      for (const secret of ['MODEL_SECRET_TOKEN', 'MODEL_PRIVATE_PHONE', 'MODEL_SECRET_AUTH', 'MODEL_SECRET_COOKIE']) expect(output).not.toContain(secret)
    } finally { debug.mockRestore() }
  })
})
