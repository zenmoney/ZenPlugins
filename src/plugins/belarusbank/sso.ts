import { WebView } from '../../common/webView'
import type { Disposable } from '../../common/webView'
import { geoPermission, installPermissions } from '../../common/webview/permissions'
import { createDomPolicyScript, installDomPolicies } from '../../common/webview/dom'
import type { DomPolicyController } from '../../common/webview/dom'
import type ssoPolicies from './sso-ui.webview'
import ssoUiScript from './sso-ui.webview.ts?format=iife&globalName=WebViewScript&bundle'
import { res } from './res'
import { TemporaryError, UserInteractionError } from '../../errors'
import authCaptureScript from './sso.webview.js?format=iife&globalName=WebViewScript&bundle'

const AUTH_URL = 'https://mb.asb.by/auth-board/login'
const AUTH_ORIGIN = 'https://mb.asb.by'
const BRIDGE_NAME = '__zenmoneyAuthCompleted'

// eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval
const installCapture = new Function('config', `${authCaptureScript}\nreturn WebViewScript.default(config)`) as (config: { origin: string, bridgeName: string }) => void

export const authorizeInWebView = async (isInBackground: boolean): Promise<unknown> => {
  if (isInBackground) throw new UserInteractionError()

  const webView = new WebView({
    inspectable: true
  })
  let resolveAuth!: (value: unknown) => void
  let rejectAuth!: (error: unknown) => void
  const authorized = new Promise<unknown>((resolve, reject) => {
    resolveAuth = resolve
    rejectAuth = reject
  })

  void authorized.catch(() => {})
  let closed = false
  let failed = false
  const onClose = (): void => {
    closed = true
    rejectAuth(new Error('[auth/cold] webview closed before authorization'))
  }
  let result: unknown
  let closeError: unknown
  let permissions: Disposable | undefined
  let domPolicies: DomPolicyController | undefined

  try {
    webView.on('close', onClose)
    const os = ZenMoney.application.platform
    const store = os === 'android' ? res.stores.android : res.stores.ios
    let storeOpened = false
    webView.navigationPolicy = WebView.createNavigationPolicy(({ url }) => {
      if (url !== store.url) return WebView.NavigationAction.LOAD
      if (storeOpened) {
        rejectAuth(new TemporaryError(res.storeAlreadyOpened))
        return WebView.NavigationAction.BLOCK
      }
      storeOpened = true
      return WebView.NavigationAction.OPEN_EXTERNAL
    }, {
      sanitizeRequestLog: { url: { query: true }, headers: true }
    })
    permissions = await installPermissions(webView, {
      origins: [AUTH_ORIGIN],
      mode: 'fallback',
      permissions: { geolocation: 'granted' },
      fallbackWhen: failure => ZenMoney.device.os.name.toLowerCase() === 'android' &&
        failure.permission === 'geolocation' && (failure.reason === 'unavailable' || failure.reason === 'denied'),
      adapters: [geoPermission({
        getPosition: () => ({ latitude: 53.890496, longitude: 27.522425 })
      })]
    })
    domPolicies = await installDomPolicies(webView, {
      origins: [AUTH_ORIGIN],
      script: createDomPolicyScript<typeof ssoPolicies>(ssoUiScript),
      arg: { dialog: res.installationDialog, store },
      onError: rejectAuth
    })
    await webView.exposeFunction(BRIDGE_NAME, resolveAuth)

    await webView.addInitScript(installCapture, { origin: AUTH_ORIGIN, bridgeName: BRIDGE_NAME })
    if (!closed) {
      await webView.show()
      if (!closed) void webView.goto(AUTH_URL, { waitUntil: 'domcontentloaded' }).catch(rejectAuth)
    }
    result = await authorized
    domPolicies.throwIfFailed()
  } catch (error) {
    failed = true
    throw error
  } finally {
    webView.off('close', onClose)
    try {
      await domPolicies?.dispose()
    } catch (error) {
      if (failed) console.warn('[auth/cold] Failed to clean up DOM policies after an earlier failure')
      else closeError = error
    }
    try {
      await permissions?.dispose()
    } catch (error) {
      if (failed) console.warn('[auth/cold] Failed to clean up permissions after an earlier failure')
      else if (closeError === undefined) closeError = error
    }
    if (!closed) {
      try {
        await webView.close()
      } catch (error) {
        if (closeError === undefined) closeError = error
        if (failed) console.warn('[auth/cold] Failed to close sign-in window after an earlier failure')
      }
    }
  }
  if (closeError !== undefined) throw closeError
  return result
}
