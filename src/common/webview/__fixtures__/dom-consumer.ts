import type policies from './dom-policies.webview'
import source from './dom-policies.webview.ts?format=iife&globalName=WebViewScript&bundle'
import { createDomPolicyScript, installDomPolicies } from '../dom'
import type { WebViewInstance } from '../../webView'
import type { DomPolicyController, DomPolicyErrorHandler } from '../dom'
import { geoPermission, installPermissions } from '../permissions'

const script = createDomPolicyScript<typeof policies>(source)

export async function install (view: WebViewInstance, origins: readonly string[], onError?: DomPolicyErrorHandler): Promise<DomPolicyController> {
  return await installDomPolicies(view, { origins, script, arg: { invisibleSelectors: ['.invisible'] }, onError })
}

export async function permissions (view: WebViewInstance, origins: string[]): Promise<void> {
  await installPermissions(view, { origins, mode: 'force', permissions: { geolocation: 'granted' }, adapters: [geoPermission({ getPosition: () => ({ latitude: 1, longitude: 2, accuracy: 3 }) })] })
}
