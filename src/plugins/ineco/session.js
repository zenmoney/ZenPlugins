import { stringify } from 'querystring'
import * as setCookie from 'set-cookie-parser'
import { fetch } from '../../common/network'

function arrayBufferToString (buffer) {
  let binaryString = ''
  const bytes = new Uint16Array(buffer)
  const length = bytes.length

  for (let i = 0; i < length; i++) {
    binaryString += String.fromCharCode(bytes[i])
  }

  return binaryString
}

/**
 * Session is used for auto storing cookies within all requests
 * It also provide simple interfaces for major request types
 */
export class Session {
  _domain;
  _cookies = {};
  _headers = {};
  _cookieKey;

  constructor (domain, { headers, cookies, cookieKey } = {}) {
    this._domain = domain
    this._headers = headers || {}
    this._cookies = cookies || {}

    if (cookieKey) {
      this._cookieKey = 'scrape/' + cookieKey

      const stored = ZenMoney.getData(this._cookieKey)

      console.log('got key from storage', this._cookieKey, stored)

      if (stored) {
        try {
          this._cookies = {
            ...JSON.parse(stored),
            ...this._cookies
          }
        } catch {
          console.log('error parsing stored key', stored)
        }
      }
    }
  }

  async get (url, options = {}) {
    const response = await fetch(this._url(url), {
      method: 'GET',
      redirect: options.redirect || 'manual',
      headers: this._prepareHeaders()
    })

    this._storeCookies(response)

    return this._returnResponseBody(response)
  }

  async postForm (url, data = {}) {
    const response = await fetch(this._url(url), {
      method: 'POST',
      redirect: 'manual',
      stringify: stringify,
      headers: this._prepareHeaders({
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        'Accept-Charset': 'utf-8;'
      }),
      body: data
    })

    this._storeCookies(response)

    return this._returnResponseBody(response)
  }

  async postFormBinary (url, data = {}) {
    const response = await fetch(this._url(url), {
      method: 'POST',
      redirect: 'manual',
      stringify: stringify,
      headers: this._prepareHeaders({
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        'Accept-Charset': 'utf-8;'
      }),
      body: data,
      binaryResponse: true
    })

    this._storeCookies(response)

    return arrayBufferToString(response.body)
  }

  async request (url, options = {}) {
    const response = await fetch(this._url(url), options)

    this._storeCookies(response)

    return response
  }

  _storeCookies (response) {
    const setCookieString = response?.headers['set-cookie']

    if (!setCookieString) {
      return
    }

    const cookies = setCookie.parse(setCookie.splitCookiesString(setCookieString))

    for (const cookie of cookies) {
      this._cookies[cookie.name] = cookie.value
    }

    if (this._cookieKey) {
      ZenMoney.setData(this._cookieKey, JSON.stringify(this._cookies))
      ZenMoney.saveData()
    }
  }

  _prepareHeaders (headers) {
    return {
      ...this._headers,
      ...this._prepareCookiesHeader(),
      ...headers
    }
  }

  _prepareCookiesHeader () {
    let cookiesString = ''
    for (const name in this._cookies) {
      const value = this._cookies[name]
      if (cookiesString) {
        cookiesString += '; '
      }
      cookiesString += name + '=' + value
    }
    return cookiesString ? { Cookie: cookiesString } : {}
  }

  _url (url) {
    return url && url[0] === '/' ? this._domain + url : url
  }

  _returnResponseBody (response) {
    if (response.status >= 300 && response.status < 400) {
      return this.get(response.headers.location.replace(this._domain, ''))
    }

    return response.body
  }
}
