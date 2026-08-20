const bodyParser = require('body-parser')
const path = require('path')
const { readPluginManifest } = require('../utils')
const { loadDebugConfig } = require('./config')
const { SessionStore } = require('./sessionStore')

const BOOTLOADER_PORT = 5050

function serializeError (error) {
  return {
    name: error.name || 'Error',
    message: error.message || String(error),
    stack: error.stack || null
  }
}

function asyncRoute (handler) {
  return (req, res) => Promise.resolve(handler(req, res)).catch(error => {
    console.error(error)
    res.status(500).json({ error: serializeError(error) })
  })
}

function formatLogEvent (event) {
  const prefix = `[${event.timestamp}] [${event.type}]`
  const payload = event.payload || {}
  if (event.type === 'console') {
    return `${prefix} [${payload.level || 'log'}] ${(payload.args || []).map(value => typeof value === 'string' ? value : JSON.stringify(value)).join(' ')}`
  }
  if (event.type === 'error') {
    return `${prefix} ${payload.name || 'Error'}: ${payload.message || ''}${payload.stack ? `\n${payload.stack}` : ''}`
  }
  return `${prefix} ${JSON.stringify(payload)}`
}

function setupBootloaderServer ({ app, pluginPaths, storageDirectory }) {
  const manifest = readPluginManifest(pluginPaths.manifest)
  const plugin = {
    id: manifest.id,
    version: manifest.version,
    build: Number(manifest.build)
  }
  const debugConfig = loadDebugConfig(pluginPaths)
  const store = new SessionStore({
    plugin,
    storageDirectory: path.join(storageDirectory, plugin.id),
    persist: debugConfig.bootloader.sessions.persist,
    limit: debugConfig.bootloader.sessions.limit
  })

  app.get('/api/v2/health', (req, res) => {
    res.set('Cache-Control', 'no-store')
    res.json({
      name: 'zenmoney-bootloader',
      protocolVersion: 2,
      pid: process.pid,
      plugin
    })
  })

  app.post('/api/v2/sessions', bodyParser.json({ limit: '256kb' }), asyncRoute((req, res) => {
    const scrapeConfig = loadDebugConfig(pluginPaths)
    store.configure(scrapeConfig.bootloader.sessions)
    const session = store.create(
      req.body || {},
      scrapeConfig.bootloader.overrideData ? scrapeConfig.data : {}
    )
    const serverUrl = `${req.protocol}://${req.get('host')}`
    res.status(201).json({
      protocolVersion: 2,
      sessionId: session.id,
      serverUrl,
      scriptUrl: `${serverUrl}/index.js`,
      plugin,
      preferences: scrapeConfig.preferences,
      data: scrapeConfig.data,
      config: scrapeConfig.bootloader
    })
  }))

  app.get('/api/v2/sessions', (req, res) => {
    res.set('Cache-Control', 'no-store')
    res.json(store.list())
  })

  app.get('/api/v2/sessions/:id', (req, res) => {
    const session = store.get(req.params.id)
    if (!session) {
      return res.status(404).json({ error: { message: 'Session not found' } })
    }
    res.set('Cache-Control', 'no-store')
    res.json(session)
  })

  app.post('/api/v2/sessions/:id/events', bodyParser.json({ limit: '2mb' }), (req, res) => {
    const events = Array.isArray(req.body) ? req.body : req.body && req.body.events
    if (!Array.isArray(events)) {
      return res.status(400).json({ error: { message: 'events must be an array' } })
    }
    const result = store.addEvents(req.params.id, events)
    if (!result) {
      return res.status(404).json({ error: { message: 'Session not found' } })
    }
    res.json(result)
  })

  app.get('/api/v2/sessions/:id/events', (req, res) => {
    const session = store.get(req.params.id)
    if (!session) {
      return res.status(404).json({ error: { message: 'Session not found' } })
    }
    const after = Number(req.query.after) || 0
    res.set('Cache-Control', 'no-store')
    res.json(session.events.filter(event => event.sequence > after))
  })

  app.get('/api/v2/sessions/:id/stream', (req, res) => {
    const session = store.get(req.params.id)
    if (!session) {
      return res.status(404).end()
    }
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    })
    res.write(': connected\n\n')
    const unsubscribe = store.subscribe(req.params.id, event => {
      res.write(`id: ${event.sequence}\n`)
      res.write(`data: ${JSON.stringify(event)}\n\n`)
    })
    const keepAlive = setInterval(() => res.write(': keep-alive\n\n'), 15000)
    req.on('close', () => {
      clearInterval(keepAlive)
      unsubscribe()
    })
  })

  app.get('/api/v2/sessions/:id/export', (req, res) => {
    const session = store.get(req.params.id)
    if (!session) {
      return res.status(404).json({ error: { message: 'Session not found' } })
    }
    const filename = `${session.plugin.id}-${session.id}.log`
    const header = [
      `plugin=${session.plugin.id}@${session.plugin.version} (${session.plugin.build})`,
      `session=${session.id}`,
      `created=${session.createdAt}`,
      `status=${session.status}`,
      ''
    ].join('\n')
    const body = session.events.map(formatLogEvent).join('\n')
    res.set('Content-Type', 'text/plain; charset=utf-8')
    res.set('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(header + body + '\n')
  })

  return {
    plugin,
    store,
    config: debugConfig
  }
}

module.exports = {
  BOOTLOADER_PORT,
  setupBootloaderServer
}
