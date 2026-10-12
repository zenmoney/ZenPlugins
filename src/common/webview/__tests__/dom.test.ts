import { JSDOM } from 'jsdom'
import { runInContext } from 'vm'
import { transformSync, build } from 'esbuild'
import { resolve } from 'path'
import { buildProductionScript } from '../../../../scripts/__tests__/helpers/webpack'
import type { Disposable, WebViewInstance } from '../../webView'
import { createDomPolicyScript, installDomPolicies } from '../dom'
import type { DomPolicyController, DomPolicyFactory, DomPolicyErrorHandler } from '../dom'
import { geoPermission, installPermissions } from '../permissions'

const ORIGIN = 'https://example.test'
function source (body: string): string {
  return transformSync(`export default () => (${body})`, { format: 'iife', globalName: 'WebViewScript', target: 'es2020' }).code
}

class View {
  readonly webView = this as unknown as WebViewInstance
  readonly scripts = new Set<{ script: Function, arg: unknown }>()
  readonly bridges = new Map<string, (...args: unknown[]) => unknown>()
  readonly listeners = new Set<() => void>()
  readonly pages: JSDOM[] = []
  page!: JSDOM
  closed = false
  transportError: Error | undefined

  constructor (html = '<button class="target">Click</button>') { this.newPage(html) }
  newPage (html: string, origin = ORIGIN, inert = true): void {
    this.page = new JSDOM(html, { url: `${origin}/login`, runScripts: 'outside-only' })
    this.pages.push(this.page)
    // jsdom has no inert implementation. Only browser tests establish native semantics.
    if (inert) Object.defineProperty(this.page.window.HTMLElement.prototype, 'inert', { configurable: true, get () { return this.hasAttribute('inert') } })
    for (const [name, callback] of this.bridges) Object.defineProperty(this.page.window, name, { value: callback, configurable: true })
  }

  run<T = unknown> (code: string): T { return runInContext(code, this.page.getInternalVMContext()) as T }
  execute (script: Function, arg: unknown): unknown {
    Object.defineProperty(this.page.window, '__arg', { value: arg, configurable: true })
    return this.run(`(${script.toString()})(__arg)`)
  }

  async navigate (html: string, origin = ORIGIN): Promise<void> {
    this.run("window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))")
    this.newPage(html, origin)
    for (const entry of this.scripts) this.execute(entry.script, entry.arg)
    await settle()
  }

  async url (): Promise<string> { return this.page.window.location.href }
  async isClosed (): Promise<boolean> { return this.closed }
  async close (): Promise<void> {
    this.closed = true
    for (const listener of this.listeners) listener()
    await settle()
  }

  on (_event: string, listener: () => void): this { this.listeners.add(listener); return this }
  off (_event: string, listener: () => void): this { this.listeners.delete(listener); return this }
  async exposeFunction (name: string, callback: (...args: unknown[]) => unknown): Promise<Disposable> {
    this.bridges.set(name, callback)
    Object.defineProperty(this.page.window, name, { value: callback, configurable: true })
    return { dispose: async () => { this.bridges.delete(name); for (const page of this.pages) Reflect.deleteProperty(page.window, name) } }
  }

  async addInitScript (script: Function, arg: unknown): Promise<Disposable> {
    const entry = { script, arg }; this.scripts.add(entry)
    return { dispose: async () => { this.scripts.delete(entry) } }
  }

  async evaluate (script: Function, arg: unknown): Promise<unknown> {
    if (this.transportError !== undefined) throw this.transportError
    return this.execute(script, arg)
  }
}

async function settle (): Promise<void> { for (let index = 0; index < 40; index++) await Promise.resolve() }

