import { JSDOM } from 'jsdom'
import { runInContext } from 'vm'
import type { Disposable, WebViewInstance } from '../../../common/webView'
import { createDomPolicyScript, installDomPolicies } from '../../../common/webview/dom'
import type policies from '../sso-ui.webview'
import source from '../sso-ui.webview.ts?format=iife&globalName=WebViewScript&bundle'
import { res } from '../res'

// DOM structure/text observed in the Android PWA main-MMJYJCRQ.js on 2026-10-12.
// Model native transport, inert and dialog presentation; execute the actual DOM policies.
class PageView {
  readonly page = new JSDOM('<body></body>', { url: 'https://mb.asb.by/auth-board', runScripts: 'outside-only' })
  constructor () {
    Object.defineProperty(this.page.window.HTMLElement.prototype, 'inert', { get () { return this.hasAttribute('inert') } })
    this.page.window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
    const Event = this.page.window.Event
    this.page.window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new Event('close')) }
  }

  run (script: Function, arg: unknown): unknown {
    Object.assign(this.page.window, { __arg: arg })
    return runInContext(`(${script.toString()})(__arg)`, this.page.getInternalVMContext())
  }

  element<T extends Element = HTMLElement> (selector: string): T {
    const element = this.page.window.document.querySelector<T>(selector)
    if (element === null) throw new Error('[test/sso-ui] Missing fixture element')
    return element
  }

  async url (): Promise<string> { return this.page.window.location.href }
  async isClosed (): Promise<boolean> { return false }
  on (): this { return this }
  off (): this { return this }
  async exposeFunction (name: string, callback: Function): Promise<Disposable> {
    Object.assign(this.page.window, { [name]: callback })
    return { dispose: async () => { Reflect.deleteProperty(this.page.window, name) } }
  }

  async addInitScript (): Promise<Disposable> { return { dispose: async () => {} } }
  async evaluate (script: Function, arg: unknown): Promise<unknown> { return this.run(script, arg) }
}
const settle = async (): Promise<void> => { for (let i = 0; i < 40; i++) await Promise.resolve() }

