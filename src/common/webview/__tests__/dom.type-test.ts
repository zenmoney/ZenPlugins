import type { WebViewInstance } from '../../webView'
import { createDomPolicyScript, installDomPolicies } from '../dom'
import type { DomPolicyFactory, DomPolicy, DomApplicationContext, DomSyncResult } from '../dom'

declare function expectType<T> (value: T): void

interface Args { readonly hiddenSelectors: readonly string[] }
const policies: DomPolicyFactory<Args> = args => [
  { selectors: args.hiddenSelectors, all: true, policy: 'hidden' },
  { selectors: '.widget', policy: 'invisible' },
  {
    selectors: 'button',
    policy: {
      type: 'custom',
      apply: element => { expectType<Element>(element); if (element instanceof HTMLButtonElement) element.disabled = true },
      isApplied: element => element instanceof HTMLButtonElement && element.disabled
    },
    application: {
      shouldApply: context => {
        expectType<DomApplicationContext>(context)
        if (context.trigger === 'mutation') expectType<readonly MutationRecord[]>(context.mutations)
        if (context.trigger === 'interaction') expectType<Event>(context.event)
        return !context.wasApplied || context.isSatisfied === false
      }
    }
  },
  { selectors: 'a', policy: { type: 'onClick', handler: async (element, event) => { expectType<Element>(element); expectType<Event>(event) } } }
]

// Compile-only public contract, including contextual typing in page-only modules.
export async function checkDomTypes (webView: WebViewInstance, source: string): Promise<void> {
  const script = createDomPolicyScript<typeof policies>(source)
  const controller = await installDomPolicies(webView, {
    origins: ['https://example.test'],
    script,
    arg: { hiddenSelectors: ['.promo'] },
    onError: async error => { expectType<Error>(error) }
  })
  controller.throwIfFailed()
  expectType<Promise<void>>(controller.dispose())
  // @ts-expect-error A factory with required arguments requires arg.
  await installDomPolicies(webView, { origins: ['https://example.test'], script })
  // @ts-expect-error Arguments must match the page factory.
  await installDomPolicies(webView, { origins: ['https://example.test'], script, arg: { hiddenSelectors: 42 } })
  const withoutArgs: DomPolicyFactory = () => []
  await installDomPolicies(webView, { origins: ['https://example.test'], script: createDomPolicyScript<typeof withoutArgs>(source) })
  // @ts-expect-error Async custom apply is forbidden.
  const asyncApply: DomSyncResult = Promise.resolve()
  void asyncApply
  // @ts-expect-error Async callbacks cannot satisfy the synchronous custom policy.
  const asyncPolicy: DomPolicy = { type: 'custom', apply: async element => { element.remove() } }
  void asyncPolicy
  // @ts-expect-error CSS strings do not prove HTMLButtonElement.
  const narrowPolicy: DomPolicy = { type: 'custom', apply: (element: HTMLButtonElement) => { element.disabled = true } }
  void narrowPolicy
  // @ts-expect-error Invalid policy discriminant.
  const invalid: DomPolicy = { type: 'remove', apply: () => {} }
  void invalid
}
