const {
  readPluginManifest,
  readPluginPreferencesSchema,
  addCookies,
  serializeErrors,
  ensureFileExists,
  readJsonSync,
  readPluginFileSync,
  isWebSocketHeader,
  convertErrorToSerializable
} = require('./../utils')
const _ = require('lodash')
const bodyParser = require('body-parser')
const fs = require('fs')
const {
  PROXY_TARGET_HEADER,
  getTargetUrl,
  TRANSFERABLE_HEADER_PREFIX,
  MANUAL_REDIRECT_HEADER
} = require('../../src/shared')
const { URL } = require('url')
const { v4: uuid } = require('uuid')

function setupWebServer ({ app, proxy, state, pluginPaths }) {
  app.get(
    '/zen/manifest',
    serializeErrors((req, res) => {
      state.cookies = []
      res.set('Content-Type', 'text/xml')
      const manifest = readPluginManifest(pluginPaths.manifest)
      for (const requiredProp of ['id', 'build', 'files', 'version', 'preferences']) {
        if (!manifest[requiredProp]) {
          throw new Error(`Wrong ZenmoneyManifest.xml: ${requiredProp} prop should be set`)
        }
      }
      res.json(manifest)
    })
  )

  app.get(
    '/zen/zp_preferences.json/schema',
    serializeErrors((req, res) => {
      res.json(readPluginPreferencesSchema(pluginPaths.preferencesSchema))
    })
  )

  app.get(
    '/zen/zp_preferences.json',
    serializeErrors((req, res) => {
      ensureFileExists(pluginPaths.preferences, '{}\n')
      const preferences = _.omit(readJsonSync(pluginPaths.preferences), ['zp_plugin_directory', 'zp_pipe'])
      res.json(preferences)
    })
  )

  app.post(
    '/zen/zp_preferences.json',
    bodyParser.json(),
    serializeErrors((req, res) => {
      fs.writeFileSync(pluginPaths.preferences, JSON.stringify(req.body, null, 4), 'utf8')
      return res.json(true)
    })
  )

  app.get(
    '/zen/zp_data.json',
    serializeErrors((req, res) => {
      ensureFileExists(pluginPaths.data, '{}\n')
      const data = readJsonSync(pluginPaths.data)
      return res.json(data)
    })
  )

  app.post(
    '/zen/zp_data.json',
    bodyParser.json(),
    serializeErrors((req, res) => {
      console.assert(req.body.newValue, 'newValue should be provided')
      fs.writeFileSync(pluginPaths.data, JSON.stringify(req.body.newValue, null, 4), 'utf8')
      return res.json(true)
    })
  )

  app.get(
    '/zen/zp_pipe.txt',
    serializeErrors((req, res) => {
      res.set('Content-Type', 'text/plain')
      ensureFileExists(pluginPaths.code, '')
      const content = readPluginFileSync(pluginPaths.code)
      res.send(content.replace(/\n$/, ''))
    })
  )

  app.post(
    '/zen/zp_cookies.json',
    bodyParser.text({ type: 'application/json' }),
    serializeErrors((req, res) => {
      fs.writeFileSync(pluginPaths.cookies, JSON.stringify(state.cookies), 'utf8')
      return res.json(true)
    })
  )

  app.get(
    '/zen/zp_cookies.json',
    serializeErrors((req, res) => {
      res.set('Content-Type', 'application/json;charset=utf8')
      ensureFileExists(pluginPaths.cookies, '')
      const content = readPluginFileSync(pluginPaths.cookies)
      state.cookies = content ? JSON.parse(content) : []
      res.send(state.cookies)
    })
  )

  app.post(
    '/zen/cookies',
    bodyParser.text({ type: 'application/json' }),
    serializeErrors((req, res) => {
      state.cookies = addCookies(req.body, state.cookies)
      return res.json(true)
    })
  )

  app.get(
    '/zen/cookies',
    serializeErrors((req, res) => {
      res.set('Content-Type', 'application/json;charset=utf8')
      res.send(state.cookies)
    })
  )

  app.post(
    '/zen/ws',
    bodyParser.json(),
    serializeErrors((req, res) => {
      const id = uuid().toString().replace(/-/g, '').toLowerCase().substring(0, 16)
      state.wsOptions[id] = req.body
      res.json({ id })
    })
  )

  app.get(
    '/zen/ws/:id',
    (req, res) => {
      const id = req.params.id
      const result = state.wsResponseResults[id]
      delete state.wsResponseResults[id]
      if (result) {
        const [err, response] = result
        if (response) {
          res.json(response)
        } else {
          res.status(502).json(convertErrorToSerializable(err))
        }
      } else {
        res.status(500).json(convertErrorToSerializable(new Error('Could not found WebSocket response')))
      }
    }
  )

  app.on('upgradeRequest', (req, socket, head) => {
    const i = req.url.indexOf(PROXY_TARGET_HEADER)
    const id = i >= 0 ? req.url.substring(i + PROXY_TARGET_HEADER.length + 1) : null
    const options = id ? state.wsOptions[id] : null
    if (!options) {
      socket.destroy()
      return
    }
    delete state.wsOptions[id]
    const headers = {}
    if (req.rawHeaders) {
      for (let i = 0; i < req.rawHeaders.length; i += 2) {
        const key = req.rawHeaders[i].toLowerCase()
        const value = req.rawHeaders[i + 1]
        if (isWebSocketHeader(key) || key === 'cookie') {
          headers[key] = value
        }
      }
    }
    if (options.headers) {
      _.forOwn(options.headers, (value, header) => {
        const key = header.toLowerCase()
        if (!isWebSocketHeader(key)) {
          headers[key] = value
        }
      })
    }
    const {
      host,
      origin,
      pathname,
      search
    } = new URL(options.url)
    const url = `${/^https|wss/.test(options.url) ? 'https' : 'http'}://${host}${pathname}${search}`
    req.url = pathname + search
    req.headers = headers
    req._zpWsOptions = {
      id,
      url
    }
    proxy.ws(req, socket, head, {
      target: origin,
      preserveHeaderKeyCase: true,
      secure: false
    })
  })

  app.all('*', (req, res, next) => {
    const target = getTargetUrl(req.url, req.headers[PROXY_TARGET_HEADER])
    if (!target) {
      next()
      return
    }

    if (req.rawHeaders) {
      const headers = {}
      const isCookieSetExplicitly = Boolean(req.headers[TRANSFERABLE_HEADER_PREFIX + 'cookie'])
      if (req.headers[MANUAL_REDIRECT_HEADER]) {
        req._zpManualRedirect = true
      }
      for (let i = 0; i < req.rawHeaders.length; i += 2) {
        let header = req.rawHeaders[i]
        const key = header.toLowerCase().trim()
        if (key === 'content-length' || (key === 'cookie' && !isCookieSetExplicitly)) {
          // forward header value as it is
        } else if ([PROXY_TARGET_HEADER, MANUAL_REDIRECT_HEADER].indexOf(key) >= 0 || !key.startsWith(TRANSFERABLE_HEADER_PREFIX)) {
          continue
        } else {
          header = header.slice(TRANSFERABLE_HEADER_PREFIX.length)
        }
        const value = req.rawHeaders[i + 1]
        if (headers[header]) {
          headers[header] += ',' + value
        } else {
          headers[header] = value
        }
      }
      req.headers = headers
    } else {
      req.headers = {}
    }

    proxy.web(req, res, {
      target,
      agent: /^https/.test(target) ? require('https').globalAgent : require('http').globalAgent,
      changeOrigin: false,
      preserveHeaderKeyCase: true,
      ignorePath: true,
      secure: false,
      xfwd: false
    })
  })
}

module.exports = {
  setupWebServer
}
