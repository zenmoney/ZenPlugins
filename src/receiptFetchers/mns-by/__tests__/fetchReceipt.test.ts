import { JSDOM } from 'jsdom'
import type { WebViewNavigationPolicy } from '../../../common/webView'
import { TemporaryError } from '../../../errors'
import get from '../../../types/get'
import { convertReceipt } from '../converters'
import { fetchReceipt } from '../index'
import receipt from './convertReceipt-01.json'

const constructWebView = Object.assign(jest.fn(), {
  NavigationAction: { LOAD: undefined, BLOCK: true }
})

const uid = '1B1B958F18F1B1A5071866A4'
const date = '2026-10-25'
const args = { code: { format: 'qr' as const, value: uid }, transactionDate: date, isInBackground: false }

beforeEach(() => {
  constructWebView.mockReset()
  Object.assign(globalThis, { ZenMoney: { locale: 'en', WebView: constructWebView } })
})

test('[model] without a transaction date the provider makes no lookup', async () => {
  await expect(fetchReceipt({ ...args, transactionDate: undefined })).resolves.toEqual({ status: 'notApplicable' })
  expect(constructWebView).not.toHaveBeenCalled()
})

test('[model] a foreground-only provider declines background lookup without opening the form', async () => {
  await expect(fetchReceipt({ ...args, isInBackground: true })).resolves.toEqual({ status: 'notApplicable' })
  expect(constructWebView).not.toHaveBeenCalled()
})

