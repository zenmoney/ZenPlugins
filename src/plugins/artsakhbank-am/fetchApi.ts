import { fetch, FetchFunc, FetchOptions, FetchResponse } from '../../common/network'
import { dateInTimezone } from '../../common/dateUtils'
import { makeFetchCookie } from '../../common/cookie/fetchCookie'
import { SimpleCookieJar } from '../../common/cookie/jar'
import { generateRandomString } from '../../common/utils'
import { BankMessageError, InvalidLoginOrPasswordError, TemporaryError } from '../../errors'
import { OTP_CHANNEL, Preferences, Session } from './models'

export const BASE_URL = 'https://online.artsakhbank.am'

// Интернет-банк отдаёт страницы на языке из поля lang: 1 — армянский,
// 2 — английский, 3 — русский. Проверено на живой login.php: только английский
// даёт стабильные подписи, армянский и русский зависят от локали пользователя
const LANG_ENGLISH = '2'

// Часовой пояс Армении не меняется с 2012 года
const ARMENIA_TIMEZONE_OFFSET_MINUTES = 240

// На странице входа приходит Set-Cookie без имени ('httpOnly; secure;
// SameSite=strict'), и разборщик принимает первый атрибут за имя. Отбрасываем
// именно такой мусор, а не всё незнакомое: банк может ставить метку доверенного
// устройства под любым именем, и потерять её значило бы спрашивать код каждый раз
const COOKIE_ATTRIBUTES = /^(httponly|secure|samesite|path|domain|expires|max-age)$/i

export function createSession (storedCookies?: Record<string, string>): Session {
  const jar = new SimpleCookieJar()
  const cookies: Record<string, string> = { ...storedCookies }
  jar.setValidator(cookie => {
    const isValid = !COOKIE_ATTRIBUTES.test(cookie.name)
    if (isValid) {
      cookies[cookie.name] = cookie.value
    }
    return { isValid, cookie }
  })
  // Сессию прошлой синхронизации кладём в ту же банку: если банк её ещё помнит,
  // код спрашивать не придётся
  for (const [name, value] of Object.entries(storedCookies ?? {})) {
    void jar.setCookie(`${name}=${value}`, BASE_URL, { ignoreError: true })
  }
  const withCookies = makeFetchCookie(fetch, jar) as FetchFunc
  return {
    fetch: async (url, options) => await withCookies(url, withSecretsMasked(options)),
    csrfToken: '',
    getCookies: () => ({ ...cookies })
  }
}

// Маскируем в одном месте, а не по вызовам: банк раскладывает секреты и по
// заголовкам, и по строке запроса, и любой новый запрос иначе снова потечёт
// в лог. Cookie bcsession — это сама сессия, custid и csrf_token открывают
// страницы клиента, PARAM несёт полный номер счёта
const SECRET_QUERY = { custid: true, csrf_token: true, PARAM: true, uid: true }

function withSecretsMasked (options?: FetchOptions): FetchOptions {
  return {
    ...options,
    sanitizeRequestLog: {
      ...typeof options?.sanitizeRequestLog === 'object' ? options.sanitizeRequestLog : {},
      url: { query: SECRET_QUERY },
      headers: { cookie: true, Cookie: true }
    },
    sanitizeResponseLog: {
      ...typeof options?.sanitizeResponseLog === 'object' ? options.sanitizeResponseLog : {},
      url: { query: SECRET_QUERY },
      headers: { 'set-cookie': true, 'Set-Cookie': true }
    }
  }
}

// Ровно тот заголовок, который шлёт браузер: без него F5 перед банком
// отвечает страницей проверки вместо формы
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9'
}

export async function fetchLoginPage (session: Session): Promise<string> {
  const response = await session.fetch(`${BASE_URL}/login.php`, {
    method: 'GET',
    headers: BROWSER_HEADERS
  })
  return readHtml(response)
}

