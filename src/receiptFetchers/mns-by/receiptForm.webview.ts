interface FormInput {
  origin: string
  uid: string
  date: string
  bridge: string
}

interface ComponentOptions {
  data?: { ui?: string, date?: string }
}

function prepareReceiptForm ({ uid, date }: FormInput, report: (result: unknown) => Promise<unknown>): void {
  const form = document.querySelector('#scan-tab-uid')
  const uidInput = form?.querySelector<HTMLInputElement>('input[name="receiptId"]')
  const dateInput = form?.querySelector<HTMLInputElement & { _flatpickr?: { setDate: (date: string, triggerChange: boolean) => void } }>('input[name="date"]')
  const submit = form?.querySelector<HTMLButtonElement>('[data-check-receipt-btn]')
  const ajax = Reflect.get(window, 'BX')?.ajax as {
    runComponentAction: (component: string, action: string, options: ComponentOptions) => Promise<unknown>
  } | undefined
  if (uidInput == null || dateInput?._flatpickr == null || submit == null || typeof ajax?.runComponentAction !== 'function') {
    throw new Error('MNS receipt form has changed')
  }

  const run = ajax.runComponentAction
  // Keep the original Bitrix promise available to the site.
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  ajax.runComponentAction = function (component, action, options) {
    const response = run.call(this, component, action, options)
    if (component === 'info-center:receipt.check' && action === 'checkReceipt' && options.data?.ui === uid) {
      void response.then(
        async payload => await report({ payload }),
        async (error: { errors?: Array<{ code?: unknown }> } | null) => {
          const code = error?.errors?.[0]?.code
          await report({ requestFailed: true, rateLimited: code === 'REQUIRE_AUTH' || code === 'SPAM_FLOOD' })
        }
      ).catch(() => {})
    }
    return response
  }

  dateInput._flatpickr.setDate(date, true)
  if (dateInput.value !== date) throw new Error('MNS receipt date could not be set')
  uidInput.value = uid
  uidInput.dispatchEvent(new Event('input', { bubbles: true }))

  const style = document.createElement('style')
  style.textContent = `
    .wrapper > header,
    .wrapper > footer,
    nav[aria-label="Мобильное меню"],
    .wrapper > main a[href="/review/"],
    .wrapper > main section:has(a[href="/review/"]):not(:has(#scan-tab-uid)),
    .wrapper > main section:has(#scan-tab-uid) > div:has(> h1),
    [data-tabs-root] > [data-tabs],
    #scan-tab-uid > div > div:has(input[name="date"]),
    #scan-tab-uid > div > div:has(input[name="receiptId"]),
    #cookieBanner {
      display: none !important;
    }
    .wrapper > main { margin-block: 0 !important; }
    .wrapper > main > .container { padding-block: 1rem !important; }
    .wrapper > main section:has(#scan-tab-uid) { grid-template-columns: minmax(0, 1fr) !important; }
    .wrapper > main section:has(#scan-tab-uid) > .card-border,
    .wrapper > main section:has(#scan-tab-uid) > .card-border > div {
      background: transparent !important;
      border: 0 !important;
      padding: 0 !important;
    }
    #scan-tab-uid [data-check-receipt-btn] { width: 100%; }
    .grecaptcha-badge { visibility: visible !important; }
  `
  document.head.append(style)
}

export default function installReceiptForm (input: FormInput): void {
  if (window !== window.top || location.origin !== input.origin || location.pathname !== '/') return
  window.addEventListener('load', () => {
    // Run after the site's load handlers when a fresh form is opened.
    window.setTimeout(() => {
      const report = Reflect.get(window, input.bridge) as (result: unknown) => Promise<unknown>
      try {
        prepareReceiptForm(input, report)
      } catch (error) {
        void report({ setupError: error instanceof Error ? error.message : 'MNS receipt form setup failed' }).catch(() => {})
        return
      }
      void report({ ready: true }).catch(() => {})
    }, 0)
  }, { once: true })
}
