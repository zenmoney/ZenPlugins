import { WebView } from '../../common/webView'
import type { Disposable } from '../../common/webView'
import { UserInteractionError } from '../../errors'
import pageScript from './captcha.webview.ts?format=iife&globalName=DenizCaptchaPage&bundle'

export interface BankCaptcha {
  id: string
  captchaByteData: string
}

interface PageChallenge {
  image: string
  revision: number
}

export async function solveCaptcha (loadCaptcha: () => Promise<BankCaptcha>, isInBackground: boolean): Promise<{ id: string, code: string }> {
  if (isInBackground) throw new UserInteractionError()
  const view = new WebView()
  const registrations: Disposable[] = []
  let closed = false
  let finished = false
  let failed = false
  let cleanupError: unknown
  let answer!: { id: string, code: string }
  let current: { captcha: BankCaptcha, revision: number, receivedAt: number } | undefined
  let pendingRefresh: Promise<PageChallenge> | undefined
  let resolveResult!: (value: { id: string, code: string }) => void
  let rejectResult!: (error: unknown) => void
  const result = new Promise<{ id: string, code: string }>((resolve, reject) => { resolveResult = resolve; rejectResult = reject })
  void result.catch(() => {})
  const fail = (error: unknown): void => { if (!finished) { finished = true; rejectResult(error) } }
  const onClose = (): void => { closed = true; fail(new Error('Captcha entry was cancelled')) }
  const timeout = setTimeout(() => fail(new Error('Captcha entry timed out')), 300000)
  const refresh = async (): Promise<PageChallenge> => {
    if (finished) throw new Error('Captcha window is closed')
    if (pendingRefresh !== undefined) return await pendingRefresh
    pendingRefresh = (async () => {
      try {
        const captcha = await loadCaptcha()
        if (finished) throw new Error('Captcha window is closed')
        current = { captcha, revision: (current?.revision ?? 0) + 1, receivedAt: Date.now() }
        return { image: captcha.captchaByteData, revision: current.revision }
      } catch (error) { fail(error); throw error }
    })()
    try { return await pendingRefresh } finally { pendingRefresh = undefined }
  }
  try {
    view.on('close', onClose)
    view.navigationPolicy = WebView.createNavigationPolicy(navigation => navigation.url === 'about:blank'
      ? WebView.NavigationAction.LOAD
      : WebView.NavigationAction.BLOCK, {
      sanitizeRequestLog: { url: true, headers: { authorization: true, cookie: true, 'set-cookie': true, 'x-token': true, referer: true } }
    })
    registrations.push(await view.exposeFunction('denizCaptchaRefresh', refresh))
    registrations.push(await view.exposeFunction('denizCaptchaSubmit', async (revision, code): Promise<PageChallenge | null> => {
      if (finished) throw new Error('Captcha window is closed')
      console.assert(typeof revision === 'number' && typeof code === 'string' && code.trim() !== '', 'Invalid captcha submission')
      if (pendingRefresh !== undefined) await pendingRefresh
      if (current === undefined || Date.now() - current.receivedAt >= 60000) return await refresh()
      if (current.revision !== revision) return { image: current.captcha.captchaByteData, revision: current.revision }
      finished = true
      resolveResult({ id: current.captcha.id, code: (code as string).trim().toLocaleUpperCase('tr-TR') })
      return null
    }))
    registrations.push(await view.exposeFunction('denizCaptchaCancel', () => fail(new Error('Captcha entry was cancelled'))))
    const present = async (): Promise<void> => {
      await view.setContent(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'nonce-deniz-captcha'; form-action 'none'; base-uri 'none'"></head><body><script nonce="deniz-captcha">${pageScript};DenizCaptchaPage.mount();</script></body></html>`, { waitUntil: 'domcontentloaded' })
      if (!finished) await view.show()
    }
    await Promise.race([present(), result])
    answer = await result
  } catch (error) {
    failed = true
    throw error
  } finally {
    finished = true
    clearTimeout(timeout)
    view.off('close', onClose)
    for (const cleanup of [...registrations.reverse().map(registration => async () => await registration.dispose()), async () => { if (!closed) await view.close() }]) {
      try { await cleanup() } catch (error) {
        if (failed) console.warn('Captcha WebView cleanup failed after an earlier error')
        else if (cleanupError === undefined) cleanupError = error
      }
    }
  }
  if (cleanupError !== undefined) throw cleanupError
  return answer
}
