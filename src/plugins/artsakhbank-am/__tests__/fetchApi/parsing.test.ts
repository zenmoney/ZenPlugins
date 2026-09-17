import { buildMultipartBody, isLoginForm, parseAutoSubmitForm, parseCsrfToken, parseLoginError, parseSessionContext, throwLoginError } from '../../fetchApi'
import { BankMessageError, InvalidLoginOrPasswordError } from '../../../../errors'
import { AUTO_SUBMIT_PAGE } from '../../__fixtures__/autoSubmitPage'
import { MAIN_PAGE } from '../../__fixtures__/mainPage'
import { LOGIN_PAGE } from '../../__fixtures__/loginPage'

describe('разбор страницы входа', () => {
  it('достаёт токен из настоящей формы банка', () => {
    expect(parseCsrfToken(LOGIN_PAGE)).toBe('TESTCSRFTOKEN0001')
  })

  it('не молчит, когда банк отдал страницу без формы', () => {
    expect(() => parseCsrfToken('<html><body>Service unavailable</body></html>')).toThrow()
  })

  it('узнаёт форму входа, пока на ней есть поле пароля', () => {
    expect(isLoginForm(LOGIN_PAGE)).toBe(true)
  })

  it('не принимает за форму входа страницу следующего шага', () => {
    expect(isLoginForm('<form name="fotp"><input id="code" name="code"></form>')).toBe(false)
  })

  it('вытаскивает текст отказа, который банк показывает в форме', () => {
    expect(parseLoginError('<script>$(\'#login\').w2tag(\'Wrong login or password\');</script>'))
      .toBe('Wrong login or password')
    expect(parseLoginError('<div class="error">Account is blocked</div>')).toBe('Account is blocked')
  })

  it('возвращает null, когда банк ничего не написал', () => {
    expect(parseLoginError(LOGIN_PAGE)).toBeNull()
  })
})

describe('сборка тела формы', () => {
  it('обрамляет каждое поле границей, а тело закрывает финальной', () => {
    expect(buildMultipartBody({ ACTION: 'PGLANG', lang: '2' }, 'BOUND')).toBe(
      '--BOUND\r\nContent-Disposition: form-data; name="ACTION"\r\n\r\nPGLANG\r\n' +
      '--BOUND\r\nContent-Disposition: form-data; name="lang"\r\n\r\n2\r\n' +
      '--BOUND--\r\n'
    )
  })

  it('не теряет пустое поле: банк ждёт все поля формы', () => {
    expect(buildMultipartBody({ login: '' }, 'B')).toContain('name="login"\r\n\r\n\r\n')
  })
})

describe('промежуточная страница', () => {
  it('снимает с настоящей страницы банка адрес и все поля', () => {
    expect(parseAutoSubmitForm(AUTO_SUBMIT_PAGE)).toEqual({
      action: 'main.php',
      fields: { ACTION: 'LOGIN', ssl_Kind: '3', csrf_token: 'TESTCSRFTOKEN0002' }
    })
  })

  // Иначе форму входа приняли бы за промежуточную и отправили пароль второй раз
  it('не принимает за промежуточную обычную форму', () => {
    expect(parseAutoSubmitForm(LOGIN_PAGE)).toBeNull()
  })

  it('читает поля независимо от порядка атрибутов', () => {
    const html = '<form action="main.php"><input value="LOGIN" name="ACTION" type="hidden">' +
      '<script>document.flogin.submit()</script></form>'
    expect(parseAutoSubmitForm(html)?.fields).toEqual({ ACTION: 'LOGIN' })
  })

  it('не теряет поле без значения', () => {
    const html = '<form action="main.php"><input name="code"><script>document.f.submit()</script></form>'
    expect(parseAutoSubmitForm(html)?.fields).toEqual({ code: '' })
  })
})

describe('признак состоявшегося входа', () => {
  it('достаёт номер клиента и токен с настоящей главной страницы', () => {
    expect(parseSessionContext(MAIN_PAGE)).toEqual({ custid: '100500', csrfToken: '3' })
  })

  // На странице входа номера клиента ещё нет, и принять её за главную нельзя
  it('не принимает за вход форму логина', () => {
    expect(parseSessionContext(LOGIN_PAGE)).toBeNull()
  })

  it('не принимает за вход промежуточную страницу', () => {
    expect(parseSessionContext(AUTO_SUBMIT_PAGE)).toBeNull()
  })
})

// Заблокированную учётную запись паролем не чинят. Отправив пользователя
// править логин, мы получим новые попытки входа — а банк за них и блокирует
describe('причина отказа во входе', () => {
  const withMessage = (text: string): string => `<script>w2tag('${text}')</script>`

  it('про неверный пароль говорит, что дело в настройках', () => {
    expect(() => throwLoginError(withMessage('Invalid password'))).toThrow(InvalidLoginOrPasswordError)
  })

  it('про блокировку не выдаёт себя за неверный пароль', () => {
    expect(() => throwLoginError(withMessage('Account is blocked'))).toThrow(BankMessageError)
  })

  // Слово «login» в тексте про блокировку не делает её неверным паролем:
  // совет проверить пароль тут вреден, лишние попытки входа продлят блокировку
  it('блокировку не путает с неверным паролем, даже если банк пишет «login»', () => {
    expect(() => throwLoginError(withMessage('Login is blocked, contact the bank'))).toThrow(BankMessageError)
  })

  it('без объяснений банка остаётся на проверке логина и пароля', () => {
    expect(() => throwLoginError('<html></html>')).toThrow(InvalidLoginOrPasswordError)
  })
})
