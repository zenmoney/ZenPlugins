import { CookieJar } from 'fetch-cookie'
import { Cookie } from 'set-cookie-parser'

export declare class SimpleCookieJar implements CookieJar {
  constructor ()
  getCookieString (currentUrl: string): Promise<string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setCookie (cookieString: string, currentUrl: string, opts: { ignoreError: boolean }): Promise<any>
  setValidator (validator: SetCookieValidator): void
}

export declare type SetCookieValidator = (cookie: Cookie) => { isValid: boolean, cookie: Cookie }
