import { WebView } from '../../common/webView'
import { TemporaryError } from '../../errors'
import get from '../../types/get'
import type prepareReceiptForm from './receiptForm.webview'
import formScript from './receiptForm.webview.ts?format=iife&globalName=WebViewScript&bundle'

const origin = 'https://ch.info-center.by'
const bridge = '__zenmoneyReceiptChecked'

// eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval
const prepareForm = new Function('input', `${formScript}\nreturn WebViewScript.default(input)`) as typeof prepareReceiptForm

export async function fetchReceiptResponse (uid: string, date: string): Promise<unknown> {
  const page = new WebView()
  let resolve!: (value: unknown) => void
  let reject!: (error: unknown) => void
  const result = new Promise<unknown>((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })
  // Closing or a synchronous page callback can settle the promise during setup.
  void result.catch(() => {})
  const onClose = (): void => { reject(new TemporaryError('MNS receipt check closed')) }
  page.on('close', onClose)
  let failed = false
  let response: unknown
  let closeError: unknown
  try {
    page.navigationPolicy = WebView.createNavigationPolicy(({ url }) => {
      const target = new URL(url)
      const isCaptcha = target.origin === 'https://www.google.com' && target.pathname.startsWith('/recaptcha/')
      return target.origin === origin || isCaptcha ? WebView.NavigationAction.LOAD : WebView.NavigationAction.BLOCK
    }, { log: false })
    await page.exposeFunction(bridge, (value: unknown) => {
      if (get(value, 'requestFailed') === true) reject(new Error('MNS receipt request failed'))
      else resolve(get(value, 'payload'))
    })
    await page.goto(origin + '/', { waitUntil: 'load', log: false })
    await page.evaluate(prepareForm, { origin, uid, date, bridge })
    // The site submits its normal reCAPTCHA-protected form when the user presses Check.
    await page.show()
    response = await result
  } catch (error) {
    failed = true
    throw error
  } finally {
    page.off('close', onClose)
    try {
      if (!await page.isClosed()) await page.close()
    } catch (error) {
      if (failed) console.warn('Failed to close MNS receipt WebView after an earlier failure')
      else closeError = error
    }
  }
  if (closeError !== undefined) throw closeError
  return response
}
