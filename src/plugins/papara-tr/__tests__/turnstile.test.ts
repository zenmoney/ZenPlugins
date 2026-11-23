import { EventEmitter } from 'events'
import type { Disposable, WebViewNavigationPolicy } from '../../../common/webView'
import { solveTurnstile, TURNSTILE_SITE_KEY } from '../turnstile'
import { UserInteractionError } from '../../../errors'

type Bridge = (...args: unknown[]) => unknown

// Model of the native WebView lifecycle; the widget itself is not executed.
class NativeView extends EventEmitter {
  static readonly NavigationAction = { LOAD: undefined, BLOCK: true, OPEN_EXTERNAL: 2 }
  static instances: NativeView[] = []
  static onContent: (view: NativeView) => void = () => {}
  private policy: WebViewNavigationPolicy | null = null
  get navigationPolicy (): WebViewNavigationPolicy | null { return this.policy }
  set navigationPolicy (value: WebViewNavigationPolicy | null) { this.policy = value }
  readonly bridges = new Map<string, Bridge>()
  readonly show = jest.fn(async () => {})
  readonly close = jest.fn(async () => { this.emit('close') })
  readonly setContent = jest.fn(async (_html: string, _options?: unknown) => { NativeView.onContent(this) })
  constructor () { super(); NativeView.instances.push(this) }
  async exposeFunction (name: string, callback: Bridge): Promise<Disposable> {
    this.bridges.set(name, callback)
    return { dispose: async () => { this.bridges.delete(name) } }
  }
}

describe('Turnstile WebView [model]', () => {
  beforeEach(() => {
    NativeView.instances = []
    global.ZenMoney = { WebView: NativeView } as unknown as typeof ZenMoney
  })

  it('does not open a WebView in the background', async () => {
    await expect(solveTurnstile('https://www.papara.com/', true)).rejects.toBeInstanceOf(UserInteractionError)
    expect(NativeView.instances).toHaveLength(0)
  })

  it('loads the widget with the Papara origin as baseURL, returns the callback token and closes the window', async () => {
    NativeView.onContent = view => { setTimeout(() => { void view.bridges.get('paparaTurnstileSubmit')?.('turnstile-token') }, 0) }
    await expect(solveTurnstile('https://www.papara.com/', false)).resolves.toBe('turnstile-token')
    const view = NativeView.instances[0]
    const [html, options] = view.setContent.mock.calls[0]
    expect(options).toEqual({ baseURL: 'https://www.papara.com/', waitUntil: 'domcontentloaded' })
    expect(html).toContain(`data-sitekey="${TURNSTILE_SITE_KEY}"`)
    expect(html).toContain('https://challenges.cloudflare.com/turnstile/v0/api.js')
    expect(view.show).toHaveBeenCalled()
    expect(view.close).toHaveBeenCalledTimes(1)
    expect(view.bridges.size).toBe(0)
    const policy = view.navigationPolicy as WebViewNavigationPolicy
    const decide = async (url: string): Promise<unknown> => await policy({ url, method: 'GET', headers: {}, source: 'webView' })
    expect(await decide('https://challenges.cloudflare.com/cdn-cgi/challenge-platform/x')).toBe(NativeView.NavigationAction.LOAD)
    expect(await decide('https://www.papara.com/')).toBe(NativeView.NavigationAction.LOAD)
    expect(await decide('https://evil.example/')).toBe(NativeView.NavigationAction.BLOCK)
  })

  it('rejects when the user closes the window', async () => {
    NativeView.onContent = view => { setTimeout(() => { void view.close() }, 0) }
    await expect(solveTurnstile('https://www.papara.com/', false)).rejects.toThrow('Turnstile verification was cancelled')
    expect(NativeView.instances[0].close).toHaveBeenCalledTimes(1)
  })

  it('rejects with the widget error code and closes the window', async () => {
    NativeView.onContent = view => { setTimeout(() => { void view.bridges.get('paparaTurnstileFailed')?.('300030') }, 0) }
    await expect(solveTurnstile('https://www.papara.com/', false)).rejects.toThrow('Turnstile widget error: 300030')
    expect(NativeView.instances[0].close).toHaveBeenCalledTimes(1)
  })
})
