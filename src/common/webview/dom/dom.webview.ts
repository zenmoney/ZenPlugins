import type { DomApplicationContext, DomPolicyFactory, DomRoot, DomRule, DomObservation } from './types'
import type { DomPageConfig, DomPageFailure, DomPageLifecycle } from './browser'

type PageWindow = Window & { [key: string]: unknown }
interface RuleState {
  readonly rule: DomRule
  readonly selectors: readonly string[]
  readonly observation: MutationObserverInit | false
  started: boolean
}
interface Mark { applied: boolean }
type Trigger =
  | { trigger: 'initial' }
  | { trigger: 'mutation', mutations: readonly MutationRecord[] }
  | { trigger: 'interaction', event: Event }

function lifecycle (key: string): DomPageLifecycle | undefined {
  return (window as unknown as PageWindow)[key] as DomPageLifecycle | undefined
}

export function dispose (config: { key: string }): DomPageFailure | undefined { return lifecycle(config.key)?.dispose() }

export function recordInitialFailure (config: { key: string }): void {
  if (lifecycle(config.key) === undefined) {
    Object.defineProperty(window, config.key, { value: { documentId: 'initial', dispose: () => ({ origin: location.origin, stage: 'install' }) } })
  }
}
export function matchesDocument (config: { key: string, documentId: string }): boolean {
  return lifecycle(config.key)?.documentId === config.documentId
}

function observation (options: false | DomObservation | undefined): MutationObserverInit | false {
  if (options === false) return false
  const value = {
    subtree: true,
    childList: options?.childList ?? true,
    attributes: options?.attributes ?? true,
    characterData: options?.characterData ?? true,
    ...(options?.attributeFilter === undefined ? {} : { attributeFilter: [...options.attributeFilter] })
  }
  if ((!value.childList && !value.attributes && !value.characterData) || (!value.attributes && value.attributeFilter !== undefined)) {
    throw new Error('[webview/dom/install] Invalid observation configuration')
  }
  return value
}

