import type { CookieJar } from 'fetch-cookie'
import type { Cookie } from 'set-cookie-parser'

export declare class SimpleCookieJar implements CookieJar {
  constructor ()
  getCookieString: CookieJar['getCookieString']
  setCookie: CookieJar['setCookie']
  setValidator (validator: SetCookieValidator): void
}

export declare type SetCookieValidator = (cookie: Cookie) => { isValid: boolean, cookie: Cookie }
