import { WebView } from '../../common/webView'
import { UserInteractionError } from '../../errors'

// Closing this UI only ends presentation. ZEN must independently confirm success.
export async function presentFaceVerification (token: string, isInBackground: boolean): Promise<void> {
  if (isInBackground) throw new UserInteractionError()
  const view = new WebView()
  let closed = false
  let failed = false
  let cleanupError: unknown
  let browserRequested = false
  const target = 'https://face.authentication.idenfy.com/?token=' + encodeURIComponent(token)
  let resolveClose!: () => void
  let rejectClose!: (error: unknown) => void
  const dismissed = new Promise<void>((resolve, reject) => { resolveClose = resolve; rejectClose = reject })
  void dismissed.catch(() => {})
  const onClose = (): void => { closed = true; resolveClose() }
  const timeout = setTimeout(() => rejectClose(new Error('ZEN.COM face verification window timed out')), 300000)
  const logging = { sanitizeRequestLog: { url: { query: true }, headers: true } }
  try {
    view.on('close', onClose)
    view.navigationPolicy = WebView.createNavigationPolicy(navigation => {
      const url = new URL(navigation.url)
      if (url.href === 'about:blank' || url.href === 'https://face.authentication.idenfy.com/') return WebView.NavigationAction.LOAD
      if (url.href !== target) return WebView.NavigationAction.BLOCK
      browserRequested = true
      return WebView.NavigationAction.OPEN_EXTERNAL
    }, logging)
    await view.show()
    if (!closed) {
      await Promise.race([
        view.setContent(`<!doctype html>
<html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>ZEN.COM face verification</title>
<style>body{font:18px system-ui,sans-serif;padding:28px;line-height:1.5;color:#222;background:#fff}a{display:block;padding:16px;background:#5c23b4;color:#fff;text-align:center;border-radius:10px;text-decoration:none;margin:28px 0}</style></head>
<body><h1>Face verification</h1><p>Open iDenfy in your browser and complete the face check.</p>
<a href="${target}">Open verification</a><h2>After your selfie is approved</h2>
<ol><li>Return to the Zenmoney app.</li><li>Close this face verification window using its close button.</li></ol>
<p>Synchronization continues after you close this window. It does not resume automatically while this window is open.</p></body></html>`, {
          baseURL: 'https://face.authentication.idenfy.com/', waitUntil: 'domcontentloaded'
        }),
        dismissed
      ])
    }
    await dismissed
    assert(browserRequested, 'ZEN.COM face verification browser was not opened')
  } catch (error) {
    failed = true
    throw error
  } finally {
    clearTimeout(timeout)
    for (const cleanup of [async () => { view.off('close', onClose) }, async () => { if (!closed) await view.close() }]) {
      try {
        await cleanup()
      } catch (error) {
        if (failed) console.warn('ZEN.COM face WebView cleanup failed after an earlier error')
        else if (cleanupError === undefined) cleanupError = error
      }
    }
  }
  if (cleanupError !== undefined) throw cleanupError
}
