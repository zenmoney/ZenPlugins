import { InvalidOtpCodeError, TemporaryError, UserInteractionError } from '../../errors'
import {
  createSession,
  fetchAutoSubmit,
  fetchContentPage,
  fetchEnglishLoginPage,
  fetchLogin,
  fetchLoginPage,
  fetchPinConfirmation,
  hasGrid,
  isLoginForm,
  isPinRequired,
  parseAutoSubmitForm,
  parseCsrfToken,
  parseSessionContext,
  throwLoginError
} from './fetchApi'
import { Auth, AuthorizedSession, Preferences, Session, SignedIn } from './models'

export async function login (preferences: Preferences, isInBackground: boolean): Promise<SignedIn> {
  const reused = await reuseSession()
  if (reused == null && isInBackground && ZenMoney.getData(OTP_SEEN, true) !== false) {
    // Сессии нет, а банк при входе просит код из СМС. Спросить его в фоне не у
    // кого, поэтому выходим до отправки логина: иначе каждая фоновая попытка
    // тратила бы вход и слала пользователю бесполезную СМС, а за повторные
    // неудачные входы банк блокирует учётную запись. Пока неизвестно, просит
    // ли банк код у этого пользователя, считаем что просит
    throw new UserInteractionError()
  }
  const signedIn = reused ?? await signIn(preferences, isInBackground)

  // Страницу карт банк тоже отдаёт с данными лишь при первой загрузке, поэтому
  // берём её здесь и только потом запоминаем сессию: сохранись она раньше,
  // сбой на полпути оставил бы её стоять на accounts, и следующая
  // синхронизация приняла бы живую сессию за протухшую и пошла входить заново
  const cardsPage = await fetchContentPage(signedIn.session, signedIn.session.context, 'cards')
  rememberSession(signedIn.session)
  return { ...signedIn, cardsPage }
}

async function signIn (preferences: Preferences, isInBackground: boolean): Promise<Omit<SignedIn, 'cardsPage'>> {
  const session = createSession()
  // Форма приходит на армянском, а разбирать её надёжнее по английским подписям.
  // Смена языка — обычный POST на ту же страницу, но токен после неё уже другой
  session.csrfToken = parseCsrfToken(await fetchLoginPage(session))
  session.csrfToken = parseCsrfToken(await fetchEnglishLoginPage(session))

  const html = await fetchLogin(session, preferences)
  if (isLoginForm(html)) {
    throwLoginError(html)
  }

  // Банк вклинивает страницу, которая сама отправляет форму на main.php.
  // Браузер проходит её незаметно, нам нужно повторить это вручную
  const autoSubmit = parseAutoSubmitForm(html)
  const afterAutoSubmit = autoSubmit != null ? await fetchAutoSubmit(session, autoSubmit) : null

  // Форма Pages с номером клиента появляется только после успешного входа
  const context = afterAutoSubmit != null ? parseSessionContext(afterAutoSubmit) : null
  if (context == null) {
    throw new TemporaryError('Банк не открыл сессию. Повторите синхронизацию.')
  }

  // Меню банк рисует сразу, но за содержимым просит подтвердить вход кодом,
  // который прислал в СМС при вводе пароля
  let accountsPage = await fetchContentPage(session, context, 'accounts')
  // Второй фактор включён не у всех, а гадать об этом нельзя: ошибочный отказ
  // от фоновой синхронизации так же плох, как бесполезная СМС в фоне
  ZenMoney.setData(OTP_SEEN, isPinRequired(accountsPage))
  ZenMoney.saveData()
  if (isPinRequired(accountsPage)) {
    await confirmPin(session, accountsPage, isInBackground)
    // После подтверждения страница грузится впервые и приходит уже с данными
    accountsPage = await fetchContentPage(session, context, 'accounts')
  }

  const authorized: AuthorizedSession = { ...session, context }
  return { session: authorized, accountsPage }
}

// Просил ли банк код при последнем полноценном входе
const OTP_SEEN = 'otpRequired'

// Интернет-банк выкидывает сессию примерно через 40 минут простоя, но пока она
// жива, повторный вход и код не нужны. Тот же приём использует inecobank-am
async function reuseSession (): Promise<Omit<SignedIn, 'cardsPage'> | null> {
  const auth = ZenMoney.getData('auth') as Auth | undefined
  if (auth?.cookies == null || auth.context == null) {
    return null
  }
  const session: AuthorizedSession = { ...createSession(auth.cookies), context: auth.context }
  const page = await fetchContentPage(session, auth.context, 'accounts')
  // Проверяем положительно: страница должна нести форму Pages с номером клиента
  // и не просить код. Считать живой всякую неузнанную страницу нельзя — банк
  // отвечает на протухшую сессию по-разному, и тогда дальше поедет пустота
  if (parseSessionContext(page) == null || isPinRequired(page) || !hasGrid(page)) {
    return null
  }
  return { session, accountsPage: page }
}

function rememberSession (session: AuthorizedSession): void {
  ZenMoney.setData('auth', { cookies: session.getCookies(), context: session.context })
  ZenMoney.saveData()
}

// Письмо доходит медленнее СМС, поэтому ждём ввода долго
const USER_INPUT_TIMEOUT_MS = 180000

async function confirmPin (session: Session, html: string, isInBackground: boolean): Promise<void> {
  if (isInBackground) {
    // Ввод кода спросить не у кого, а без него банк не отдаёт ни одной страницы
    throw new UserInteractionError()
  }
  const code = await ZenMoney.readLine('Введите код, который Арцахбанк прислал в СМС', {
    inputType: 'number',
    time: USER_INPUT_TIMEOUT_MS
  })
  if (code == null || code.trim() === '') {
    throw new InvalidOtpCodeError()
  }
  const confirmed = await fetchPinConfirmation(session, html, code.trim())
  if (isPinRequired(confirmed)) {
    throw new InvalidOtpCodeError()
  }
}
