import type { DomPolicyFactory } from '../../common/webview/dom'
import type { res } from './res'

export interface SsoUiConfig {
  readonly dialog: typeof res.installationDialog
  readonly store: { readonly title: string, readonly url: string }
}

type Action = 'registration' | 'recovery'
const text = (element: Element | null): string => (element?.textContent ?? '').replace(/\s+/g, ' ').trim()
const needsRegistration = (element: Element | null): boolean => {
  const message = text(element)
  return message.toLowerCase() === 'для входа в приложение пройдите регистрацию' ||
    /сначала\s+(?:пройдите|необходимо\s+пройти)\s+регистрацию/i.test(message)
}

function installStyles (): void {
  if (document.getElementById('zenmoney-sso-style') !== null) return
  const style = document.createElement('style')
  style.id = 'zenmoney-sso-style'
  style.textContent = `
    section[data-zenmoney-geo-warning] { display: none !important; }
    tui-dialogs:has(> section[data-zenmoney-geo-warning]):not(:has(> section:not([data-zenmoney-geo-warning]))) > .t-overlay { display: none !important; }
    #zenmoney-installation-dialog {
      box-sizing: border-box; width: min(calc(100% - 32px), 440px); max-height: calc(100% - 32px); overflow: auto;
      inset: 0; margin: auto; padding: 24px 32px;
      border: 0; border-radius: var(--sc-border-radius-main, 16px);
      background: var(--sc-bg-secondary, #fff); color: var(--sc-text-primary-color, #212121);
      font: 16px/24px var(--sc-font-weight-regular, Manrope-Regular), sans-serif;
    }
    #zenmoney-installation-dialog::backdrop { background: rgba(0, 0, 0, .24); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
    tui-alert:has(tui-notification[data-appearance="error"]) .t-wrapper { background: var(--sc-bg-secondary, #fff); border-radius: var(--sc-border-radius-main, 16px); }
    tui-alert tui-notification[data-appearance="error"] {
      background: var(--sc-bg-secondary, #fff) !important; color: var(--sc-text-primary-color, #212121) !important;
      border-radius: inherit; box-shadow: inset 3px 0 var(--sc-bg-error, #ff4246);
    }
    tui-alert tui-notification[data-appearance="error"] [tuiSubtitle] { color: inherit; }
    #zenmoney-installation-dialog h2 { margin: 0 0 12px; font: 24px/32px var(--sc-font-weight-semibold, Manrope-Semibold), sans-serif; }
    #zenmoney-installation-dialog p { margin: 0 0 24px; }
    #zenmoney-installation-dialog ol { list-style: none; counter-reset: step; margin: 0 0 24px; padding: 0; }
    #zenmoney-installation-dialog li { counter-increment: step; position: relative; padding-left: 44px; margin-bottom: 20px; min-height: 32px; }
    #zenmoney-installation-dialog li::before {
      content: counter(step); position: absolute; left: 0; top: 0; width: 32px; height: 32px;
      display: grid; place-items: center; border-radius: 50%; background: var(--sc-bg-brand-quinary, #e7f5ef);
      color: var(--sc-text-brand-color, #008a61); font-family: var(--sc-font-weight-semibold, Manrope-Semibold), sans-serif;
    }
    #zenmoney-installation-dialog a, #zenmoney-installation-dialog button {
      box-sizing: border-box; display: flex; justify-content: center; align-items: center;
      min-height: 48px; padding: 12px 20px; border-radius: var(--sc-border-radius-main, 16px);
      font: 16px/24px var(--sc-font-weight-semibold, Manrope-Semibold), sans-serif; text-decoration: none; cursor: pointer;
    }
    #zenmoney-installation-dialog a { margin-top: 12px; color: var(--sc-text-primary-color-on-brand, #fff); background: var(--sc-bg-brand, #008a61); }
    #zenmoney-installation-dialog button { width: 100%; border: 1px solid var(--sc-border-primary-color, #ddd); background: transparent; color: inherit; }
    #zenmoney-installation-dialog a:focus-visible, #zenmoney-installation-dialog button:focus-visible { outline: 2px solid var(--sc-border-brand-color, #008a61); outline-offset: 3px; }
  `
  document.head.append(style)
}

