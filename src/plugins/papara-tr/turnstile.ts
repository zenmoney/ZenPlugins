import { WebView } from '../../common/webView'
import type { Disposable } from '../../common/webView'
import { UserInteractionError } from '../../errors'

// Public Turnstile site key used by the Papara web client.
export const TURNSTILE_SITE_KEY = '0x4AAAAAABdUwqn8h13LFgWe'
const TURNSTILE_TIMEOUT_MS = 300000

function buildPage (siteKey: string): string {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:-apple-system,system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:90vh;margin:0;padding:16px;box-sizing:border-box}p{text-align:center}</style>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=paparaTurnstileLoaded" async defer></script>
</head><body>
<p>Papara giriş doğrulaması</p>
<div class="cf-turnstile" data-sitekey="${siteKey}" data-callback="paparaTurnstileDone" data-error-callback="paparaTurnstileError" data-expired-callback="paparaTurnstileExpired"></div>
<script>
window.paparaTurnstileLoaded = function () {}
window.paparaTurnstileDone = function (token) { window.paparaTurnstileSubmit(token) }
window.paparaTurnstileError = function (code) { window.paparaTurnstileFailed(String(code)) }
window.paparaTurnstileExpired = function () { if (window.turnstile) window.turnstile.reset() }
</script>
</body></html>`
}

export async function solveTurnstile (baseURL: string, isInBackground: boolean): Promise<string> {
  if (isInBackground) throw new UserInteractionError()
  const view = new WebView()
  const registrations: Disposable[] = []
  let closed = false
  let finished = false
  let resolveResult!: (token: string) => void
  let rejectResult!: (error: unknown) => void
  const result = new Promise<string>((resolve, reject) => { resolveResult = resolve; rejectResult = reject })
  void result.catch(() => {})
  const fail = (error: unknown): void => { if (!finished) { finished = true; rejectResult(error) } }
  const onClose = (): void => { closed = true; fail(new Error('Turnstile verification was cancelled')) }
  const timeout = setTimeout(() => fail(new Error('Turnstile verification timed out')), TURNSTILE_TIMEOUT_MS)
  const origin = new URL(baseURL).origin
  try {
    view.on('close', onClose)
    view.navigationPolicy = WebView.createNavigationPolicy(navigation => {
      const url = navigation.url
      if (url === 'about:blank' || url.startsWith('https://challenges.cloudflare.com/') || url.startsWith(origin + '/')) {
        return WebView.NavigationAction.LOAD
      }
      return WebView.NavigationAction.BLOCK
    })
    registrations.push(await view.exposeFunction('paparaTurnstileSubmit', (token: unknown) => {
      console.assert(typeof token === 'string' && token !== '', 'Turnstile returned an empty token')
      if (!finished) { finished = true; resolveResult(token as string) }
    }))
    registrations.push(await view.exposeFunction('paparaTurnstileFailed', (code: unknown) => {
      fail(new Error(`Turnstile widget error: ${String(code)}`))
    }))
    const present = async (): Promise<void> => {
      await view.setContent(buildPage(TURNSTILE_SITE_KEY), { baseURL, waitUntil: 'domcontentloaded' })
      if (!finished) await view.show()
    }
    await Promise.race([present(), result])
    return await result
  } finally {
    finished = true
    clearTimeout(timeout)
    view.off('close', onClose)
    for (const registration of registrations.reverse()) {
      try { await registration.dispose() } catch { console.warn('Turnstile WebView registration cleanup failed') }
    }
    if (!closed) {
      try { await view.close() } catch { console.warn('Turnstile WebView close failed') }
    }
  }
}
