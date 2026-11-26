import { WebView } from '../../common/webView'
import { TemporaryError } from '../../errors'
import get from '../../types/get'
import type installReceiptForm from './receiptForm.webview'
import formScript from './receiptForm.webview.ts?format=iife&globalName=WebViewScript&bundle'

const origin = 'https://ch.info-center.by'
const bridge = '__zenmoneyReceiptChecked'
const automaticWaitMs = 5000
const retryMessage = 'Не удалось проверить чек. Попробуйте позже.'

// eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval
const installForm = new Function('input', `${formScript}\nreturn WebViewScript.default(input)`) as typeof installReceiptForm

export async function fetchReceiptResponse (uid: string, date: string): Promise<unknown> {
  const page = new WebView()
  let resolve!: (value: unknown) => void
  let reject!: (error: unknown) => void
  const result = new Promise<unknown>((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })
  let markReady!: () => void
  let receivedResult = false
  let manualConfirmation = false
  let requestInteraction!: () => void
  const interaction = new Promise<true>(resolve => { requestInteraction = () => { resolve(true) } })
  let interactionTimer: ReturnType<typeof setTimeout> | undefined
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
      const setupError = get(value, 'setupError')
      if (typeof setupError === 'string') reject(new Error(setupError))
      else if (get(value, 'ready') === true) markReady()
      else if (get(value, 'rateLimited') === true) {
        reject(new TemporaryError('Превышен лимит проверок чеков. Попробуйте позже.'))
      } else if (get(value, 'requestFailed') === true) {
        if (manualConfirmation) reject(new Error('MNS receipt request failed'))
        else requestInteraction()
      } else {
        const payload = get(value, 'payload')
        const captchaRejected = get(payload, 'data.status') === 'error' &&
          get(payload, 'data.code') === 403 &&
          get(payload, 'data.errors.global') === 'Автоматическая активность заблокирована капчей.'
        if (captchaRejected) {
          if (manualConfirmation) reject(new TemporaryError(retryMessage))
          else requestInteraction()
        } else {
          receivedResult = true
          resolve(payload)
        }
      }
    })
    await page.addInitScript(installForm, { origin, uid, date, bridge })
    const loadForm = async (): Promise<void> => {
      const ready = new Promise<void>(resolve => { markReady = resolve })
      await page.goto(origin + '/', { waitUntil: 'load', log: false })
      if (await page.url() !== origin + '/') throw new Error('Unexpected MNS receipt page')
      await Promise.race([ready, result])
    }
    await loadForm()
    const scheduled = await page.evaluate(waitMs => {
      const button = document.querySelector<HTMLButtonElement>('#scan-tab-uid [data-check-receipt-btn]')
      const captcha = Reflect.get(window, 'grecaptcha') as { ready?: (callback: () => void) => void } | undefined
      if (button === null || button.disabled || typeof captcha?.ready !== 'function') return false
      const deadline = Date.now() + waitMs
      let clicked = false
      button.addEventListener('click', () => { clicked = true }, { once: true })
      captcha.ready(() => {
        if (!clicked && button.isConnected && Date.now() < deadline) button.click()
      })
      return true
    }, automaticWaitMs)
    if (scheduled) interactionTimer = setTimeout(requestInteraction, automaticWaitMs)
    else requestInteraction()
    if (await Promise.race([result.then(() => false), interaction])) {
      // The automatic attempt may leave the provider's widget or error dialog active.
      if (scheduled) await loadForm()
      if (!receivedResult) {
        manualConfirmation = true
        await page.show()
      }
    }
    response = await result
  } catch (error) {
    failed = true
    throw error
  } finally {
    clearTimeout(interactionTimer)
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