export async function fetchLogin (session: Session, { login, password, otpChannel }: Preferences): Promise<string> {
  // Форма банка по умолчанию предлагает СМС, и её же выбираем, когда способ не задан
  const securKind = otpChannel ?? OTP_CHANNEL.sms
  const response = await postForm(session, {
    ACTION: 'PGLOGIN',
    csrf_token: session.csrfToken,
    lang: LANG_ENGLISH,
    login,
    password,
    secur_kind: securKind,
    mysecure_kind: securKind
  }, {
    sanitizeRequestLog: { body: true }
  })
  return readHtml(response)
}

// Банк переключает язык тем же login.php, только с другим ACTION.
// Нужен до ввода логина: форма приходит на армянском
export async function fetchEnglishLoginPage (session: Session): Promise<string> {
  const response = await postForm(session, {
    ACTION: 'PGLANG',
    csrf_token: session.csrfToken,
    lang: LANG_ENGLISH
  })
  return readHtml(response)
}

async function postForm (session: Session, fields: Record<string, string>, options?: { sanitizeRequestLog?: unknown, sanitizeResponseLog?: unknown }, path = 'login.php'): Promise<FetchResponse> {
  const boundary = `----ZenMoneyFormBoundary${generateRandomString(16)}`
  return await session.fetch(`${BASE_URL}/${path}`, {
    method: 'POST',
    headers: {
      ...BROWSER_HEADERS,
      Referer: `${BASE_URL}/login.php`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: buildMultipartBody(fields, boundary),
    // Тело уже собрано строкой, иначе network.js отправит его как JSON
    stringify: (body: string) => body,
    ...options
  })
}

// Форма на login.php объявлена enctype="multipart/form-data",
// и банк не принимает её в виде application/x-www-form-urlencoded
export function buildMultipartBody (fields: Record<string, string>, boundary: string): string {
  return Object.entries(fields)
    .map(([name, value]) => `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`)
    .join('') + `--${boundary}--\r\n`
}

function readHtml (response: FetchResponse): string {
  if (response.status >= 500 || response.status === 429) {
    throw new TemporaryError('Банк временно недоступен. Повторите синхронизацию позже.')
  }
  if (typeof response.body !== 'string') {
    throw new TemporaryError('Банк ответил не страницей. Повторите синхронизацию позже.')
  }
  return response.body
}

// Токен одноразовый: банк кладёт новый в каждую отданную страницу,
// и следующий POST со старым он отклонит
export function parseCsrfToken (html: string): string {
  const match = /name="csrf_token"\s+value="([^"]+)"/.exec(html)
  if (match == null) {
    throw new TemporaryError('Банк не отдал форму входа. Повторите синхронизацию позже.')
  }
  return match[1]
}

// Пока на странице есть поле пароля, вход не состоялся
export function isLoginForm (html: string): boolean {
  return /name="ACTION"\s+value="PGLOGIN"/.test(html) && html.includes('id="password"')
}

// Банк показывает причину отказа тут же в форме, отдельного кода ответа нет
export function parseLoginError (html: string): string | null {
  const match = /w2tag\((?:'|")([^'"]{3,200})(?:'|")\)/.exec(html) ??
    /class="err(?:or)?[^"]*"[^>]*>([^<]{3,200})</.exec(html)
  const message = match?.[1].replace(/\s+/g, ' ').trim()
  return message != null && message !== '' ? message : null
}

// Отличить неверный пароль от прочих отказов можно только по тексту банка
const WRONG_CREDENTIALS = /password|parol|login|invalid|incorrect|wrong/i
// Про блокировку банк тоже пишет со словом «login», и ловить её нужно раньше:
// иначе пользователю посоветуют проверить пароль, а ему нужно звонить в банк
const ACCOUNT_LOCKED = /block|lock|заблок|блокир|suspend/i

export function throwLoginError (html: string): never {
  const message = parseLoginError(html)
  if (message == null) {
    throw new InvalidLoginOrPasswordError('Банк не принял логин или пароль. Проверьте их на online.artsakhbank.am.')
  }
  if (ACCOUNT_LOCKED.test(message) || !WRONG_CREDENTIALS.test(message)) {
    // Заблокированную учётную запись паролем не чинят, и звать пользователя
    // менять его — вредный совет: лишние попытки входа только усугубят
    throw new BankMessageError(message)
  }
  throw new InvalidLoginOrPasswordError(message)
}