/** Standalone page runtime. Its imports must remain type-only. */
export default function install (config: DomPageConfig, factory: DomPolicyFactory<unknown>): void {
  if (window !== window.top || !config.origins.includes(location.origin) || lifecycle(config.key) !== undefined) return
  if (typeof factory !== 'function') throw new Error('[webview/dom/install] Bundle must export a policy factory')
  const rules = factory(config.arg)
  if (!Array.isArray(rules)) throw new Error('[webview/dom/install] Factory must return rules')
  const states: RuleState[] = rules.map(rule => {
    const selectors = typeof rule.selectors === 'string' ? [rule.selectors] : [...rule.selectors]
    if (selectors.length === 0 || selectors.some(selector => typeof selector !== 'string' || selector.trim() === '')) {
      throw new Error('[webview/dom/install] Missing selector')
    }
    for (const selector of selectors) document.querySelector(selector)
    const policy = rule.policy
    if (typeof policy === 'string') {
      if (!['delete', 'hidden', 'invisible'].includes(policy)) throw new Error('[webview/dom/install] Invalid policy')
      if (policy !== 'delete' && !('inert' in HTMLElement.prototype)) throw new Error('[webview/dom/install] Native inert is required')
    } else if (policy.type === 'custom') {
      if (typeof policy.apply !== 'function' || (policy.isApplied !== undefined && typeof policy.isApplied !== 'function')) throw new Error('[webview/dom/install] Invalid custom policy')
    } else if (policy.type === 'onClick') {
      if (typeof policy.handler !== 'function' || (policy.behavior !== undefined && policy.behavior !== 'replace' && policy.behavior !== 'listen')) throw new Error('[webview/dom/install] Invalid click policy')
    } else throw new Error('[webview/dom/install] Invalid policy')
    const initial = rule.application?.initial ?? 'immediate'
    if (initial !== 'immediate' && initial !== 'domcontentloaded' && initial !== false) throw new Error('[webview/dom/install] Invalid initial configuration')
    return { rule, selectors, observation: observation(rule.application?.observe), started: initial !== 'domcontentloaded' || document.readyState !== 'loading' }
  })
  const marker = Symbol('zenmoneyDomPolicies')
  type MarkedElement = Element & { [marker]?: Map<number, Mark> }
  const blockedRoots = new WeakSet<Element>()
  const observers = new Map<DomRoot, MutationObserver>()
  const rootListeners = new Map<ShadowRoot, () => void>()
  const restorations: Array<() => void> = []
  const documentId = `${Date.now()}_${Math.random().toString(36).slice(2)}`
  let alive = true
  let running = true
  let queued = false
  let reconciling = false
  let pending: MutationRecord[] = []
  let currentRule: number | undefined
  let failedRule: number | undefined
  let pageFailure: DomPageFailure | undefined

  const bridge = async (kind: 'active' | 'failure', stage?: string): Promise<boolean> => {
    const callback = (window as unknown as PageWindow)[config.bridgeName]
    if (typeof callback !== 'function') return false
    return await (callback as (packet: unknown) => Promise<boolean>)({ kind, origin: location.origin, documentId, stage, rule: currentRule ?? failedRule })
  }
  const stop = (): void => {
    running = false
    for (const observer of observers.values()) observer.disconnect()
    observers.clear()
    for (const remove of rootListeners.values()) remove()
    rootListeners.clear()
    pending = []
    queued = false
    for (const restore of restorations.splice(0).reverse()) restore()
  }
  const disposeRuntime = (): DomPageFailure | undefined => {
    alive = false
    stop()
    window.removeEventListener('pagehide', onPageHide)
    window.removeEventListener('pageshow', onPageShow)
    document.removeEventListener('DOMContentLoaded', onReady)
    // Keep a tombstone so stale init scripts cannot reinstall in this document.
    return pageFailure
  }
  const fail = (stage: string): void => {
    if (!alive) return
    pageFailure = { origin: location.origin, stage, rule: currentRule ?? failedRule }
    disposeRuntime()
    void bridge('failure', stage).catch(() => {})
  }
  const getMark = (element: Element, index: number): Mark | undefined => (element as MarkedElement)[marker]?.get(index)
  const mark = (element: Element, index: number): void => {
    const target = element as MarkedElement
    let entries = target[marker]
    if (entries === undefined) {
      entries = new Map()
      Object.defineProperty(target, marker, { value: entries })
    }
    entries.set(index, { applied: true })
  }
  const parent = (node: Node): Node | null => {
    if (node instanceof Element && node.assignedSlot !== null) return node.assignedSlot
    if (node.parentNode !== null) return node.parentNode
    return node instanceof ShadowRoot ? node.host : null
  }
  const blocked = (target: unknown): boolean => {
    let node = target instanceof Node ? target : null
    while (node !== null) {
      if (node instanceof Element && blockedRoots.has(node)) return true
      node = parent(node)
    }
    return false
  }
  const descendants = (element: Element): Element[] => {
    const elements: Element[] = []
    const seen = new Set<Element>()
    const visit = (node: Element): void => {
      if (seen.has(node)) return
      seen.add(node)
      elements.push(node)
      for (const child of Array.from(node.children)) visit(child)
      if (config.includeShadowDom && node.shadowRoot !== null) for (const child of Array.from(node.shadowRoot.children)) visit(child)
      if (node instanceof HTMLSlotElement) for (const child of node.assignedElements({ flatten: true })) visit(child)
    }
    visit(element)
    return elements
  }
  const style = (element: Element): CSSStyleDeclaration | undefined => {
    const value = (element as Element & { style?: CSSStyleDeclaration }).style
    return value instanceof CSSStyleDeclaration ? value : undefined
  }
  const hasStyle = (element: Element, property: string, value: string): boolean => {
    const declaration = style(element)
    return declaration !== undefined && declaration.getPropertyValue(property) === value && declaration.getPropertyPriority(property) === 'important'
  }
  const setStyle = (element: Element, property: string, value: string): void => {
    const declaration = style(element)
    if (declaration === undefined) throw new Error('[webview/dom/apply] Element does not support inline style')
    if (!hasStyle(element, property, value)) declaration.setProperty(property, value, 'important')
  }
  const satisfied = (element: Element, state: RuleState, index: number): boolean | null => {
    const policy = state.rule.policy
    if (policy === 'delete') return element.parentNode === null
    if (policy === 'hidden' || policy === 'invisible') {
      return blockedRoots.has(element) && (policy !== 'hidden' || hasStyle(element, 'display', 'none')) && descendants(element).every(node =>
        (!(node instanceof HTMLElement) || node.hasAttribute('inert')) && (policy !== 'invisible' || hasStyle(node, 'visibility', 'hidden')))
    }
    if (typeof policy === 'string') return false
    if (policy.type === 'onClick') return getMark(element, index)?.applied === true
    if (policy.isApplied === undefined) return null
    const result = policy.isApplied(element)
    if (typeof result !== 'boolean') throw new Error('[webview/dom/apply] State check must return a boolean')
    return result
  }
  const apply = (element: Element, root: DomRoot, index: number, trigger: Trigger): void => {
    currentRule = index
    const state = states[index]
    const wasApplied = getMark(element, index)?.applied === true
    const isSatisfied = satisfied(element, state, index)
    const context: DomApplicationContext = { element, root, wasApplied, isSatisfied, ...trigger }
    const shouldApply = state.rule.application?.shouldApply
    const policy = state.rule.policy
    const needed = shouldApply === undefined
      ? (policy === 'hidden' || policy === 'invisible' ? isSatisfied !== true : !wasApplied)
      : shouldApply(context)
    if (typeof needed !== 'boolean') throw new Error('[webview/dom/apply] shouldApply must return a boolean')
    if (!needed) return
    if (policy === 'delete') element.remove()
    else if (policy === 'hidden' || policy === 'invisible') {
      if (policy === 'hidden') setStyle(element, 'display', 'none')
      blockedRoots.add(element)
      for (const node of descendants(element)) {
        if (node instanceof HTMLElement && !node.hasAttribute('inert')) node.setAttribute('inert', '')
        if (policy === 'invisible') setStyle(node, 'visibility', 'hidden')
      }
      let focused: Element | null = document.activeElement
      while (focused?.shadowRoot?.activeElement != null) focused = focused.shadowRoot.activeElement
      if (blocked(focused) && focused instanceof HTMLElement) focused.blur()
    } else if (typeof policy !== 'string' && policy.type === 'custom') {
      if (policy.apply(element) !== undefined) throw new Error('[webview/dom/apply] Custom apply must be synchronous and return nothing')
      if (policy.isApplied !== undefined && satisfied(element, state, index) !== true) throw new Error('[webview/dom/apply] Custom policy did not satisfy its state check')
    }
    mark(element, index)
  }
  const accepts = (options: MutationObserverInit, record: MutationRecord): boolean => {
    if (record.type === 'childList') return options.childList === true
    if (record.type === 'characterData') return options.characterData === true
    return options.attributes === true && (options.attributeFilter === undefined || (record.attributeName !== null && options.attributeFilter.includes(record.attributeName)))
  }
  const roots = (): DomRoot[] => {
    const found: DomRoot[] = [document]
    if (config.includeShadowDom) {
      for (let index = 0; index < found.length; index++) {
        for (const element of Array.from(found[index].querySelectorAll('*'))) if (element.shadowRoot !== null) found.push(element.shadowRoot)
      }
    }
    return found
  }
  const observe = (root: DomRoot): void => {
    if (observers.has(root) || !states.some(state => state.observation !== false)) return
    const observer = new MutationObserver(records => { pending.push(...records); enqueue() })
    // Observe the union; each rule independently filters records before deciding.
    observer.observe(root, {
      subtree: true,
      childList: states.some(state => state.observation !== false && state.observation.childList),
      attributes: states.some(state => state.observation !== false && state.observation.attributes),
      characterData: states.some(state => state.observation !== false && state.observation.characterData)
    })
    observers.set(root, observer)
  }
  const listen = (root: DomRoot): void => {
    if (!(root instanceof ShadowRoot) || rootListeners.has(root)) return
    const listener = (event: Event): void => {
      // Composed events already pass through window's guard; non-composed events
      // end at their innermost root and need that root's own capture handler.
      if (!event.composedPath().includes(window)) handle(event)
    }
    for (const type of activation) root.addEventListener(type, listener, { capture: true, passive: false })
    rootListeners.set(root, () => { for (const type of activation) root.removeEventListener(type, listener, true) })
  }
  const scan = (trigger: Trigger, indices: readonly number[]): void => {
    if (!running || reconciling) return
    reconciling = true
    try {
      const currentRoots = roots()
      for (const [root, observer] of observers) {
        if (!currentRoots.includes(root)) { observer.disconnect(); observers.delete(root) }
      }
      for (const [root, remove] of rootListeners) {
        if (!currentRoots.includes(root)) { remove(); rootListeners.delete(root) }
      }
      for (const root of currentRoots) { observe(root); listen(root) }
      for (const index of indices) {
        const state = states[index]
        if (!state.started) continue
        const options = state.observation
        const ruleTrigger: Trigger = trigger.trigger === 'mutation' && options !== false
          ? { trigger: 'mutation', mutations: trigger.mutations.filter(record => accepts(options, record)) }
          : trigger
        for (const root of currentRoots) {
          const candidates = new Set<Element>()
          for (const selector of state.selectors) {
            if (state.rule.all === true) for (const element of Array.from(root.querySelectorAll(selector))) candidates.add(element)
            else { const element = root.querySelector(selector); if (element !== null) candidates.add(element) }
          }
          // Maintaining policies remain attached when a framework changes the selector.
          if (state.rule.policy === 'hidden' || state.rule.policy === 'invisible') {
            for (const element of Array.from(root.querySelectorAll('*'))) if (getMark(element, index)?.applied === true) candidates.add(element)
          }
          for (const element of candidates) apply(element, root, index, ruleTrigger)
        }
      }
    } catch (error) {
      failedRule = currentRule
      throw error
    } finally { reconciling = false; currentRule = undefined }
  }
  const flush = (): void => {
    queued = false
    if (!running) return
    try {
      // Drain our own synchronous writes too; never disconnect around callbacks.
      for (let round = 0; ; round++) {
        for (const observer of observers.values()) pending.push(...observer.takeRecords())
        const records = pending.splice(0)
        if (records.length === 0) break
        if (round === 100) throw new Error('[webview/dom/apply] Policies did not converge')
        const indices = states.flatMap((state, index) => {
          const options = state.observation
          return options !== false && records.some(record => accepts(options, record)) ? [index] : []
        })
        scan({ trigger: 'mutation', mutations: records }, indices)
      }
    } catch (_) { fail('mutation') }
  }
  const enqueue = (): void => {
    if (!queued && running) { queued = true; void Promise.resolve().then(flush) }
  }
  const interact = (event: Event): void => {
    scan({ trigger: 'interaction', event }, states.flatMap((state, index) => state.observation === false ? [] : [index]))
  }
  const activation = new Set(['click', 'auxclick', 'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend', 'keydown', 'keyup', 'keypress', 'focus', 'focusin'])
  const cancel = (event: Event): void => { event.preventDefault(); event.stopImmediatePropagation() }
  const handle = (event: Event): void => {
    if (!running) return
    try {
      interact(event)
      const path = event.composedPath()
      if (path.some(blocked) || blocked(event.target)) { cancel(event); return }
      if (event.type !== 'click') return
      for (let index = 0; index < states.length; index++) {
        currentRule = index
        const policy = states[index].rule.policy
        if (typeof policy === 'string' || policy.type !== 'onClick') continue
        const element = path.find(node => node instanceof Element && getMark(node, index)?.applied === true)
        if (!(element instanceof Element)) continue
        if (policy.behavior !== 'listen') cancel(event)
        void Promise.resolve(policy.handler(element, event)).catch(() => { currentRule = index; fail('click') })
        if (policy.behavior !== 'listen') break
      }
    } catch (_) { cancel(event); fail('interaction') } finally { currentRule = undefined }
  }
  const wrap = <Target extends object, Key extends keyof Target>(target: Target, key: Key, replacement: Target[Key]): void => {
    const descriptor = Object.getOwnPropertyDescriptor(target, key)
    if (descriptor === undefined) throw new Error('[webview/dom/install] Missing native method')
    Object.defineProperty(target, key, { ...descriptor, value: replacement })
    restorations.push(() => { if (target[key] === replacement) Object.defineProperty(target, key, descriptor) })
  }
  const start = (): void => {
    running = true
    // A page wrapper may retain a native reference to ours. Retired generations
    // remain passive even if the same BFCache runtime subsequently resumes.
    let installed = true
    restorations.push(() => { installed = false })
    for (const root of roots()) { observe(root); listen(root) }
    for (const type of activation) window.addEventListener(type, handle, { capture: true, passive: false })
    restorations.push(() => { for (const type of activation) window.removeEventListener(type, handle, true) })
    const nativeDispatch = EventTarget.prototype.dispatchEvent
    wrap(EventTarget.prototype, 'dispatchEvent', function (this: EventTarget, event: Event): boolean {
      // Invalid arguments/receivers retain native errors.
      if (!(event instanceof Event) || !(this instanceof Node)) return nativeDispatch.call(this, event)
      if (installed && running && activation.has(event.type)) {
        try { interact(event) } catch (_) { fail('interaction'); return false }
        if (blocked(this)) { if (event.cancelable) event.preventDefault(); return !event.defaultPrevented }
      }
      return nativeDispatch.call(this, event)
    })
    const nativeClick = HTMLElement.prototype.click
    wrap(HTMLElement.prototype, 'click', function (this: HTMLElement): void {
      if (this instanceof HTMLElement && installed && running) {
        try { interact(new Event('click')) } catch (_) { fail('interaction'); return }
        if (blocked(this)) return
      }
      nativeClick.call(this)
    })
    const nativeFocus = HTMLElement.prototype.focus
    wrap(HTMLElement.prototype, 'focus', function (this: HTMLElement, options?: FocusOptions): void {
      if (this instanceof HTMLElement && installed && running) {
        try { interact(new Event('focus')) } catch (_) { fail('interaction'); return }
        if (blocked(this)) return
      }
      nativeFocus.call(this, options)
    })
    if (config.includeShadowDom) {
      const nativeAttach = Element.prototype.attachShadow
      wrap(Element.prototype, 'attachShadow', function (this: Element, options: ShadowRootInit): ShadowRoot {
        const root = nativeAttach.call(this, options)
        if (options.mode === 'open' && installed && running) {
          observe(root)
          listen(root)
          // attachShadow itself is not a DOM mutation.
          try { scan({ trigger: 'mutation', mutations: [] }, states.flatMap((state, index) => state.observation === false ? [] : [index])) } catch (_) { fail('shadow') }
        }
        return root
      })
    }
  }
  const onReady = (): void => {
    if (!running) return
    const indices = states.flatMap((state, index) => !state.started ? [index] : [])
    for (const index of indices) states[index].started = true
    try { scan({ trigger: 'initial' }, indices) } catch (_) { fail('initial') }
  }
  const onPageHide = (): void => { stop() }
  const onPageShow = (event: PageTransitionEvent): void => {
    if (!event.persisted || !alive) return
    void bridge('active').then(active => {
      if (!active || !alive) { disposeRuntime(); return }
      try {
        start()
        if (document.readyState !== 'loading') onReady()
        scan({ trigger: 'mutation', mutations: [] }, states.flatMap((state, index) => state.observation === false ? [] : [index]))
      } catch (_) { fail('resume') }
    }).catch(() => { disposeRuntime() })
  }
  Object.defineProperty(window, config.key, { value: { documentId, dispose: disposeRuntime } })
  window.addEventListener('pagehide', onPageHide)
  window.addEventListener('pageshow', onPageShow)
  document.addEventListener('DOMContentLoaded', onReady)
  try {
    start()
    scan({ trigger: 'initial' }, states.flatMap((state, index) => state.rule.application?.initial === false ? [] : [index]))
  } catch (error) {
    pageFailure = { origin: location.origin, stage: 'initial', rule: failedRule }
    disposeRuntime()
    throw error
  }
}
