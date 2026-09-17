import { FetchFunc } from '../../common/network'
import { AccountOrCard } from '../../types/zenmoney'

// Поля из preferences.xml
export interface Preferences {
  login: string
  password: string
  // Способ доставки одноразового кода, значение из secur_kind на login.php.
  // Необязательное: браузерный отладочный сервер читает из preferences.xml
  // только EditTextPreference и списки не отдаёт, поэтому в разработке его нет
  otpChannel?: string
}

// Способы второго фактора, которые интернет-банк предлагает в secur_kind.
// Файл-ключ (1) требует загрузить файл, поэтому здесь его нет
export const OTP_CHANNEL = {
  sms: '3',
  email: '5'
} as const

// Живёт только внутри одной синхронизации: интернет-банк держит сессию
// в cookie bcsession и выкидывает её через 40 минут (meta refresh на login.php)
export interface Session {
  // fetch с общей банкой cookie, иначе банк не узнаёт сессию между запросами
  fetch: FetchFunc
  // Токен меняется на каждой отданной странице, поэтому его несём с собой
  csrfToken: string
  // Текущие cookie банка, чтобы донести сессию до следующей синхронизации
  getCookies: () => Record<string, string>
}

export interface SessionContext {
  custid: string
  csrfToken: string
}

// Сессия, про которую уже известно, что вход состоялся
export interface AuthorizedSession extends Session {
  context: SessionContext
}

// Хранится между синхронизациями: пока банк помнит сессию,
// одноразовый код спрашивать не нужно
export interface Auth {
  cookies: Record<string, string>
  context: { custid: string, csrfToken: string }
}

export interface ConvertResult {
  // Номер, по которому запрашивается выписка
  accountNumber: string
  account: AccountOrCard
}

// Страница счетов приходит уже при входе, и запрашивать её второй раз нельзя:
// банк отдаёт грид только при первой загрузке
export interface SignedIn {
  session: AuthorizedSession
  accountsPage: string
  cardsPage: string
}
