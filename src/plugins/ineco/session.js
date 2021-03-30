import { stringify } from 'querystring'
import * as setCookie from 'set-cookie-parser'
import { fetch } from '../../common/network'

/**
 * Session is used for auto storing cookies within all requests
 * It also provide simple interfaces for major request types
 */
export class Session {
  _domain;
  _cookies = {};
  _headers = {};

  constructor (domain, { headers, cookies } = {}) {
    this._domain = domain
    this._headers = headers || {}
    this._cookies = cookies || {}
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

    let body = response.body

    if (response.headers['content-disposition'] && response.headers['content-disposition'].substr(0, 11) === 'attachment;') {
      /* for some reasons on mobile devices posting form for a file gives unexpected '\u0000'
       * after every body char in response. deleting them
       */
      body = body.replace(/\\u0000/g, '')
    }

    return body
  }
}
