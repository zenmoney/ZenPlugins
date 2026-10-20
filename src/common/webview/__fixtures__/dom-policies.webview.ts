import type { DomPolicyFactory } from '../dom'

export interface Args { readonly invisibleSelectors: readonly string[] }

const policies: DomPolicyFactory<Args> = args => [
  { selectors: args.invisibleSelectors, all: true, policy: 'invisible' },
  { selectors: '.hidden', all: true, policy: 'hidden' },
  { selectors: '.deleted', all: true, policy: 'delete' },
  { selectors: '.custom', all: true, policy: { type: 'custom', apply: element => { element.setAttribute('count', String(Number(element.getAttribute('count')) + 1)) } } },
  {
    selectors: '.verified',
    policy: { type: 'custom', apply: element => { element.setAttribute('applied', '') }, isApplied: element => element.hasAttribute('applied') },
    application: { shouldApply: context => !context.wasApplied || context.isSatisfied === false }
  },
  {
    selectors: '.replace',
    all: true,
    policy: { type: 'onClick', handler: (element, event) => { element.setAttribute('policy-click', event.type) } }
  },
  {
    selectors: '.listen',
    all: true,
    policy: { type: 'onClick', behavior: 'listen', handler: element => { element.setAttribute('policy-click', 'listen') } }
  },
  {
    selectors: '.failure',
    policy: { type: 'onClick', handler: async () => { throw new Error('[webview/dom/test] Private callback error') } }
  }
]

export default policies
