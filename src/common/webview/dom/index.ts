/* eslint-disable @typescript-eslint/no-invalid-void-type -- Public factory arguments use void to support omitted arguments. */
import { getOptString, getOptNumber } from '../../../types/get'
import type { Disposable, WebViewInstance } from '../../webView'
import type { DomPageConfig, DomPageFailure } from './browser'
import type { DomPolicyFactory, DomPolicyScript, DomPolicyArgument, InstallDomPoliciesOptions, DomPolicyController } from './types'
import runtime from './dom.webview.ts?format=iife&globalName=WebViewScript&bundle'

export type {
  DomRoot, DomBuiltinPolicy, DomSyncResult, DomStateCheck, DomCustomPolicy,
  DomClickPolicy, DomPolicy, DomApplicationState, DomApplicationContext,
  DomShouldApply, DomObservation, DomApplication, DomRule, DomPolicyFactory,
  DomPolicyScript, DomPolicyArgument, DomPolicyErrorHandler, InstallDomPoliciesOptions, DomPolicyController
} from './types'

const controllers = new WeakMap<WebViewInstance, DomPolicyController>()
let sequence = 0

function pageFunction<Arg, Result> (source: string): (arg: Arg) => Result {
  // Compile static bundles only, never argument data or plugin callbacks.
  // eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval
  return new Function('config', source) as (arg: Arg) => Result
}

export function createDomPolicyScript<Factory extends DomPolicyFactory<never>> (source: string): DomPolicyScript<DomPolicyArgument<Factory>> {
  // The brand links the string bundle to a compile-only factory signature.
  const script = { source }
  return script as DomPolicyScript<DomPolicyArgument<Factory>>
}

const disposePage = pageFunction<{ key: string }, DomPageFailure | undefined>(`${runtime}\nreturn WebViewScript.dispose(config)`)
const matchesDocument = pageFunction<{ key: string, documentId: string }, boolean>(`${runtime}\nreturn WebViewScript.matchesDocument(config)`)

