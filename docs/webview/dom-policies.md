# DOM policies

Use DOM policies to maintain WebView element effects across SPA updates and navigation without polling. Read the [public types](../../src/common/webview/dom/types.ts) for exact shapes and [page script contract](README.md#page-scripts) for bundling. Types support TypeScript 4.7.

## Install and own the controller

Define rules in a standalone `*.webview.ts` or `*.webview.js` module. Use an explicit `DomPolicyFactory<Args>` annotation for callback inference. Pass serializable page data through `arg`; page modules have only type imports and page-local code, with no runtime plugin dependencies or captured plugin closures.

```ts
// policies.webview.ts
import type { DomPolicyFactory } from '../../common/webview/dom'

interface Args { readonly hiddenSelectors: readonly string[] }

const policies: DomPolicyFactory<Args> = args => [
  { selectors: args.hiddenSelectors, all: true, policy: 'hidden' },
  {
    selectors: '.help-link',
    policy: {
      type: 'onClick',
      behavior: 'replace',
      handler: (element, event) => { element.setAttribute('data-click', event.type) }
    }
  }
]
export default policies
```

```ts
// Plugin code
import type policies from './policies.webview'
import source from './policies.webview.ts?format=iife&globalName=WebViewScript&bundle'
import { createDomPolicyScript, installDomPolicies } from '../../common/webview/dom'

const controller = await installDomPolicies(webView, {
  origins: ['https://example.test'],
  script: createDomPolicyScript<typeof policies>(source),
  arg: { hiddenSelectors: ['.promo', '.banner'] }
})
try {
  await webView.goto('https://example.test')
  controller.throwIfFailed()
} finally {
  await controller.dispose()
}
```

Install before navigation to register capture handling before page handlers. Use exact, nonempty HTTP(S) origins: the factory executes only there. One DOM installation may be active per WebView, independently of permissions. Installation covers the current document and navigation through one `addInitScript` registration. `arg` is required when the factory argument is required.

## Select elements and choose effects

- `selectors` accepts one CSS query or an array. `all: false` (default) selects the first match per query per root; `all: true` selects all. Overlapping matches within a rule share one application; separate rules run in declaration order.
- Search covers the document and open Shadow DOM by default. Set installer `includeShadowDom: false` for document-only search. Queries stay local to each root; iframe documents and closed shadow roots are excluded. Empty matches are valid and may appear later under observation.
- Callbacks receive `Element`; narrow with `instanceof` for control properties. Click handlers receive `Event`, including synthetic clicks, and may be async. `custom.apply` is synchronous and returns nothing.

| Policy | Effect | Default application |
| --- | --- | --- |
| `delete` | Remove node and layout space | Once per element |
| `hidden` | `display: none !important`; no space, including `display: contents`; block subtree interaction | Apply or restore whenever effect is absent |
| `invisible` | `visibility: hidden !important`; preserve geometry; block subtree interaction; pointer/touch hits pass through | Apply or restore whenever effect is absent |
| `custom` | Run `apply`; optional `isApplied` checks current state | Once per element |
| `onClick` | Install click handler | Once per element |

Prefer hiding for framework-owned nodes: deletion may break ownership assumptions. Visibility covers descendants, assigned slots, and included open shadow trees, even with descendant `visibility: visible`. Both visibility policies require native `inert`, block focus, and blur focused descendants. They preserve HTML `disabled` and field inclusion in `FormData`.

Active installations also block programmatic activation, including non-cancelable synthetic clicks and detached previously blocked elements. Other `input`, `change`, and custom events keep their behavior. Blocking takes priority over `onClick`. Each click rule uses the nearest applied element in the composed path. `replace` (default) prevents the original event/default action and ends policy dispatch before calling the handler; `listen` permits later rules and normal propagation. Non-composed clicks inside open shadow roots are handled locally.

## Control application

| Setting | Default | Use |
| --- | --- | --- |
| `initial` | `'immediate'` | Use `'domcontentloaded'` to delay all processing until readiness; `false` skips the initial pass |
| `observe` | Child, attribute, and text changes | Use `false` for a snapshot without later discovery or recovery |
| `shouldApply` | Policy decision above | Synchronous predicate replacing that decision |

Observation discovers new/replacement elements and existing nodes that start matching. Once-only policies retain history when the same node is reinserted; clones/replacements are new targets. Visibility effects remain maintained after the original selector stops matching. Observation alone does not repeat custom callbacks.

Choose the smallest application override:

- **Ready-DOM snapshot:** `{ initial: 'domcontentloaded', observe: false }`. Later insertions/resets are ignored. `initial: false` plus `observe: false` produces no passes.
- **Wait for element state:** `shouldApply: c => !c.wasApplied && c.element.getAttribute('data-ready') === 'true'`. Observe the readiness attribute so deferred elements can be reconsidered.
- **Restore a custom effect:** supply `policy.isApplied` and `shouldApply: c => !c.wasApplied || c.isSatisfied === false`. `isApplied` must return `true` after `apply`, or application fails. Repeatable callbacks must be idempotent and converge after their own DOM changes.

`observe` booleans (`childList`, `attributes`, `characterData`) default to `true` and cover each root's subtree. Enable at least one; `attributeFilter` requires attribute observation. Keep all necessary triggers: for class-dependent visibility, `['class', 'style', 'inert']` covers selector changes and effect restoration. Excluded attributes cannot trigger recovery.

`shouldApply` receives `element`, `root`, `wasApplied`, and `isSatisfied` (`null` for custom effects without `isApplied`). Its `trigger` is `initial`, `mutation` with rule-filtered `mutations`, or `interaction` with `event`. Shadow-root discovery and BFCache resumption use empty mutation arrays. Observing rules also run before activation, closing the gap before MutationObserver delivery; newly matching hidden/invisible elements are blocked even on immediate `.click()`. Restrict the predicate by trigger when needed. With `initial: false`, existing elements wait for an observing or interaction pass.

## Lifetime and failures

- Effects are one-way: leaving a selector or disposing does not undo deletion, styles, inert attributes, or custom changes.
- BFCache suspends observation/interception; restoration resumes prior application history only while the owning installation remains active.
- `dispose()` releases observers, listeners, owned wrappers, bridge, and init registration. WebView closure also cleans up automatically.
- Setup errors reject installation. A later error stops the installation and remains recorded. Call `throwIfFailed()` before work requiring policies; it checks failures already reported to the plugin. Await `dispose()` in `finally`; it also reads the current document's terminal state before bridge removal and throws recorded/cleanup failures. Repeated disposal preserves the outcome.
- For immediate cancellation, use installer `onError` in the plugin realm, e.g. `onError: async () => { await webView.close() }`. Background failures otherwise do not cancel unrelated work. Notification receives the first background error at most once, preserves the recorded failure, and is not awaited by cleanup. Notification failures are logged separately; setup rejection goes directly to the caller.
- Invalid selectors, callback failures, failed state checks, non-converging mutation loops, and missing native inert support are ordinary errors. Background notifications contain stage and available rule index, excluding DOM contents, arguments, and private callback exception text. Installation transport errors propagate unchanged.

Policies cooperate with page code; they are not a security boundary against hostile scripts retaining native methods or replacing interception.

## Verify changes

- `yarn jest src/common/webview --runInBand`: jsdom mutation/lifecycle/error handling and production-style obfuscation.
- `yarn test`: public types and full repository lint/Jest checks.
- `yarn test:playwright src/common/webview`: run `__tests__/dom.playwright.test.ts` using a production-built typed consumer in Chromium/WebKit; layout, inert, pointer/touch hits, focus, Shadow DOM, navigation, and execution.

Browser installation, runner separation, engine selection, and failure traces are described in [browser test setup](../project/testing.md#browser-tests).

Registration removal and persisted BFCache events are modeled in jsdom; real back navigation runs in both browsers. Native mobile WebView compatibility needs separate device verification.