// После пароля банк отдаёт промежуточную страницу, которая сама себя отправляет
// скриптом на main.php. Идём по ней теми же полями, что и браузер
export async function fetchAutoSubmit (session: Session, form: AutoSubmitForm): Promise<string> {
  // В ответе номер клиента и логин в заголовке страницы
  const response = await postForm(session, form.fields, {
    sanitizeRequestLog: { body: true },
    sanitizeResponseLog: { body: true }
  }, form.action)
  return readHtml(response)
}

export interface AutoSubmitForm {
  action: string
  fields: Record<string, string>
}

// Разбираем форму целиком, а не по знакомым именам: набор полей зависит
// от выбранного способа доставки кода (ssl_Kind повторяет secur_kind)
export function parseAutoSubmitForm (html: string): AutoSubmitForm | null {
  if (!/document\.\w+\.submit\(\)/.test(html)) {
    return null
  }
  const form = /<form[^>]*\baction="([^"]+)"[^>]*>([\s\S]*?)<\/form>/i.exec(html)
  if (form == null) {
    return null
  }
  const fields: Record<string, string> = {}
  for (const tag of form[2].matchAll(/<input[^>]*>/gi)) {
    const attributes = parseAttributes(tag[0])
    if (attributes.name != null) {
      fields[attributes.name] = attributes.value ?? ''
    }
  }
  return { action: form[1], fields }
}

// Порядок атрибутов в разметке банка не постоянен, поэтому читаем их по имени.
// Часть атрибутов идёт без кавычек ('name=CONPASS_REQ'), и пропустить их нельзя:
// именно так объявлены поля ПИН-кода и времени
function parseAttributes (tag: string): Record<string, string> {
  const attributes: Record<string, string> = {}
  for (const attribute of tag.matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    attributes[attribute[1].toLowerCase()] = attribute[2] ?? attribute[3] ?? attribute[4] ?? ''
  }
  return attributes
}

// Все поля формы вместе со значениями: подтверждение ПИН-кода отправляется
// той же формой, у которой меняются только page, ACTION и сам код
export function parseFormFields (html: string): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const tag of html.matchAll(/<input[^>]*>/gi)) {
    const attributes = parseAttributes(tag[0])
    if (attributes.name != null && attributes.name !== '') {
      fields[attributes.name] = attributes.value ?? ''
    }
  }
  return fields
}

// Грид с данными банк отдаёт при первой загрузке страницы, а на повторный
// запрос той же страницы возвращает одну форму с фильтром: обновлять данные
// он ждёт кнопкой View. Поэтому полученную страницу нужно донести до конца,
// а не запрашивать её второй раз
export function hasGrid (html: string): boolean {
  return html.includes('records:')
}

// Прежде чем отдать содержимое, банк требует подтвердить вход одноразовым кодом
export function isPinRequired (html: string): boolean {
  return html.includes('CONPASS_REQ')
}

// Повторяем SetPin() из js/bcmain.js: он лишь подменяет page и ACTION
// и отправляет форму. Код уходит как есть, никакого преобразования там нет
export async function fetchPinConfirmation (session: Session, html: string, pin: string): Promise<string> {
  const response = await postForm(session, {
    ...parseFormFields(html),
    page: 'AFTERLOGIN',
    ACTION: 'CHPASS',
    CONPASS_REQ: pin
  }, {
    sanitizeRequestLog: { body: true },
    sanitizeResponseLog: { body: true }
  }, 'param.php')
  return readHtml(response)
}

// Внутри банка содержимое грузится в iframe с param.php, а не отдельными
// страницами: адрес собирает mainpage() из скрытых полей формы Pages
export async function fetchContentPage (session: Session, context: SessionContext, page: string, isdoc = '0'): Promise<string> {
  const query = [
    `csrf_token=${encodeURIComponent(context.csrfToken)}`,
    `lang=${LANG_ENGLISH}`,
    `custid=${encodeURIComponent(context.custid)}`,
    `page=${encodeURIComponent(page)}`,
    `isdoc=${encodeURIComponent(isdoc)}`,
    // Банк сам добавляет метку времени, чтобы обойти кеш
    `tm=${Date.now()}`
  ].join('&')
  const response = await session.fetch(`${BASE_URL}/param.php?&${query}`, {
    method: 'GET',
    headers: { ...BROWSER_HEADERS, Referer: `${BASE_URL}/main.php` },
    // В ответе номера счетов и остатки
    sanitizeResponseLog: { body: true }
  })
  return readHtml(response)
}

