export default function XMLHttpRequestViaZenAPI () {
  this._request = null
  this._requestHeaders = {}
  this.readyState = XMLHttpRequestViaZenAPI.UNSENT
}

XMLHttpRequestViaZenAPI.UNSENT = 0
XMLHttpRequestViaZenAPI.OPENED = 1
XMLHttpRequestViaZenAPI.HEADERS_RECEIVED = 2
XMLHttpRequestViaZenAPI.LOADING = 3
XMLHttpRequestViaZenAPI.DONE = 4

XMLHttpRequestViaZenAPI.prototype.abort = function () {
  throw new Error('Not implemented')
}

XMLHttpRequestViaZenAPI.prototype.getAllResponseHeaders = function () {
  throw new Error('Response headers are not available')
}

XMLHttpRequestViaZenAPI.prototype.getResponseHeader = function (name) {
  throw new Error('Not implemented')
}

XMLHttpRequestViaZenAPI.prototype.open = function open (method, url, async = true) {
  if (arguments.length > 3) {
    throw new Error('username/password are not implemented')
  }
  if (this.readyState !== XMLHttpRequestViaZenAPI.UNSENT) {
    throw new Error('Request already opened')
  }
  this._request = { method, url, async }
  this.readyState = XMLHttpRequestViaZenAPI.OPENED
}

XMLHttpRequestViaZenAPI.prototype.overrideMimeType = function () {
  throw new Error('Not implemented')
}

XMLHttpRequestViaZenAPI.prototype.send = function (body) {
  if (this.readyState !== XMLHttpRequestViaZenAPI.OPENED) {
    throw new Error('Request should be opened before sending')
  }

  const headers = this._requestHeaders
  const { method, url } = this._request

  this.readyState = XMLHttpRequestViaZenAPI.LOADING

  let options = null
  if (this.responseType === 'arraybuffer' && ZenMoney.features && ZenMoney.features.binaryResponseBody) {
    options = { binaryResponse: true }
  }
  if ((this.redirect || 'follow') !== 'follow') {
    options = { ...options, manualRedirect: true }
  }
  if (this.pfx) {
    options = { ...options, pfx: this.pfx }
  }
  const callback = (err, responseBody) => onResponse.call(this, err, responseBody, Boolean(options && options.binaryResponse))
  const async = Boolean(ZenMoney.features && ZenMoney.features.networkCallbacks) && this._request.async
  if (async) {
    options = { ...options, callback: ({ error, content }) => callback(error, content) }
  }
  try {
    const responseBody = !method || method.toUpperCase() === 'GET'
      ? ZenMoney.requestGet(url, headers, options)
      : ZenMoney.request(method, url, body, headers, options)
    if (!async) {
      callback(null, responseBody)
    }
  } catch (e) {
    callback(e)
  }
}

function onResponse (err, responseBody, isBinaryBody) {
  if (err) {
    this.onerror(err)
    return
  }

  if (isBinaryBody && responseBody && typeof responseBody !== 'string') {
    if ('buffer' in responseBody) {
      this.response = responseBody.buffer
    } else {
      this.response = responseBody
    }
  } else {
    this.responseText = responseBody
  }

  this.responseURL = ZenMoney.getLastUrl()
  this.status = ZenMoney.getLastStatusCode();
  [, this.statusText] = ZenMoney.getLastStatusString().match(/^HTTP\/1.1 \d+ (.*)$/)
  const zenResponseHeaders = ZenMoney.getLastResponseHeaders()
  const xhrResponseHeaders = zenResponseHeaders
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n') + '\n'
  this.getAllResponseHeaders = function () {
    return xhrResponseHeaders
  }
  this.readyState = XMLHttpRequestViaZenAPI.DONE

  this.onload()
}

XMLHttpRequestViaZenAPI.prototype.setRequestHeader = function (key, value) {
  if (this.readyState > XMLHttpRequestViaZenAPI.OPENED) {
    throw new Error('Request already sent')
  }
  if (!key) {
    throw new Error('Header key should be truthy')
  }
  if (!value && value !== '') {
    throw new Error('Header value should be truthy ' + key)
  }
  this._requestHeaders[key] = value
}
