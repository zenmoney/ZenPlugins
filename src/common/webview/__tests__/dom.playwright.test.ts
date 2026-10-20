import { createServer } from 'http'
import { resolve as resolvePath } from 'path'
import { buildProductionScript } from '../../../../scripts/__tests__/helpers/webpack'
import { expect, test } from 'playwright/test'
import type { Page } from 'playwright'
import type { Disposable, WebViewInstance } from '../../webView'
import type { DomPolicyController, DomPolicyErrorHandler } from '../dom'

interface Consumer {
  install: (view: WebViewInstance, origins: readonly string[], onError?: DomPolicyErrorHandler) => Promise<DomPolicyController>
  permissions: (view: WebViewInstance, origins: string[]) => Promise<void>
}

class View {
  readonly webView = this as unknown as WebViewInstance
  readonly listeners = new Set<() => void>()
  constructor (readonly page: Page) { page.on('close', () => { for (const listener of this.listeners) listener() }) }
  on (_event: string, listener: () => void): this { this.listeners.add(listener); return this }
  off (_event: string, listener: () => void): this { this.listeners.delete(listener); return this }
  async url (): Promise<string> { return this.page.url() }
  async isClosed (): Promise<boolean> { return this.page.isClosed() }
  async evaluate (fn: (arg: unknown) => unknown, arg: unknown): Promise<unknown> {
    return await this.page.evaluate(({ source, arg }) => {
      // Execute in the actual page realm, matching WebView's serialization boundary.
      // eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval
      return new Function('arg', `return (${source})(arg)`)(arg) as unknown
    }, { source: fn.toString(), arg })
  }

  async exposeFunction (name: string, callback: (...args: unknown[]) => unknown): Promise<Disposable> {
    await this.page.exposeFunction(name, callback)
    // Playwright bindings/registrations live for the context, which each scenario closes.
    return { dispose: async () => {} }
  }

  async addInitScript (fn: (arg: unknown) => unknown, arg: unknown): Promise<Disposable> {
    await this.page.addInitScript(({ source, arg }) => {
      // eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval
      new Function('arg', `return (${source})(arg)`)(arg)
    }, { source: fn.toString(), arg })
    return { dispose: async () => {} }
  }
}

const html = `<!doctype html><html><body style="margin:0">
<style>button { width:120px; height:50px } .overlay { position:absolute;left:20px;top:20px;width:120px;height:50px } .visible { visibility:visible!important }</style>
<button id="under" class="overlay">Under</button>
<div id="overlay" class="overlay invisible"><button class="visible replace">Overlay</button></div>
<div class="invisible" id="geometry" style="width:90px;height:40px;margin-top:90px"><span class="visible">Text</span></div>
<form><div class="hidden" style="display:contents"><input name="preserved" value="saved"><button id="blocked">Blocked</button></div></form>
<input id="tab" class="listen" value="Tab"><button id="replace" class="replace"><span>Replace</span></button>
<div class="deleted">Delete</div><div class="custom">Custom</div><div class="verified">Verified</div>
<div id="host" class="invisible"><button slot="action" id="slotted" class="visible">Slotted</button></div>
<script>
window.calls = [];
document.addEventListener('click', event => calls.push(event.target.id || event.target.tagName));
const root = document.querySelector('#host').attachShadow({ mode:'open' });
root.innerHTML = '<slot name="action"></slot><button id="shadow" style="visibility:visible!important">Shadow</button>';
</script></body></html>`