/** Persistent page policies; see docs/webview/dom-policies.md. */
export async function installDomPolicies<Arg = void> (webView: WebViewInstance, options: InstallDomPoliciesOptions<Arg>): Promise<DomPolicyController> {
  if (controllers.has(webView)) throw new Error('[webview/dom/install] DOM policies are already installed')
  if (options.origins.length === 0 || options.origins.some(origin => new URL(origin).origin !== origin || !/^https?:\/\//.test(origin))) {
    throw new Error('[webview/dom/install] Origins must be exact HTTP(S) origins')
  }
  if (typeof options.script.source !== 'string' || options.script.source.trim() === '') throw new Error('[webview/dom/install] Missing policy bundle')
  const key = `__zenmoneyDom_${++sequence}_${Math.random().toString(36).slice(2)}`
  const bridgeName = `${key}_bridge`
  const config: DomPageConfig = { key, bridgeName, origins: [...options.origins], includeShadowDom: options.includeShadowDom !== false, arg: options.arg }
  const script = pageFunction<DomPageConfig, void>([
    runtime,
    'const installDom = WebViewScript.default;',
    'const recordInitialFailure = WebViewScript.recordInitialFailure;',
    // Check the origin before executing even the factory module's top-level code.
    'if (window !== window.top || !config.origins.includes(location.origin)) return;',
    'try {',
    options.script.source,
    'return installDom(config, WebViewScript.default)',
    '} catch (error) {',
    'recordInitialFailure(config);',
    'const callback = window[config.bridgeName];',
    'if (typeof callback === "function") void Promise.resolve(callback({ kind: "failure", origin: location.origin, documentId: "initial", stage: "install" })).catch(() => {});',
    'throw error; }'
  ].join('\n'))
  let active = true
  let closed = false
  let setupComplete = false
  let pageError: Error | undefined
  let cleanupError: unknown
  let notified = false
  let bridge: Disposable | undefined
  let registration: Disposable | undefined
  let disposal: Promise<void> | undefined

  const throwIfFailed = (): void => {
    if (pageError !== undefined) throw pageError
    if (cleanupError !== undefined) throw cleanupError
  }
  const notifyError = (error: Error): void => {
    if (notified || options.onError === undefined) return
    notified = true
    const notificationFailed = (): void => { console.error('[webview/dom/error] Error notification failed') }
    try { void Promise.resolve(options.onError(error)).catch(notificationFailed) } catch (_) { notificationFailed() }
  }
  const rememberPageError = (packet: unknown): void => {
    if (pageError !== undefined) return
    // Page callbacks retain private exception text; only diagnostics cross realms.
    console.error('[webview/dom/apply] Page policy failed', { origin: getOptString(packet, 'origin'), stage: getOptString(packet, 'stage'), rule: getOptNumber(packet, 'rule') })
    pageError = new Error('[webview/dom/apply] Page policy failed')
    if (setupComplete) notifyError(pageError)
  }

  const cleanup = async (): Promise<void> => {
    if (disposal !== undefined) return await disposal
    active = false
    disposal = (async () => {
      let firstError: unknown
      const attempt = async (cleanup: () => Promise<void>): Promise<void> => {
        try { await cleanup() } catch (error) { if (firstError === undefined) firstError = error }
      }
      try {
        if (registration !== undefined) await attempt(async () => await registration?.dispose())
        if (!closed) {
          await attempt(async () => {
            if (!await webView.isClosed()) {
              // Read terminal page state before removing the bridge, including a
              // failure whose asynchronous notification has not reached us yet.
              const status = await webView.evaluate(disposePage, { key })
              if (getOptString(status, 'stage') !== undefined) rememberPageError(status)
            }
          })
        }
        if (bridge !== undefined) await attempt(async () => await bridge?.dispose())
      } finally {
        controllers.delete(webView)
        await attempt(async () => { webView.off('close', onClose) })
      }
      cleanupError = firstError
      if (firstError !== undefined) throw firstError
    })()
    return await disposal
  }
  const dispose = async (): Promise<void> => {
    // Cleanup is shared with automatic shutdown; a remembered page failure is
    // still observable when the owner later releases the installation.
    try { await cleanup() } finally { throwIfFailed() }
  }
  const onClose = (): void => {
    closed = true
    active = false
    if (setupComplete) {
      void cleanup().catch(error => {
        if (pageError === undefined && error instanceof Error) notifyError(error)
      })
    }
  }
  const ensureOpen = async (): Promise<void> => {
    if (closed || await webView.isClosed()) throw new Error('[webview/dom/install] WebView closed during installation')
    throwIfFailed()
  }
  const controller = { dispose, throwIfFailed }
  controllers.set(webView, controller)
  try {
    webView.on('close', onClose)
    await ensureOpen()
    bridge = await webView.exposeFunction(bridgeName, async (packet: unknown) => {
      const origin = getOptString(packet, 'origin')
      const documentId = getOptString(packet, 'documentId')
      if (!active || closed || origin === undefined || documentId === undefined || !config.origins.includes(origin)) return false
      const kind = getOptString(packet, 'kind')
      if (kind === 'failure') {
        rememberPageError(packet)
        if (setupComplete) {
          void cleanup().catch(() => {})
        }
        return false
      }
      if (kind !== 'active') return false
      const url = await webView.url()
      return url !== null && new URL(url).origin === origin && await webView.evaluate(matchesDocument, { key, documentId }) && active && !closed
    })
    await ensureOpen()
    registration = await webView.addInitScript(script, config)
    await ensureOpen()
    await webView.evaluate(script, config)
    await ensureOpen()
    setupComplete = true
    throwIfFailed()
    return controller
  } catch (error) {
    try { await cleanup() } catch (_) { console.error('[webview/dom/install] Failed to roll back installation') }
    throw error
  }
}
