import type { WebViewNavigation, WebViewNavigationPolicy } from '../../../common/webView'

jest.mock('../config', () => ({
  __esModule: true,
  default: { clientId: 'model-client', redirectUri: 'https://example.test/callback' }
}), { virtual: true })

const { login } = jest.requireActual<{
  login: (state: Record<string, unknown>, preferences: { inn: string, kpp: string }, isInBackground: boolean) => Promise<unknown>
}>('../api')

// [model] Stop at the first navigation; verify masking without inventing a bank response.
it('[model] logs the authorization navigation once with the existing explicit masks', async () => {
  jest.useFakeTimers({ doNotFake: ['performance'] })
  const originalZenMoney = global.ZenMoney
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  const error = new Error('Model navigation stopped')
  const close = jest.fn(async () => {})
  class NativeWebView {
    private policy: WebViewNavigationPolicy | null = null
    get navigationPolicy (): WebViewNavigationPolicy | null { return this.policy }
    set navigationPolicy (value: WebViewNavigationPolicy | null) { this.policy = value }
    readonly close = close
    async show (): Promise<void> {}
    async goto (url: string): Promise<void> {
      // Model the native Headers payload at the wrapper boundary.
      await this.policy?.({ url, method: 'GET', headers: new Headers(), source: 'webView' } as unknown as WebViewNavigation)
      throw error
    }
  }
  global.ZenMoney = { WebView: NativeWebView } as unknown as typeof ZenMoney
  try {
    await expect(login({}, { inn: 'model-inn', kpp: 'model-kpp' }, false)).rejects.toBe(error)
    expect(close).not.toHaveBeenCalled()
    jest.runOnlyPendingTimers()
    expect(close).toHaveBeenCalledTimes(1)
    expect(debug).toHaveBeenCalledTimes(1)
    const [, request] = debug.mock.calls[0] as [string, { url: string }]
    expect(Object.fromEntries(new URL(request.url).searchParams)).toEqual({
      client_id: '<string[12]>',
      redirect_uri: '<string[29]>',
      state: '<string[16]>',
      response_type: 'code',
      scope_parameters: '<string[37]>'
    })
    expect(JSON.stringify(debug.mock.calls)).not.toContain('model-inn')
    expect(JSON.stringify(debug.mock.calls)).not.toContain('model-kpp')
  } finally {
    jest.useRealTimers()
    global.ZenMoney = originalZenMoney
    jest.restoreAllMocks()
  }
})