export interface SessionContext {
  custid: string
  csrfToken: string
}

// Признак того, что вход состоялся: банк отдаёт форму Pages с номером клиента.
// Токен на этой странице свой и с токеном страницы входа не совпадает
export function parseSessionContext (html: string): SessionContext | null {
  const fields: Record<string, string> = {}
  for (const tag of html.matchAll(/<input[^>]*type="hidden"[^>]*>/gi)) {
    const attributes = parseAttributes(tag[0])
    if (attributes.name != null) {
      fields[attributes.name] = attributes.value ?? ''
    }
  }
  return fields.custid != null && fields.custid !== ''
    ? { custid: fields.custid, csrfToken: fields.csrf_token ?? '' }
    : null
}

// Выгрузки банк отдаёт отдельным окном через xml/xmlopen.php. Это единственный
// машинночитаемый выход: страницы отдают данные гридом внутри javascript
export async function fetchStatementXls (
  session: Session, context: SessionContext, uid: string,
  accountNumber: string, fromDate: string, toDate: string
): Promise<ArrayBuffer> {
  // Формат PARAM подсмотрен в вызове PopupXML на странице счетов:
  // '<PARAM>lang;custid;0;0;счёт;дата с;дата по;</PARAM>'
  const param = `<PARAM>${LANG_ENGLISH};${context.custid};0;0;${accountNumber};${fromDate};${toDate};</PARAM>`
  return await fetchExportXls(session, uid, 'STATEM_XLS', param)
}

export async function fetchExportXls (session: Session, uid: string, page: string, param: string): Promise<ArrayBuffer> {
  const query = [
    `page=${encodeURIComponent(page)}`,
    `uid=${encodeURIComponent(uid)}`,
    `lang=${LANG_ENGLISH}`,
    `PARAM=${encodeURIComponent(param)}`,
    `Temp=${Date.now()}`
  ].join('&')
  const response = await session.fetch(`${BASE_URL}/xml/xmlopen.php?${query}`, {
    method: 'GET',
    headers: { ...BROWSER_HEADERS, Referer: `${BASE_URL}/main.php` },
    binaryResponse: true,
    // В файле все операции по счёту
    sanitizeResponseLog: { body: true }
  })
  if (response.status < 200 || response.status >= 300) {
    // Банк отвечает на сбой обычной HTML-страницей, и в двоичном режиме она
    // тоже придёт ArrayBuffer'ом — разборщик таблиц молча вернёт ноль операций
    throw new TemporaryError('Банк не отдал выписку. Повторите синхронизацию.')
  }
  if (!(response.body instanceof ArrayBuffer)) {
    throw new TemporaryError('Банк не отдал файл выписки. Повторите синхронизацию позже.')
  }
  return response.body
}

// Идентификатор страницы выгрузки банк подставляет в каждый вызов PopupXML.
// Он свой у каждого раздела, поэтому читаем его со страницы, а не зашиваем
export function parseExportUid (html: string): string | null {
  const match = /PopupXML\(\s*"[^"]*"\s*,\s*(\d+)/.exec(html)
  return match != null ? match[1] : null
}

// Границы периода банк понимает по своему, ереванскому календарю, и это здесь
// уместно, в отличие от дат самих операций. Проверено во всех поясах от UTC+14
// до UTC-11: нижняя граница никогда не оказывается позже локального дня, то есть
// период может только расшириться, а верхняя совпадает с текущим днём Еревана —
// операций за день, который у банка ещё не наступил, не существует.
// Так же поступает idbank-am
export function formatBankDate (date: Date): string {
  const local = dateInTimezone(date, ARMENIA_TIMEZONE_OFFSET_MINUTES)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${pad(local.getDate())}/${pad(local.getMonth() + 1)}/${local.getFullYear()}`
}