// [model] The public contract supplies these generic DOM/lifecycle invariants.
describe('[model] DOM policies', () => {
  let view: View
  let controllers: Disposable[]
  beforeEach(() => { view = new View(); controllers = [] })
  afterEach(async () => {
    view.transportError = undefined
    for (const controller of controllers) await controller.dispose()
    for (const page of view.pages) page.window.close()
  })
  async function install (rules: string, onError?: DomPolicyErrorHandler): Promise<DomPolicyController> {
    const controller = await installDomPolicies(view.webView, { origins: [ORIGIN], script: createDomPolicyScript<DomPolicyFactory>(source(rules)), onError })
    controllers.push(controller)
    await settle()
    return controller
  }

  it('deduplicates selectors, preserves same-node marks, and applies to clones and SPA replacements', async () => {
    await install('[{ selectors: [\'.target\', \'button\'], all: true, policy: { type: \'custom\', apply: element => { element.dataset.count = String(Number(element.dataset.count || 0) + 1) } } }]')
    view.run('const target = document.querySelector(\'button\'); target.remove(); document.body.append(target); document.body.append(target.cloneNode(true)); document.body.insertAdjacentHTML(\'beforeend\', \'<button class="target"></button>\')')
    await settle()
    expect(view.run("Array.from(document.querySelectorAll('button'), element => element.dataset.count)")).toEqual(['1', '2', '1'])
    expect(view.run("Object.getOwnPropertySymbols(document.querySelector('button')).filter(key => String(key).includes('zenmoneyDom')).every(key => !Object.getOwnPropertyDescriptor(document.querySelector('button'), key).enumerable)")).toBe(true)
  })

  it('uses the first match per selector and per root unless all is true', async () => {
    view.run('document.body.innerHTML = \'<i class="one"></i><i class="one"></i><i class="two"></i><div></div>\'; const root = document.querySelector(\'div\').attachShadow({ mode: \'open\' }); root.innerHTML = \'<i class="one"></i><i class="one"></i>\'')
    await install('[{ selectors: [\'.one\', \'.two\'], policy: { type: \'custom\', apply: element => { element.setAttribute(\'applied\', \'\') } } }]')
    expect(view.run("document.querySelectorAll('[applied]').length")).toBe(2)
    expect(view.run("document.querySelector('div').shadowRoot.querySelectorAll('[applied]').length")).toBe(1)
  })

  it('allows document-only search and skips closed roots and iframe documents', async () => {
    view.run(`document.body.innerHTML = '<button class="target"></button><div></div><iframe></iframe>';
      document.querySelector('div').attachShadow({ mode: 'open' }).innerHTML = '<button class="target"></button>';
      document.querySelector('iframe').contentDocument.body.innerHTML = '<button class="target"></button>'`)
    const controller = await installDomPolicies(view.webView, { origins: [ORIGIN], script: createDomPolicyScript<DomPolicyFactory>(source('[{ selectors: \'.target\', all: true, policy: \'delete\' }]')), includeShadowDom: false })
    controllers.push(controller)
    expect(view.run("document.querySelector('button')")).toBeNull()
    expect(view.run("document.querySelector('div').shadowRoot.querySelector('button') !== null")).toBe(true)
    expect(view.run("document.querySelector('iframe').contentDocument.querySelector('button') !== null")).toBe(true)
  })

  it('maintains hidden across real React updates and replacement nodes', async () => {
    const react = await build({
      stdin: {
        contents: `import React from 'react'; import ReactDOM from 'react-dom';
        window.renderModel = (tag, display) => ReactDOM.render(React.createElement(tag, { className: 'target', style: { display } }, 'React node'), document.querySelector('#app'));`,
        resolveDir: process.cwd()
      },
      bundle: true,
      write: false,
      platform: 'browser',
      format: 'iife',
      define: { 'process.env.NODE_ENV': '"production"' }
    })
    view.run('document.body.innerHTML = \'<main id="app"></main>\'')
    view.run(react.outputFiles[0].text)
    view.run("renderModel('button', 'block')")
    await install('[{ selectors: \'.target\', policy: \'hidden\' }]')
    view.run("renderModel('button', 'inline-block')")
    await settle()
    expect(view.run("document.querySelector('.target').style.display")).toBe('none')
    view.run("renderModel('div', 'inline')")
    await settle()
    expect(view.run("document.querySelector('.target').style.display")).toBe('none')
    expect(view.run("document.querySelector('.target').hasAttribute('inert')")).toBe(true)
  })

  it('restores maintaining effects after selector changes and preserves form values', async () => {
    view.run('document.body.innerHTML = \'<form><div class="target" style="display:contents"><input name="value" value="saved"><button>Go</button></div></form>\'')
    await install('[{ selectors: \'.target\', policy: \'hidden\' }]')
    view.run('const target = document.querySelector(\'.target\'); target.className = \'\'; target.style.display = \'contents\'; target.removeAttribute(\'inert\'); target.querySelector(\'input\').removeAttribute(\'inert\')')
    await settle()
    expect(view.run("document.querySelector('div').style.cssText")).toContain('display: none !important')
    expect(view.run("Array.from(new FormData(document.querySelector('form')).entries())")).toEqual([['value', 'saved']])
    expect(view.run("document.querySelector('input').disabled")).toBe(false)
    expect(view.run("document.querySelector('input').hasAttribute('inert')")).toBe(true)
  })

  it('maintains invisible through new descendants, slots, and late open shadow roots', async () => {
    view.run('document.body.innerHTML = \'<div class="target"><span style="visibility:visible">Text</span><section></section></div>\'')
    await install('[{ selectors: \'.target\', policy: \'invisible\' }]')
    view.run('const root = document.querySelector(\'section\').attachShadow({ mode: \'open\' }); root.innerHTML = \'<slot></slot><b style="visibility:visible">Shadow</b>\'; document.querySelector(\'section\').innerHTML = \'<button style="visibility:visible">Slotted</button>\'; document.querySelector(\'span\').style.visibility = \'visible\'')
    await settle()
    expect(view.run("Array.from(document.querySelectorAll('.target, .target *'), element => element.style.getPropertyValue('visibility'))")).toEqual(['hidden', 'hidden', 'hidden', 'hidden'])
    expect(view.run("document.querySelector('section').shadowRoot.querySelector('b').style.cssText")).toContain('visibility: hidden !important')
  })

  it('allows independent initial, observation, and reapplication decisions', async () => {
    await install(`[
      { selectors: '.target', policy: { type: 'custom', apply: el => { el.setAttribute('initial', '') } }, application: { initial: false, observe: { childList: false, characterData: false, attributeFilter: ['data-run'] } } },
      { selectors: '.target', policy: { type: 'custom', apply: el => { el.setAttribute('once', '') } }, application: { observe: false } },
      { selectors: '.target', policy: { type: 'custom', apply: el => { el.setAttribute('verified', '') }, isApplied: el => el.hasAttribute('verified') }, application: { shouldApply: context => !context.wasApplied || context.isSatisfied === false } }
    ]`)
    expect(view.run("document.querySelector('button').hasAttribute('initial')")).toBe(false)
    view.run("document.querySelector('button').setAttribute('data-other', '')")
    await settle()
    expect(view.run("document.querySelector('button').hasAttribute('initial')")).toBe(false)
    view.run("document.querySelector('button').setAttribute('data-run', ''); document.querySelector('button').removeAttribute('verified'); document.body.insertAdjacentHTML('beforeend', '<button class=target></button>')")
    await settle()
    expect(view.run("document.querySelector('button').hasAttribute('initial')")).toBe(true)
    expect(view.run("document.querySelector('button').hasAttribute('verified')")).toBe(true)
    expect(view.run("document.querySelectorAll('[once]').length")).toBe(1)
  })

  it('passes only each rule\'s observed records to its decision callback', async () => {
    view.run('window.observed = []')
    await install(`[{ selectors: '.target', policy: { type: 'custom', apply: () => {} }, application: {
      observe: { childList: false, characterData: false, attributeFilter: ['data-run'] },
      shouldApply: context => { if (context.trigger === 'mutation') observed.push(...context.mutations.map(record => record.attributeName)); return !context.wasApplied }
    } }]`)
    view.run('document.querySelector(\'button\').setAttribute(\'data-other\', \'\'); document.querySelector(\'button\').setAttribute(\'data-run\', \'\')')
    await settle()
    expect(view.run('observed')).toEqual(['data-run'])
  })

  it('defers custom application until an element becomes ready and applies once', async () => {
    await install(`[{ selectors: '.target', all: true, policy: {
      type: 'custom', apply: element => { element.setAttribute('data-count', String(Number(element.getAttribute('data-count') || 0) + 1)) }
    }, application: {
      observe: { childList: true, attributes: true, characterData: false, attributeFilter: ['data-ready'] },
      shouldApply: context => !context.wasApplied && context.element.getAttribute('data-ready') === 'true'
    } }]`)
    expect(view.run("document.querySelector('button').getAttribute('data-count')")).toBeNull()
    view.run("document.querySelector('button').setAttribute('data-ready', 'true'); document.body.insertAdjacentHTML('beforeend', '<button class=target data-ready=true></button>')")
    await settle()
    view.run("document.querySelector('button').setAttribute('data-ready', 'false')")
    await settle()
    view.run("document.querySelector('button').setAttribute('data-ready', 'true')")
    await settle()
    expect(view.run("Array.from(document.querySelectorAll('button'), element => element.getAttribute('data-count'))")).toEqual(['1', '1'])
  })

  it('waits for DOMContentLoaded without applying early through mutations or interaction', async () => {
    view.run("Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true })")
    await install('[{ selectors: \'.target\', policy: \'delete\', application: { initial: \'domcontentloaded\' } }]')
    expect(view.run("document.querySelector('button') !== null")).toBe(true)
    view.run("document.querySelector('button').click(); document.dispatchEvent(new Event('DOMContentLoaded'))")
    expect(view.run("document.querySelector('button')")).toBeNull()
  })

  it('runs nearest click policies in rule order, replaces or listens, and supports repeated Event objects', async () => {
    view.run('document.body.innerHTML = \'<div class="target"><button class="target">Go</button></div>\'; window.calls = []; document.addEventListener(\'click\', () => calls.push(\'page\'))')
    await install(`[
      { selectors: '.target', all: true, policy: { type: 'onClick', behavior: 'listen', handler: (el, event) => calls.push(el.tagName + ':listen:' + event.type) } },
      { selectors: '.target', all: true, policy: { type: 'onClick', handler: el => calls.push(el.tagName + ':replace') } }
    ]`)
    view.run("const event = new Event('click', { bubbles: true }); document.querySelector('button').dispatchEvent(event); document.querySelector('button').dispatchEvent(event)")
    expect(view.run('calls')).toEqual(['BUTTON:listen:click', 'BUTTON:replace', 'BUTTON:listen:click', 'BUTTON:replace'])
  })

  it('blocks activation before observers run, including non-cancelable events and detached nodes', async () => {
    view.run("window.calls = []; document.querySelector('button').addEventListener('click', () => calls.push('page'))")
    await install('[{ selectors: \'.target\', policy: \'invisible\' }, { selectors: \'.target\', policy: { type: \'onClick\', handler: () => calls.push(\'policy\') } }]')
    view.run('const target = document.querySelector(\'button\'); target.click(); target.dispatchEvent(new Event(\'click\')); target.focus(); target.remove(); target.dispatchEvent(new Event(\'click\')); document.body.insertAdjacentHTML(\'beforeend\', \'<button class="target" onclick="calls.push(1)"></button>\'); document.querySelector(\'button\').click()')
    expect(view.run('calls')).toEqual([])
    expect(view.run('document.activeElement.tagName')).toBe('BODY')
  })

  it('handles non-composed Shadow DOM clicks once and honors the search boundary', async () => {
    view.run(`document.body.innerHTML = '<div id="open"></div><div id="closed"></div>'; window.calls = [];
      document.querySelector('#open').attachShadow({ mode: 'open' }).innerHTML = '<button class="target"></button>';
      window.closedRoot = document.querySelector('#closed').attachShadow({ mode: 'closed' }); closedRoot.innerHTML = '<button class="target"></button>'`)
    await install('[{ selectors: \'.target\', policy: { type: \'onClick\', handler: () => calls.push(\'policy\') } }]')
    view.run('const button = document.querySelector(\'#open\').shadowRoot.querySelector(\'button\'); button.dispatchEvent(new Event(\'click\')); button.click(); closedRoot.querySelector(\'button\').click()')
    expect(view.run('calls')).toEqual(['policy', 'policy'])
  })

  it('preserves navigation installation and keeps disposed BFCache pages inactive', async () => {
    const controller = await install('[{ selectors: \'.target\', policy: \'delete\' }]')
    const old = view.page
    await view.navigate('<button class="target"></button>')
    expect(view.run("document.querySelector('button')")).toBeNull()
    await controller.dispose()
    view.page = old
    view.run("document.body.innerHTML = '<button class=target></button>'; window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))")
    await settle()
    expect(view.run("document.querySelector('button') !== null")).toBe(true)
    expect(view.scripts.size).toBe(0)
    expect(view.bridges.size).toBe(0)
  })

  it('resumes active BFCache pages without repeating one-time callbacks', async () => {
    await install('[{ selectors: \'.target\', all: true, policy: { type: \'custom\', apply: el => { el.setAttribute(\'count\', String(Number(el.getAttribute(\'count\')) + 1)) } } }]')
    view.run("window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })); window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))")
    await settle()
    expect(view.run("document.querySelector('button').getAttribute('count')")).toBe('1')
    view.run("document.body.insertAdjacentHTML('beforeend', '<button class=target></button>')")
    await settle()
    expect(view.run("Array.from(document.querySelectorAll('[count]'), element => element.getAttribute('count'))")).toEqual(['1', '1'])
  })

  it('leaves DOM effects but releases owned wrappers, observation, and click listeners on disposal', async () => {
    view.run('window.nativeClick = HTMLElement.prototype.click; window.nativeAttach = Element.prototype.attachShadow')
    const controller = await install('[{ selectors: \'.target\', policy: \'hidden\' }]')
    await controller.dispose()
    view.run("document.querySelector('button').style.display = 'block'; document.body.insertAdjacentHTML('beforeend', '<button class=target></button>')")
    await settle()
    expect(view.run('HTMLElement.prototype.click === nativeClick && Element.prototype.attachShadow === nativeAttach')).toBe(true)
    expect(view.run("document.querySelector('button').hasAttribute('inert')")).toBe(true)
    expect(view.run("document.querySelector('button').style.display")).toBe('block')
    expect(view.run("document.querySelectorAll('[inert]').length")).toBe(1)
  })

  it('permits absent matches and rejects invalid selectors, checks, async custom callbacks, and missing inert', async () => {
    await (await install('[{ selectors: \'.absent\', policy: \'delete\' }]')).dispose()
    await expect(install('[{ selectors: \'[\', policy: \'delete\' }]')).rejects.toThrow()
    await expect(install('[{ selectors: \'.target\', policy: { type: \'custom\', apply: () => {}, isApplied: () => false } }]')).rejects.toThrow('state check')
    await expect(install('[{ selectors: \'.target\', policy: { type: \'custom\', apply: async () => {} } }]')).rejects.toThrow('synchronous')
    view.newPage('<button class=target></button>', ORIGIN, false)
    await expect(install('[{ selectors: \'.target\', policy: \'hidden\' }]')).rejects.toThrow('Native inert')
    expect(view.bridges.size).toBe(0)
    expect(view.scripts.size).toBe(0)
  })

  it('reports asynchronous callback and non-converging mutation failures through the controller', async () => {
    const diagnostic = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const controller = await install('[{ selectors: \'.target\', policy: { type: \'onClick\', handler: async () => { throw new Error(\'private page data\') } } }]')
      view.run("document.querySelector('button').click()")
      await settle()
      expect(() => controller.throwIfFailed()).toThrow('[webview/dom/apply]')
      await expect(controller.dispose()).rejects.toThrow('[webview/dom/apply]')
      controllers = controllers.filter(item => item !== controller)
      expect(JSON.stringify(diagnostic.mock.calls)).not.toContain('private page data')
      const looping = await install('[{ selectors: \'.target\', policy: { type: \'custom\', apply: el => { el.setAttribute(\'loop\', \'\') } }, application: { initial: false, shouldApply: () => true } }]')
      view.run("document.querySelector('button').setAttribute('start', '')")
      await settle()
      expect(() => looping.throwIfFailed()).toThrow('[webview/dom/apply]')
      await expect(looping.dispose()).rejects.toThrow('[webview/dom/apply]')
      controllers = controllers.filter(item => item !== looping)
    } finally { diagnostic.mockRestore() }
  })

  it('notifies once, permits closing the WebView, and retains the same error after automatic cleanup', async () => {
    const diagnostic = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const errors: Error[] = []
      const controller = await install(`[{ selectors: '.target', policy: {
        type: 'onClick', handler: async () => { throw new Error('private callback error') }
      } }]`, async error => { errors.push(error); await view.close() })
      expect(() => controller.throwIfFailed()).not.toThrow()
      view.run("document.querySelector('button').click()")
      await settle()
      expect(errors).toHaveLength(1)
      expect(errors[0]).toBeInstanceOf(Error)
      expect(view.closed).toBe(true)
      expect(view.bridges.size).toBe(0)
      expect(view.scripts.size).toBe(0)
      expect(view.listeners.size).toBe(0)
      expect(() => controller.throwIfFailed()).toThrow(errors[0])
      await expect(controller.dispose()).rejects.toBe(errors[0])
      await expect(controller.dispose()).rejects.toBe(errors[0])
      expect(errors).toHaveLength(1)
      controllers = controllers.filter(item => item !== controller)
    } finally { diagnostic.mockRestore() }
  })

  it('preserves the policy error when an asynchronous notification rejects', async () => {
    const diagnostic = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const notify = jest.fn(async (_error: Error) => { throw new Error('private notification error') })
      const controller = await install(`[{ selectors: '.target', policy: {
        type: 'onClick', handler: async () => { throw new Error('private callback error') }
      } }]`, notify)
      view.run("document.querySelector('button').click()")
      await settle()
      expect(notify).toHaveBeenCalledTimes(1)
      const error = notify.mock.calls[0][0]
      await expect(controller.dispose()).rejects.toBe(error)
      expect(diagnostic).toHaveBeenCalledWith('[webview/dom/error] Error notification failed')
      expect(JSON.stringify(diagnostic.mock.calls)).not.toContain('private notification error')
      expect(JSON.stringify(diagnostic.mock.calls)).not.toContain('private callback error')
      controllers = controllers.filter(item => item !== controller)
    } finally { diagnostic.mockRestore() }
  })

  it('reads a pending page failure during disposal without requiring a notification or checkpoint', async () => {
    const diagnostic = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const controller = await install(`[{ selectors: '.target', policy: {
        type: 'onClick', handler: async () => { throw new Error('private callback error') }
      } }]`)
      // Model a bridge notification that is queued until after the owner's scope ends.
      view.run(`const bridgeName = Object.getOwnPropertyNames(window).find(name => name.startsWith('__zenmoneyDom_') && name.endsWith('_bridge'));
        Object.defineProperty(window, bridgeName, { configurable: true, value: () => new Promise(() => {}) });
        document.querySelector('button').click()`)
      await settle()
      expect(() => controller.throwIfFailed()).not.toThrow()
      const scope = async (): Promise<string> => {
        try { return 'completed' } finally { await controller.dispose() }
      }
      await expect(scope()).rejects.toThrow('[webview/dom/apply]')
      expect(() => controller.throwIfFailed()).toThrow('[webview/dom/apply]')
      expect(view.bridges.size).toBe(0)
      expect(view.scripts.size).toBe(0)
      controllers = controllers.filter(item => item !== controller)
    } finally { diagnostic.mockRestore() }
  })

  it('preserves transport errors and cleans up partial installation', async () => {
    const error = new Error('[webview/dom/transport] Evaluation failed')
    view.transportError = error
    await expect(install('[]')).rejects.toBe(error)
    expect(view.bridges.size).toBe(0)
    expect(view.scripts.size).toBe(0)
    expect(view.listeners.size).toBe(0)
  })

  it('reports next-document initialization failures and cleans up on close', async () => {
    const diagnostic = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const controller = await install('[{ selectors: \'.target\', policy: { type: \'custom\', apply: element => { if (element.hasAttribute(\'bad\')) throw new Error(\'page failure\') } } }]')
      await expect(view.navigate('<button class="target" bad></button>')).rejects.toThrow('page failure')
      await settle()
      expect(() => controller.throwIfFailed()).toThrow(Error)
      await expect(controller.dispose()).rejects.toBeInstanceOf(Error)
      controllers = controllers.filter(item => item !== controller)
      expect(view.scripts.size).toBe(0)
      const next = await install('[]')
      await expect(install('[]')).rejects.toThrow('already installed')
      view.closed = true
      for (const listener of view.listeners) listener()
      await next.dispose()
      expect(view.bridges.size).toBe(0)
      expect(view.scripts.size).toBe(0)
      expect(view.listeners.size).toBe(0)
    } finally { diagnostic.mockRestore() }
  })

  it('does not execute factory module code on excluded origins', async () => {
    view.newPage('<button class=target></button>', 'https://excluded.test')
    await install('[{ selectors: \'.target\', policy: \'delete\' }]')
    expect(view.run("document.querySelector('button') !== null")).toBe(true)
    await view.navigate('<button class=target></button>')
    expect(view.run("document.querySelector('button')")).toBeNull()
  })

  it('executes standalone page callbacks through the production Webpack pipeline alongside permissions', async () => {
    const code = await buildProductionScript(resolve(__dirname, '../dom/index.ts'))
    const module = { exports: {} }
    // eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval
    new Function('module', 'exports', code)(module, module.exports)
    const api = module.exports as { createDomPolicyScript: typeof createDomPolicyScript, installDomPolicies: typeof installDomPolicies }
    const permissions = await installPermissions(view.webView, { origins: [ORIGIN], permissions: { geolocation: 'granted' }, mode: 'force', adapters: [geoPermission({ getPosition: () => ({ latitude: 1, longitude: 2, accuracy: 3 }) })] })
    controllers.push(permissions)
    const controller = await api.installDomPolicies(view.webView, { origins: [ORIGIN], script: api.createDomPolicyScript<DomPolicyFactory>(source('[{ selectors: \'.target\', policy: { type: \'custom\', apply: el => { el.setAttribute(\'production\', \'\') } } }]')) })
    controllers.push(controller)
    expect(view.run("document.querySelector('button').hasAttribute('production')")).toBe(true)
  })
})