describe('SSO guidance and controls', () => {
  let view: PageView
  let controller: Disposable
  beforeEach(async () => {
    view = new PageView()
    controller = await installDomPolicies(view as unknown as WebViewInstance, {
      origins: ['https://mb.asb.by'],
      script: createDomPolicyScript<typeof policies>(source),
      arg: { dialog: res.installationDialog, store: res.stores.android }
    })
  })
  afterEach(async () => { await controller.dispose(); view.page.window.close() })

  it('dismisses only the informational geo warning before continuing the bank flow', async () => {
    view.page.window.document.body.innerHTML = `
      <tui-dialogs><div class="t-overlay"></div><section role="dialog"><tui-sheet-dialog>
        <sc-nx-ibr-confirmation-web><div class="heading">Уважаемый клиент!
Для обеспечения вашей безопасности и снижения риска мошеннических операций, необходимо предоставить доступ к геолокации вашего устройства.
При отсутствии разрешения вход в онлайн-банк будет недоступен.
Узнать подробности можно на сайте и в социальных сетях банка.</div><button>ОК</button></sc-nx-ibr-confirmation-web>
      </tui-sheet-dialog></section></tui-dialogs>`
    const button = view.element<HTMLButtonElement>('button')
    const continueBankFlow = jest.fn(() => button.closest('section')?.remove())
    button.addEventListener('click', continueBankFlow)
    await settle()
    expect(continueBankFlow).toHaveBeenCalledTimes(1)
    expect(view.page.window.document.querySelector('section')).toBeNull()
    view.element('tui-dialogs').innerHTML = '<section role="dialog"><tui-sheet-dialog><sc-nx-ibr-confirmation-web><div class="heading">Для продолжения работы предоставьте доступ к геолокации в настройках браузера</div><button>ОК</button></sc-nx-ibr-confirmation-web></tui-sheet-dialog></section>'
    const otherMessage = jest.fn()
    view.element<HTMLButtonElement>('button').addEventListener('click', otherMessage)
    await settle()
    expect(otherMessage).not.toHaveBeenCalled()
    expect(view.element('section').style.display).toBe('')
  })

  it.each([
    ['Android', 'button-end', 'assets/taiga-ui/icons/ellipsis-vertical.svg'],
    ['Android', 'button-start', 'assets/icon/sc-chevron-left.svg'],
    // Inline style captured through pymobiledevice3 in the iOS WebView on 2026-10-13.
    ['iOS', 'button-start', String.raw`assets\/icon\/sc-chevron-left\.svg`]
  ])('hides the %s %s control after insertion and SPA replacement', async (_platform, className, icon) => {
    for (let i = 0; i < 2; i++) {
      // Header controls observed in the Android SSO WebView on 2026-10-12.
      view.page.window.document.body.innerHTML = `<button tuiiconbutton class="${className}" style="--t-icon-start: url(${icon});"></button>`
      const originalAction = jest.fn()
      const button = view.element<HTMLButtonElement>('button')
      button.addEventListener('click', originalAction)
      await settle()
      if (className === 'button-start') {
        // Preserve the bank header layout while blocking the back control.
        expect(button.style.visibility).toBe('hidden')
        expect(button.style.display).toBe('')
      } else expect(button.style.display).toBe('none')
      button.click()
      expect(originalAction).not.toHaveBeenCalled()
    }
  })

  it('hides the forgotten password control and blocks its bank action', async () => {
    view.page.window.document.body.innerHTML = '<form class="login-form"><button tuiButton type="button" class="auth-forgot"> Забыли пароль? </button></form>'
    const button = view.element<HTMLButtonElement>('button')
    const bankAction = jest.fn()
    button.addEventListener('click', bankAction)
    button.click()
    await settle()
    expect(button.style.display).toBe('none')
    expect(bankAction).not.toHaveBeenCalled()
    expect(view.page.window.document.querySelector('dialog')).toBeNull()
  })

  it.each(['Зарегистрироваться', 'Восстановить доступ'])('replaces %s with installation instructions without starting the bank action', async label => {
    view.page.window.document.body.innerHTML = `<sc-nx-ibr-auth-aside-web><button tuiButton>${label}</button></sc-nx-ibr-auth-aside-web>`
    const originalAction = jest.fn()
    const button = view.element<HTMLButtonElement>('button')
    button.addEventListener('click', originalAction)
    button.focus()
    // Immediate activation also needs to be intercepted before MutationObserver delivery.
    button.click()
    await settle()
    expect(originalAction).not.toHaveBeenCalled()
    const dialog = view.element<HTMLDialogElement>('dialog[open]')
    expect(dialog).not.toBeNull()
    expect(dialog.textContent).toContain(label === 'Зарегистрироваться' ? 'Регистрация недоступна' : 'Восстановление доступа недоступно')
    expect([...dialog.querySelectorAll('li')].map(e => e.textContent)).toEqual([
      res.installationDialog.installStep + res.stores.android.title,
      res.installationDialog.actionStep,
      res.installationDialog.syncStep
    ])
    expect(view.element<HTMLAnchorElement>('dialog a').href).toBe('https://play.google.com/store/apps/details?id=by.softclub.belarusbank')
    button.click()
    expect(view.page.window.document.querySelectorAll('dialog')).toHaveLength(1)
    view.element<HTMLButtonElement>('dialog button').click()
    expect(view.page.window.document.querySelector('dialog')).toBeNull()
    expect(view.page.window.document.activeElement).toBe(button)
  })

  it('suppresses only the registration snackbar duplicated by the open guidance dialog', async () => {
    // Actual Android PWA tui-alert markup captured on 2026-10-12; retain bank spacing and text.
    view.page.window.document.body.innerHTML = '<form class="login-form"><sc-nx-ibr-error>Для входа в приложение пройдите регистрацию</sc-nx-ibr-error></form>'
    await settle()
    view.page.window.document.body.insertAdjacentHTML('beforeend', '<tui-alert role="alert" style="margin: 1rem 1rem 0px auto"><div class="t-wrapper"><tui-notification data-appearance="error"><span tuiTitle><span tuiSubtitle>Для входа в приложение пройдите регистрацию</span></span><button type="button"> Закрыть </button></tui-notification></div></tui-alert>')
    await settle()
    const toast = view.element('tui-alert')
    expect(toast.style.display).toBe('none')
    expect(toast.querySelector('[tuiSubtitle]')?.textContent).toBe('Для входа в приложение пройдите регистрацию')
    expect(toast.style.margin).toBe('1rem 1rem 0px auto')
    view.page.window.document.body.insertAdjacentHTML('beforeend', '<tui-alert id="other-message"><tui-notification data-appearance="error"><span tuiSubtitle>Неверный пароль</span></tui-notification></tui-alert>')
    await settle()
    expect(view.element('#other-message').style.display).toBe('')
  })

  it('reopens registration guidance on repeated login confirmation while the bank error remains', async () => {
    // Observed retry state: the same instruction stays in the login form after the dialog closes.
    view.page.window.document.body.innerHTML = '<form class="login-form"><sc-nx-ibr-error>Для входа в приложение пройдите регистрацию</sc-nx-ibr-error><button tuiButton type="submit">Войти</button></form>'
    const form = view.element<HTMLFormElement>('form')
    form.addEventListener('submit', event => event.preventDefault())
    const submit = view.element<HTMLButtonElement>('button[type="submit"]')
    const bankSubmission = jest.fn()
    submit.addEventListener('click', bankSubmission)
    await settle()
    view.element<HTMLButtonElement>('dialog button').click()
    await settle()
    expect(view.page.window.document.querySelector('dialog')).toBeNull()
    submit.click()
    await settle()
    expect(view.element<HTMLDialogElement>('dialog[open]').textContent).toContain('Регистрация недоступна')
    expect(bankSubmission).toHaveBeenCalledTimes(1)
  })

  it.each(['Сначала пройдите регистрацию', 'Для входа в приложение пройдите регистрацию'])('shows registration guidance for %s and leaves unrelated errors alone', async message => {
    view.page.window.document.body.innerHTML = '<form class="login-form"><sc-nx-ibr-error></sc-nx-ibr-error></form>'
    const error = view.element('sc-nx-ibr-error')
    error.textContent = 'Неверный пароль'
    await settle()
    expect(view.page.window.document.querySelector('dialog')).toBeNull()
    // Bank instruction observed in the user's Android WebView screenshot on 2026-10-12.
    // The shorter instruction was supplied in the original task; no API code is inferred.
    error.textContent = message
    await settle()
    expect(view.element<HTMLDialogElement>('dialog[open]').textContent).toContain('Регистрация недоступна')
    view.element<HTMLButtonElement>('dialog button').click()
    await settle()
    expect(view.page.window.document.querySelector('dialog')).toBeNull()
    error.textContent = ''
    await settle()
    error.textContent = message
    await settle()
    expect(view.page.window.document.querySelector('dialog[open]')).not.toBeNull()
  })
})
