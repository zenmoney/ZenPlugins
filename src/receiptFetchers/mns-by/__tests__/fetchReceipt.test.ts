import { JSDOM } from 'jsdom'
import type { WebViewNavigationPolicy } from '../../../common/webView'
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

// Use the captured response and the UID form's actual field names. The test host
// invokes the site's action only after the user is shown the prefilled form.
test('opens the dated UID form and converts its successful response', async () => {
  const dom = new JSDOM('<form id="scan-tab-uid"><input name="receiptId"><input name="date"></form>', {
    url: 'https://ch.info-center.by/',
    runScripts: 'outside-only'
  })
  const { window } = dom
  const dateInput = window.document.querySelector<HTMLInputElement>('input[name="date"]')
  const uidInput = window.document.querySelector<HTMLInputElement>('input[name="receiptId"]')
  assert(dateInput !== null && uidInput !== null)
  Reflect.set(dateInput, '_flatpickr', { setDate: (value: string) => { dateInput.value = value } })
  const runComponentAction = jest.fn(async (_component: string, _action: string, _options: unknown) => receipt)
  const ajax = { runComponentAction }
  Reflect.set(window, 'BX', { ajax })
  let policy: WebViewNavigationPolicy | null = null
  const page = {
    get navigationPolicy (): WebViewNavigationPolicy | null { return policy },
    set navigationPolicy (value: WebViewNavigationPolicy | null) { policy = value },
    on: jest.fn(),
    off: jest.fn(),
    exposeFunction: jest.fn(async (name: string, callback: (result: unknown) => unknown) => { Reflect.set(window, name, callback) }),
    goto: jest.fn(async () => {}),
    evaluate: jest.fn(async (fn: Function, input: object) => {
      window.eval(`(${fn.toString()})(${JSON.stringify(input)})`)
    }),
    show: jest.fn(async () => {
      expect(dateInput.value).toBe(date)
      expect(uidInput.value).toBe(uid)
      expect(runComponentAction).not.toHaveBeenCalled()
      await ajax.runComponentAction('info-center:receipt.check', 'checkReceipt', { data: { date, ui: uid } })
    }),
    isClosed: jest.fn(async () => false),
    close: jest.fn(async () => {})
  }
  constructWebView.mockReturnValue(page)
  try {
    await expect(fetchReceipt(args)).resolves.toEqual({ status: 'found', receipt: convertReceipt(get(receipt, 'data.message')) })
    expect(page.close).toHaveBeenCalledTimes(1)
  } finally {
    window.close()
  }
})