// [model] Real browser engines exercise DOM/layout and lifecycle invariants on synthetic HTML.
test.describe('[model] WebView DOM policies in real browsers', () => {
  let api: Consumer
  let origin: string
  const server = createServer((_request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(html) })

  test.beforeAll(async () => {
    const code = await buildProductionScript(resolvePath(__dirname, '../__fixtures__/dom-consumer.ts'))
    const module = { exports: {} }
    // Execute the production bundle just as the other WebView suites do.
    // eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval
    new Function('module', 'exports', code)(module, module.exports)
    api = module.exports as Consumer
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', () => { server.off('error', reject); resolve() })
    })
    const address = server.address()
    if (address === null || typeof address === 'string') throw new Error('[webview/dom/test] Missing server address')
    origin = `http://127.0.0.1:${address.port}`
  })

  test.afterAll(async () => {
    if (server.listening) await new Promise<void>((resolve, reject) => server.close(error => error === undefined ? resolve() : reject(error)))
  })

  let view: View
  let controller: DomPolicyController | undefined
  let errors: Error[]

  test.beforeEach(async ({ page }) => {
    errors = []
    page.on('pageerror', error => errors.push(error))
    view = new View(page)
    await page.goto(`${origin}/one`)
    // Exercise installation into the current document and the next document's init script.
    controller = await api.install(view.webView, [origin])
    await api.permissions(view.webView, [origin])
    await page.goto(`${origin}/two`)
    await page.waitForFunction(() => document.querySelector('#overlay')?.hasAttribute('inert'))
  })

  test.afterEach(async () => {
    try {
      await controller?.dispose()
      expect(errors).toEqual([])
    } finally {
      controller = undefined
    }
  })

  test('preserves invisible geometry and form values while removing hidden and deleted layout', async ({ page }) => {
    expect(await page.locator('.deleted').count()).toBe(0)
    expect(await page.locator('#geometry').evaluate(element => {
      const rect = element.getBoundingClientRect(); return [rect.width, rect.height]
    })).toEqual([90, 40])
    expect(await page.locator('form .hidden').evaluate(element => element.getBoundingClientRect().height)).toBe(0)
    expect(await page.locator('#overlay .visible').evaluate(element => getComputedStyle(element).visibility)).toBe('hidden')
    expect(await page.evaluate(() => Array.from(new FormData(document.querySelector('form') as HTMLFormElement).entries()))).toEqual([['preserved', 'saved']])
  })

  test('passes pointer and touch hits through invisible elements and blocks focus and activation', async ({ page }) => {
    await page.mouse.click(50, 40)
    await page.touchscreen.tap(50, 40)
    expect(await page.evaluate(() => Reflect.get(window, 'calls'))).toEqual(['under', 'under'])
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('tab')
    await page.evaluate(() => {
      const host = document.querySelector('#host') as HTMLElement
      const targets = [document.querySelector('#blocked'), document.querySelector('#slotted'), host.shadowRoot?.querySelector('#shadow'), document.querySelector('#overlay button')]
      for (const target of targets) {
        if (target instanceof HTMLElement) {
          target.click()
          target.focus()
          target.dispatchEvent(new Event('click', { bubbles: true, composed: true }))
          target.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: false }))
        }
      }
    })
    expect(await page.evaluate(() => Reflect.get(window, 'calls'))).toEqual(['under', 'under'])
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('tab')
    expect(await page.locator('#slotted').evaluate(element => getComputedStyle(element).visibility)).toBe('hidden')
    expect(await page.locator('#host').evaluate(element => getComputedStyle(element.shadowRoot?.querySelector('#shadow') as Element).visibility)).toBe('hidden')
  })

  test('replaces or listens to clicks according to the policy', async ({ page }) => {
    await page.locator('#replace span').click()
    expect(await page.locator('#replace').getAttribute('policy-click')).toBe('click')
    expect(await page.evaluate(() => Reflect.get(window, 'calls'))).toEqual([])
    await page.locator('#tab').click()
    expect(await page.locator('#tab').getAttribute('policy-click')).toBe('listen')
    expect(await page.evaluate(() => Reflect.get(window, 'calls'))).toEqual(['tab'])
  })

  test('restores effects and applies policies to new elements after SPA updates', async ({ page }) => {
    await page.evaluate(() => {
      const element = document.querySelector('#geometry') as HTMLElement
      element.className = ''; element.style.visibility = 'visible'; element.removeAttribute('inert')
      element.insertAdjacentHTML('beforeend', '<button style="visibility:visible">New</button>')
      document.querySelector('.verified')?.removeAttribute('applied')
      document.body.insertAdjacentHTML('beforeend', '<div class="custom" id="spa"></div><div class="deleted"></div>')
      history.pushState({}, '', '/spa')
    })
    await page.waitForFunction(() => document.querySelector('#spa')?.getAttribute('count') === '1' && document.querySelector('.verified')?.hasAttribute('applied'))
    expect(await page.locator('#geometry button').evaluate(element => getComputedStyle(element).visibility)).toBe('hidden')
    expect(await page.locator('.deleted').count()).toBe(0)
  })

  test('coexists with permission overrides', async ({ page }) => {
    expect(await page.evaluate(async () => await new Promise<number[]>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(position => resolve([position.coords.latitude, position.coords.longitude]), reject)
    }))).toEqual([1, 2])
  })

  test('survives back navigation and stops applying policies after disposal', async ({ page }) => {
    // Real BFCache entry is engine/automation dependent; persisted events are also modeled in jsdom.
    await page.goto(`${origin}/three`)
    await page.goBack()
    await page.waitForFunction(() => document.querySelector('.custom')?.getAttribute('count') === '1')
    await controller?.dispose()
    controller = undefined
    await page.evaluate(() => {
      document.querySelector('.custom')?.removeAttribute('count')
      document.body.insertAdjacentHTML('beforeend', '<div class="deleted" id="after-dispose"></div>')
    })
    expect(await page.locator('#after-dispose').count()).toBe(1)
    expect(await page.locator('.custom').first().getAttribute('count')).toBeNull()
  })

  test('reports asynchronous policy failures and preserves them on repeated disposal', async ({ page }) => {
    await controller?.dispose()
    let notify: DomPolicyErrorHandler = () => { throw new Error('[webview/dom/test] Notification was not initialized') }
    const notification = new Promise<Error>(resolve => { notify = resolve })
    const failed = await api.install(view.webView, [origin], notify)
    controller = failed
    await page.evaluate(() => {
      document.body.insertAdjacentHTML('beforeend', '<button class="failure">Fail</button>')
      const button = document.querySelector('.failure')
      if (button instanceof HTMLElement) button.click()
    })
    const error = await notification
    expect(error.message).toBe('[webview/dom/apply] Page policy failed')
    expect(() => failed.throwIfFailed()).toThrow(error)
    await expect(failed.dispose()).rejects.toBe(error)
    await expect(failed.dispose()).rejects.toBe(error)
    controller = undefined
  })
})
