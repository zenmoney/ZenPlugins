import type { CookieJar } from 'fetch-cookie'
import type { JSHandle, PageFunction, PageFunctionOn, Unboxed, WebViewInstance } from './webView'
import { WebView } from './webView'

declare function expectType<T> (value: T): void

// Compile-only contract regressions, checked by tsc --noEmit without a native host.
export async function checkWebViewTypes (page: WebViewInstance, jar: CookieJar): Promise<void> {
  expectType<WebViewInstance>(new WebView({ userAgent: 'model' }))
  // @ts-expect-error Native constructors are accessed through the shared modules.
  void ZenMoney.WebView
  const handle = await page.evaluateHandle(() => ({ value: 7 }))
  const readValue: PageFunction<typeof handle, number> = value => value.value
  const addValues: PageFunctionOn<Unboxed<typeof handle>, readonly [typeof handle], number> = (value, arg) => value.value + arg[0].value
  expectType<Promise<number>>(page.evaluate(readValue, handle))
  expectType<Promise<JSHandle<number>>>(page.evaluateHandle(arg => arg.handle.value, { handle }))
  expectType<Promise<number>>(handle.evaluate(addValues, [handle] as const))
  expectType<Promise<JSHandle<number>>>(handle.evaluateHandle((value, arg) => value.value + arg.handle.value, { handle }))
  expectType<Promise<number | undefined>>(page.evaluate(arg => arg.get('value')?.value, new Map([['value', handle]])))
  expectType<Promise<number[]>>(page.evaluate(arg => Array.from(arg, value => value.value), new Set([handle])))
  expectType<Promise<string>>(page.evaluate(arg => arg.date.toISOString(), { date: new Date(0) }))
  // @ts-expect-error A page receives the referenced value, not the plugin's handle methods.
  void page.evaluate(value => value.jsonValue(), handle)
  expectType<Promise<void>>(page.goto('https://example.test', { log: false, sanitizeRequestLog: { url: { query: { token: true } } } }))
  page.navigationPolicy = navigation => {
    expectType<HeadersInit>(navigation.headers)
    return WebView.NavigationAction.LOAD
  }
  expectType<CookieJar>(page.cookieJar)
  expectType<WebViewInstance['cookieJar']>(jar)
  await page.cookieJar.setCookie('key=value', 'https://example.test', { ignoreError: true })
  // @ts-expect-error The fetch-cookie interface requires the options argument.
  await page.cookieJar.setCookie('key=value', 'https://example.test')
}
