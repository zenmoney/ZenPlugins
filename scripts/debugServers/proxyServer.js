const httpProxy = require('http-proxy')
const _ = require('lodash')
const { TRANSFERABLE_HEADER_PREFIX, PROXY_TARGET_HEADER, MANUAL_REDIRECT_HEADER } = require('../../src/shared')
const { URL } = require('url')
const { addCookies, parseCookies, makeCookieAccessibleToClientSide, convertErrorToSerializable } = require('./../utils')

function setupProxyServer (state) {
  // eslint-disable-next-line new-cap
  const proxy = new httpProxy.createProxyServer()
  proxy.on('proxyRes', (proxyRes, req, res) => {
    if (proxyRes.headers['set-cookie']) {
      const now = new Date()
      for (const cookieStr of proxyRes.headers['set-cookie']) {
        state.cookies = addCookies(parseCookies(cookieStr, now), state.cookies)
      }
      proxyRes.headers[TRANSFERABLE_HEADER_PREFIX + 'set-cookie'] = proxyRes.headers['set-cookie']
      proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map(makeCookieAccessibleToClientSide)
    }
    const location = proxyRes.headers.location
    if (req._zpManualRedirect && [301, 302, 303, 307, 308].indexOf(proxyRes.statusCode) >= 0) {
      proxyRes.headers[MANUAL_REDIRECT_HEADER] = `${proxyRes.statusCode} ${proxyRes.statusMessage}`
      proxyRes.statusCode = 200
      proxyRes.statusMessage = 'OK'
    } else if (location && /^https?:\/\//i.test(location)) {
      const { origin, pathname, search } = new URL(location)
      proxyRes.headers.location = pathname + search +
        ((search === '') ? '?' : '&') + PROXY_TARGET_HEADER + '=' + origin
    }
    proxyRes.headers = _.mapValues(proxyRes.headers, value => {
      if (_.isArray(value)) {
        return value.map(value => value.replace(/[^\t\x20-\x7e\x80-\xff]/g, ''))
      } else if (_.isString(value)) {
        return value.replace(/[^\t\x20-\x7e\x80-\xff]/g, '')
      } else {
        throw new Error('unexpected header value type')
      }
    })
  })

  proxy.on('error', (err, req, res) => {
    if (typeof res.status === 'function') {
      res.status(502).json(convertErrorToSerializable(err))
    } else if (req._zpWsOptions) {
      state.wsResponseResults[req._zpWsOptions.id] = [err, null]
    }
  })
  const cacheWebSocketResponse = (req, res) => {
    const { id, url } = req._zpWsOptions
    state.wsResponseResults[id] = res.upgrade
      ? [
          null,
          {
            url,
            protocol: `HTTP/${res.httpVersion}`,
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            body: null
          }
        ]
      : [
          new Error('non-upgrade response is not supported yet'),
          null
        ]
  }
  proxy.on('proxyReqWs', (proxyReq, req) => {
    proxyReq.on('response', (res) => {
      if (res.upgrade) {
        return
      }
      cacheWebSocketResponse(req, res)
    })
    proxyReq.on('upgrade', (res) => {
      if (!res.headers['sec-websocket-protocol'] && req.headers['sec-websocket-protocol'] === 'null') {
        res.headers['sec-websocket-protocol'] = 'null'
      }
      cacheWebSocketResponse(req, res)
    })
  })

  return proxy
}

module.exports = {
  setupProxyServer
}
