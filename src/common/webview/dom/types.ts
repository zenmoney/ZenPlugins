/* eslint-disable @typescript-eslint/no-invalid-void-type -- void | undefined rejects async callbacks, and void factories allow omitted arguments. */
import type { Disposable } from '../../webView'

export type DomRoot = Document | ShadowRoot
export type DomBuiltinPolicy = 'delete' | 'hidden' | 'invisible'
// Unlike plain void, this rejects Promise-returning callbacks.
export type DomSyncResult = void | undefined
export type DomStateCheck = (element: Element) => boolean

export interface DomCustomPolicy {
  readonly type: 'custom'
  readonly apply: (element: Element) => DomSyncResult
  readonly isApplied?: DomStateCheck
}

export interface DomClickPolicy {
  readonly type: 'onClick'
  readonly handler: (element: Element, event: Event) => void | Promise<void>
  readonly behavior?: 'replace' | 'listen'
}

export type DomPolicy = DomBuiltinPolicy | DomCustomPolicy | DomClickPolicy

export interface DomApplicationState {
  readonly element: Element
  readonly root: DomRoot
  readonly wasApplied: boolean
  readonly isSatisfied: boolean | null
}

export type DomApplicationContext = DomApplicationState & (
  | { readonly trigger: 'initial' }
  | { readonly trigger: 'mutation', readonly mutations: readonly MutationRecord[] }
  | { readonly trigger: 'interaction', readonly event: Event }
)

export type DomShouldApply = (context: DomApplicationContext) => boolean

export interface DomObservation {
  readonly childList?: boolean
  readonly attributes?: boolean
  readonly characterData?: boolean
  readonly attributeFilter?: readonly string[]
}

export interface DomApplication {
  readonly initial?: 'immediate' | 'domcontentloaded' | false
  readonly observe?: false | DomObservation
  readonly shouldApply?: DomShouldApply
}

export interface DomRule {
  readonly selectors: string | readonly string[]
  readonly all?: boolean
  readonly policy: DomPolicy
  readonly application?: DomApplication
}

export type DomPolicyFactory<Arg = void> = (arg: Arg) => readonly DomRule[]
declare const domPolicyScriptBrand: unique symbol

export interface DomPolicyScript<Arg = void> {
  readonly source: string
  readonly [domPolicyScriptBrand]: (arg: Arg) => Arg
}

export type DomPolicyArgument<Factory extends DomPolicyFactory<never>> = Parameters<Factory>[0]

export type DomPolicyErrorHandler = (error: Error) => void | Promise<void>

export type InstallDomPoliciesOptions<Arg = void> = {
  readonly origins: readonly string[]
  readonly script: DomPolicyScript<Arg>
  readonly includeShadowDom?: boolean
  readonly onError?: DomPolicyErrorHandler
} & ([Arg] extends [void] ? { readonly arg?: Arg } : { readonly arg: Arg })

export interface DomPolicyController extends Disposable {
  readonly throwIfFailed: () => void
}
