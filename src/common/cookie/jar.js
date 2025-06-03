import { parse as parseCookieString } from 'set-cookie-parser'

export class SimpleCookieJar {
  constructor () {
    this.cookies = {}
  }

  getCookieString (currentUrl) {
    return Object.entries(this.cookies).map(([key, value]) => `${key}=${value}`).join('; ')
  }

  setCookie (cookieString, currentUrl, opts) {
    let cookie = parseCookieString(cookieString)[0]
    if (this.validator) {
      const result = this.validator(cookie)
      if (result.isValid) {
        cookie = result.cookie
      } else {
        return
      }
    }
    this.cookies[cookie.name] = cookie.value
  }

  setValidator (validator) {
    this.validator = validator
  }

  clear () {
    this.cookies = {}
  }
}