test.each([
  { outcome: 'accepted', scenario: 'returns the receipt with the view hidden when automatic verification succeeds' },
  { outcome: 'denied', scenario: 'opens a fresh usable form after automatic verification is rejected' },
  { outcome: 'failed', scenario: 'shows the form when the automatic request fails' },
  { outcome: 'authRequired', scenario: 'returns the provider guest limit without opening a redundant confirmation' },
  { outcome: 'spamFlood', scenario: 'closes the form and asks to retry later after manual verification hits the request limit' },
  { outcome: 'manualDenied', scenario: 'closes the form and asks to retry later when manual verification is also rejected' }
])('$scenario', async ({ outcome }) => {
  const needsInteraction = outcome !== 'accepted' && outcome !== 'authRequired'
  const url = 'https://ch.info-center.by/'
  const documents: JSDOM[] = []
  let initScript: string
  let bridge: readonly [string, (result: unknown) => unknown]
  let captchaReady!: () => void
  const runComponentAction = jest.fn(async (_component: string, _action: string, _options: unknown): Promise<unknown> => receipt)
  const captchaRejection = {
    status: 'success',
    data: { status: 'error', errors: { global: 'Автоматическая активность заблокирована капчей.' }, code: 403 },
    errors: []
  }
  if (needsInteraction && outcome !== 'failed') runComponentAction.mockResolvedValueOnce(captchaRejection)
  if (outcome === 'failed') runComponentAction.mockRejectedValueOnce(new Error('Request failed'))
  if (outcome === 'authRequired') runComponentAction.mockRejectedValueOnce({ errors: [{ code: 'REQUIRE_AUTH' }] })
  // The provider's buyer form handles SPAM_FLOOD as another rejected Bitrix action.
  if (outcome === 'spamFlood') runComponentAction.mockRejectedValueOnce({ errors: [{ code: 'SPAM_FLOOD' }] })
  if (outcome === 'manualDenied') runComponentAction.mockResolvedValueOnce(captchaRejection)
  const load = async (): Promise<void> => {
    const dom = new JSDOM(`
      <div class="wrapper"><header></header><main><form id="scan-tab-uid">
      <input name="receiptId"><input name="date"><button type="button" data-check-receipt-btn>Проверить чек</button></form></main><footer></footer></div>
      <div id="cookieBanner"><button id="saveCookieSettings">Отклонить все</button></div>
    `, { url, runScripts: 'outside-only' })
    documents.push(dom)
    const { window } = dom
    Reflect.set(window, 'grecaptcha', { ready: (callback: () => void) => { captchaReady = callback } })
    const dateInput = window.document.querySelector<HTMLInputElement>('input[name="date"]')
    const uidInput = window.document.querySelector<HTMLInputElement>('input[name="receiptId"]')
    assert(dateInput !== null && uidInput !== null)
    Reflect.set(dateInput, '_flatpickr', { setDate: (value: string) => { dateInput.value = value } })
    const ajax = { runComponentAction }
    const submit = window.document.querySelector<HTMLButtonElement>('[data-check-receipt-btn]')
    assert(submit !== null)
    submit.addEventListener('click', () => {
      // The provider displays request errors and leaves the button available.
      void ajax.runComponentAction('info-center:receipt.check', 'checkReceipt', { data: { date: dateInput.value, ui: uidInput.value } }).catch(() => {})
    })
    Reflect.set(window, 'BX', { ajax })
    const initialized = new Promise<void>(resolve => {
      Reflect.set(window, bridge[0], async (result: unknown) => {
        if (get(result, 'ready') === true) resolve()
        else if (typeof get(result, 'setupError') === 'string') resolve()
        return bridge[1](result)
      })
    })
    const rejectCookies = window.document.querySelector<HTMLButtonElement>('#saveCookieSettings')
    const saveCookieChoice = jest.fn()
    rejectCookies?.addEventListener('click', saveCookieChoice)
    window.eval(initScript)
    await initialized
    expect(dateInput.value).toBe(date)
    expect(uidInput.value).toBe(uid)
    const cookieBanner = window.document.getElementById('cookieBanner')
    assert(cookieBanner !== null && rejectCookies !== null)
    expect(window.getComputedStyle(cookieBanner).display).toBe('none')
    expect(saveCookieChoice).not.toHaveBeenCalled()
  }
  let policy: WebViewNavigationPolicy | null = null
  const page = {
    get navigationPolicy (): WebViewNavigationPolicy | null { return policy },
    set navigationPolicy (value: WebViewNavigationPolicy | null) { policy = value },
    on: jest.fn(),
    off: jest.fn(),
    exposeFunction: jest.fn(async (name: string, callback: (result: unknown) => unknown) => { bridge = [name, callback] }),
    addInitScript: jest.fn(async (fn: Function, input: object) => {
      initScript = `(${fn.toString()})(${JSON.stringify(input)})`
    }),
    goto: jest.fn(async () => await load()),
    url: jest.fn(async () => url),
    show: jest.fn(async () => {
      expect(runComponentAction).toHaveBeenCalledTimes(1)
      expect(documents).toHaveLength(2)
      documents[1].window.document.querySelector<HTMLButtonElement>('[data-check-receipt-btn]')?.click()
    }),
    evaluate: jest.fn(async (fn: Function, waitMs: number) => {
      const scheduled: unknown = documents[0].window.eval(`(${fn.toString()})(${waitMs})`)
      expect(runComponentAction).not.toHaveBeenCalled()
      captchaReady()
      expect(runComponentAction).toHaveBeenCalledTimes(1)
      return scheduled
    }),
    isClosed: jest.fn(async () => false),
    close: jest.fn(async () => {})
  }
  constructWebView.mockReturnValue(page)
  try {
    const result = fetchReceipt(args)
    if (outcome === 'authRequired' || outcome === 'spamFlood' || outcome === 'manualDenied') {
      const message = outcome === 'manualDenied'
        ? 'Не удалось проверить чек. Попробуйте позже.'
        : 'Превышен лимит проверок чеков. Попробуйте позже.'
      await expect(result).rejects.toBeInstanceOf(TemporaryError)
      await expect(result).rejects.toMatchObject({ message, allowRetry: true, fatal: false })
    } else {
      await expect(result).resolves.toEqual({ status: 'found', receipt: convertReceipt(get(receipt, 'data.message')) })
    }
    expect(page.show).toHaveBeenCalledTimes(needsInteraction ? 1 : 0)
    expect(runComponentAction).toHaveBeenCalledTimes(needsInteraction ? 2 : 1)
    expect(page.close).toHaveBeenCalledTimes(1)
  } finally {
    for (const dom of documents) dom.window.close()
  }
})