/** Page-local dialog: resources and the OS-selected store arrive from the plugin realm. */
export function showAppInstallationDialog (config: SsoUiConfig, action: Action): void {
  const existing = document.getElementById('zenmoney-installation-dialog')
  if (existing !== null) return
  installStyles()
  const previousFocus = document.activeElement
  const dialog = document.createElement('dialog')
  dialog.id = 'zenmoney-installation-dialog'
  dialog.setAttribute('aria-labelledby', 'zenmoney-installation-title')
  dialog.setAttribute('aria-describedby', 'zenmoney-installation-description')
  const title = document.createElement('h2')
  title.id = 'zenmoney-installation-title'
  title.textContent = config.dialog.title
  const description = document.createElement('p')
  description.id = 'zenmoney-installation-description'
  description.textContent = action === 'registration' ? config.dialog.registrationDescription : config.dialog.recoveryDescription
  const steps = document.createElement('ol')
  for (const label of [config.dialog.installStep, config.dialog.actionStep, config.dialog.syncStep]) {
    const step = document.createElement('li')
    step.textContent = label
    steps.append(step)
  }
  const store = document.createElement('a')
  store.href = config.store.url
  store.textContent = config.store.title
  // The navigation policy opens this exact URL in the OS browser/store.
  steps.querySelector('li')?.append(store)
  const close = document.createElement('button')
  close.type = 'button'
  close.textContent = config.dialog.close
  close.addEventListener('click', () => dialog.close())
  dialog.addEventListener('close', () => {
    dialog.remove()
    if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
  }, { once: true })
  dialog.append(title, description, steps, close)
  document.body.append(dialog)
  dialog.showModal()
}

const policies: DomPolicyFactory<SsoUiConfig> = config => {
  const loginErrors = new WeakMap<Element, string>()
  const actionFor = (element: Element): Action | undefined => {
    switch (text(element).toLowerCase()) {
      case 'зарегистрироваться': return 'registration'
      case 'восстановить доступ':
      case 'восстановление доступа': return 'recovery'
      default: return undefined
    }
  }
  return [
    { selectors: 'head', policy: { type: 'custom', apply: () => { installStyles() } } },
    {
      selectors: 'tui-alert',
      all: true,
      application: {
        shouldApply: ({ element }) => document.querySelector('#zenmoney-installation-dialog[open]') !== null &&
          needsRegistration(element.querySelector('tui-notification [tuiSubtitle]'))
      },
      policy: 'hidden'
    },
    {
      selectors: [
        'button.button-end[tuiiconbutton][style*="ellipsis-vertical.svg"]',
        'button.auth-forgot'
      ],
      all: true,
      policy: 'hidden'
    },
    {
      // WebKit escapes the dot in CSS URL serialization; match the stable icon name.
      selectors: 'button.button-start[tuiiconbutton][style*="sc-chevron-left"]',
      all: true,
      policy: 'invisible'
    },
    {
      selectors: 'sc-nx-ibr-confirmation-web',
      all: true,
      application: {
        shouldApply: ({ element, wasApplied }) => !wasApplied && text(element.querySelector('.heading')).includes('доступ к геолокации вашего устройства') &&
          [...element.querySelectorAll('button')].some(button => text(button) === 'ОК')
      },
      policy: {
        type: 'custom',
        apply: element => {
          installStyles()
          element.closest('section[role="dialog"]')?.setAttribute('data-zenmoney-geo-warning', '')
          // Complete the client's notice; merely hiding it leaves runCheck awaiting confirmation.
          const confirm = [...element.querySelectorAll('button')].find(button => text(button) === 'ОК')
          if (confirm === undefined) throw new Error('[auth/cold] Missing geo notice confirmation button')
          confirm.click()
        }
      }
    },
    {
      selectors: 'button[tuiButton], sc-nx-ibr-auth-aside-web button, button.auth-forgot',
      all: true,
      application: { shouldApply: ({ element, wasApplied }) => !wasApplied && actionFor(element) !== undefined },
      policy: {
        type: 'onClick',
        behavior: 'replace',
        handler: element => {
          const action = actionFor(element)
          if (action !== undefined) showAppInstallationDialog(config, action)
        }
      }
    },
    {
      selectors: '.login-form button[type="submit"]',
      all: true,
      policy: {
        type: 'onClick',
        behavior: 'listen',
        handler: element => {
          if (needsRegistration(element.closest('form')?.querySelector('sc-nx-ibr-error') ?? null)) {
            showAppInstallationDialog(config, 'registration')
          }
        }
      }
    },
    {
      selectors: '.login-form sc-nx-ibr-error',
      all: true,
      application: { shouldApply: ({ element }) => loginErrors.get(element) !== text(element) },
      policy: {
        type: 'custom',
        apply: element => {
          const message = text(element)
          loginErrors.set(element, message)
          if (needsRegistration(element)) showAppInstallationDialog(config, 'registration')
        }
      }
    }
  ]
}
export default policies
