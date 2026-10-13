import get, { getOptNumber, getOptString } from '../../../../types/get'
import type { Disposable, WebViewInstance } from '../../../webView'
import { getAdapterDefinition } from './internal'
import type { PermissionConfig, PermissionFailure } from './internal'
import type { PageConfig } from './browser'
import coreScript from './core.webview.ts?format=iife&globalName=WebViewScript&bundle'
import lifecycleScript from './lifecycle.webview.js?format=iife&globalName=WebViewScript&bundle'

export type { PermissionAdapter, PermissionConfig, PermissionFailure } from './internal'

const controllers = new WeakMap<WebViewInstance, Disposable>()
let sequence = 0

// Compile static source only; neither page data nor plugin callbacks become code.
function pageFunction<Arg, Result> (source: string): (arg: Arg) => Result {
  // eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval
  return new Function('config', source) as (arg: Arg) => Result
}

const disposePage = pageFunction<{ key: string }, unknown>(`${lifecycleScript}\nreturn WebViewScript.dispose(config)`)
const matchesDocument = pageFunction<{ key: string, documentId: string }, boolean>(`${lifecycleScript}\nreturn WebViewScript.matchesDocument(config)`)

/** Page-level overrides; see docs/plugins/webview/permissions.md. */
export async function installPermissions (webView: WebViewInstance, config: PermissionConfig): Promise<Disposable> {
  if (controllers.has(webView)) throw new Error('WebView permissions are already installed')
  if (config.mode !== 'force' && config.mode !== 'fallback') throw new Error('Invalid permission mode')
  if (config.mode === 'fallback' && typeof config.fallbackWhen !== 'function') throw new Error('Missing fallbackWhen callback')
  if (config.origins.length === 0 || config.origins.some(origin => new URL(origin).origin !== origin || !/^https?:\/\//.test(origin))) {
    throw new Error('Permission origins must be exact HTTP(S) origins')
  }
  const permissions = { ...config.permissions }
  for (const state of Object.values(permissions)) {
    if (!['granted', 'denied', 'prompt'].includes(state)) throw new Error('Invalid permission state')
  }
  const definitions = (config.adapters ?? []).map(getAdapterDefinition)
  const adapters = new Map(definitions.map(definition => [definition.permission, definition]))
  if (adapters.size !== definitions.length) throw new Error('Duplicate permission adapter')
  for (const definition of definitions) {
    if (!Object.prototype.hasOwnProperty.call(permissions, definition.permission)) throw new Error('Adapter permission is not configured')
    definition.validate(permissions[definition.permission])
  }
  const id = `${++sequence}_${Math.random().toString(36).slice(2)}`
  const key = `__zenmoneyPermissions_${id}`
  const bridgeName = `${key}_bridge`
  const origins = [...config.origins]
  const script = pageFunction<PageConfig, unknown>([
    coreScript,
    'const installCore = WebViewScript.default; const adapters = [];',
    ...definitions.map(definition => `{\n${definition.script}\nadapters.push(WebViewScript.default);\n}`),
    'return installCore(config, adapters)'
  ].join('\n'))
  const pageConfig: PageConfig = { key, bridgeName, origins, permissions, mode: config.mode }
  let active = true
  let closed = false
  let setupComplete = false
  let bridgeRegistration: Disposable | undefined
  let scriptRegistration: Disposable | undefined
  let disposal: Promise<void> | undefined

  const dispose = async (): Promise<void> => {
    if (disposal !== undefined) return await disposal
    active = false
    disposal = (async () => {
      let failure: unknown
      const attempt = async (cleanup: () => Promise<void>): Promise<void> => {
        try { await cleanup() } catch (error) { if (failure === undefined) failure = error }
      }
      try {
        if (scriptRegistration !== undefined) await attempt(async () => await scriptRegistration?.dispose())
        if (!closed) {
          await attempt(async () => {
            if (!await webView.isClosed()) await webView.evaluate(disposePage, { key })
          })
        }
        if (bridgeRegistration !== undefined) await attempt(async () => await bridgeRegistration?.dispose())
      } finally {
        controllers.delete(webView)
        await attempt(async () => { webView.off('close', onClose) })
      }
      if (failure !== undefined) throw failure
    })()
    return await disposal
  }
  const onClose = (): void => {
    closed = true
    active = false
    if (setupComplete) void dispose().catch(() => console.error('[webview/permissions] Failed to clean up a closed WebView'))
  }
  const currentDocument = async (origin: string, documentId: string): Promise<boolean> => {
    if (!active || closed || !origins.includes(origin)) return false
    const url = await webView.url()
    if (url === null || new URL(url).origin !== origin) return false
    return await webView.evaluate(matchesDocument, { key, documentId }) && active && !closed
  }
  const ensureOpen = async (): Promise<void> => {
    if (closed || await webView.isClosed()) throw new Error('WebView closed during permission installation')
  }
  const controller = { dispose }
  controllers.set(webView, controller)
  try {
    webView.on('close', onClose)
    await ensureOpen()
    bridgeRegistration = await webView.exposeFunction(bridgeName, async (packet: unknown) => {
      try {
        const origin = getOptString(packet, 'origin')
        const documentId = getOptString(packet, 'documentId')
        const permission = getOptString(packet, 'permission')
        const operation = getOptString(packet, 'operation')
        if (origin === undefined || documentId === undefined || permission === undefined || operation === undefined ||
          !Object.prototype.hasOwnProperty.call(permissions, permission) || !await currentDocument(origin, documentId)) {
          throw new Error('Permission callback belongs to an inactive document')
        }
        let value: unknown
        if (getOptString(packet, 'kind') === 'fallback' && config.mode === 'fallback') {
          const reason = getOptString(packet, 'data.reason')
          if (reason !== 'unavailable' && reason !== 'denied' && reason !== 'error') throw new Error('Invalid permission failure')
          const failure: PermissionFailure = { origin, permission, operation, reason }
          const name = getOptString(packet, 'data.error.name')
          const message = getOptString(packet, 'data.error.message')
          const code = getOptNumber(packet, 'data.error.code')
          if (name !== undefined && message !== undefined) failure.error = { name, message, ...(code === undefined ? {} : { code }) }
          value = await config.fallbackWhen(failure)
          if (typeof value !== 'boolean') throw new Error('fallbackWhen must return a boolean')
        } else if (getOptString(packet, 'kind') === 'adapter') {
          const adapter = adapters.get(permission)
          if (adapter === undefined) throw new Error('Permission adapter is not installed')
          value = await adapter.invoke({ origin, operation, data: get(packet, 'data') })
        } else throw new Error('Invalid permission callback')
        if (!await currentDocument(origin, documentId)) throw new Error('Permission callback belongs to an inactive document')
        return { ok: true, value }
      } catch (error) {
        return { ok: false, message: getOptString(error, 'message') ?? 'Permission callback failed' }
      }
    })
    await ensureOpen()
    scriptRegistration = await webView.addInitScript(script, pageConfig)
    await ensureOpen()
    await webView.evaluate(script, pageConfig)
    await ensureOpen()
    setupComplete = true
    return controller
  } catch (error) {
    try { await dispose() } catch (_) { console.error('[webview/permissions] Failed to roll back permission installation') }
    throw error
  }
}
