interface FormInput {
  origin: string
  uid: string
  date: string
  bridge: string
}

interface ComponentOptions {
  data?: { ui?: string, date?: string }
}

export default function prepareReceiptForm ({ origin, uid, date, bridge }: FormInput): void {
  if (location.origin !== origin) throw new Error('Unexpected MNS site')
  const form = document.querySelector('#scan-tab-uid')
  const uidInput = form?.querySelector<HTMLInputElement>('input[name="receiptId"]')
  const dateInput = form?.querySelector<HTMLInputElement & { _flatpickr?: { setDate: (date: string, triggerChange: boolean) => void } }>('input[name="date"]')
  const ajax = Reflect.get(window, 'BX')?.ajax as {
    runComponentAction: (component: string, action: string, options: ComponentOptions) => Promise<unknown>
  } | undefined
  const report = Reflect.get(window, bridge) as ((result: unknown) => Promise<unknown>) | undefined
  if (uidInput == null || dateInput?._flatpickr == null || typeof ajax?.runComponentAction !== 'function' || typeof report !== 'function') {
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
        async () => await report({ requestFailed: true })
      ).catch(() => {})
    }
    return response
  }

  dateInput._flatpickr.setDate(date, true)
  if (dateInput.value !== date) throw new Error('MNS receipt date could not be set')
  uidInput.value = uid
  uidInput.dispatchEvent(new Event('input', { bubbles: true }))
}
