const fs = require('fs')
const path = require('path')
const { v4: uuid } = require('uuid')

function clone (value) {
  return JSON.parse(JSON.stringify(value))
}

function makeEmptyState (initialData = {}) {
  return {
    initial: clone(initialData),
    current: clone(initialData),
    saved: null,
    reads: [],
    changes: []
  }
}

class SessionStore {
  constructor ({ plugin, storageDirectory, persist, limit }) {
    this.plugin = plugin
    this.storageDirectory = storageDirectory
    this.persist = persist
    this.limit = limit
    this.sessions = []
    this.listeners = new Map()
    if (this.persist) {
      fs.mkdirSync(this.storageDirectory, { recursive: true })
      this.load()
    }
  }

  load () {
    const filenames = fs.readdirSync(this.storageDirectory)
      .filter(filename => filename.endsWith('.json'))
    for (const filename of filenames) {
      try {
        const session = JSON.parse(fs.readFileSync(path.join(this.storageDirectory, filename), 'utf8'))
        if (session && session.id && Array.isArray(session.events)) {
          this.sessions.push(session)
        }
      } catch (error) {
        console.warn(`Could not restore bootloader session ${filename}: ${error.message}`)
      }
    }
    this.sessions.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    this.trim()
  }

  configure ({ persist, limit }) {
    const persistenceEnabled = persist !== false
    const enablingPersistence = !this.persist && persistenceEnabled
    this.persist = persistenceEnabled
    this.limit = Math.max(1, Number(limit) || this.limit)
    if (this.persist) {
      fs.mkdirSync(this.storageDirectory, { recursive: true })
      if (enablingPersistence) {
        for (const session of this.sessions) this.save(session)
      }
    }
    this.trim()
  }

  create (client = {}, initialData = {}) {
    const now = new Date().toISOString()
    const session = {
      id: uuid(),
      plugin: this.plugin,
      client,
      createdAt: now,
      updatedAt: now,
      status: 'running',
      nextSequence: 1,
      events: [],
      accounts: [],
      transactions: [],
      state: makeEmptyState(initialData),
      checkpoints: {},
      result: null
    }
    this.sessions.push(session)
    this.trim()
    this.save(session)
    return this.get(session.id)
  }

  list () {
    return this.sessions.slice().reverse().map(session => ({
      id: session.id,
      plugin: session.plugin,
      client: session.client,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      status: session.status,
      accountsCount: session.accounts.length,
      transactionsCount: session.transactions.length,
      eventsCount: session.events.length
    }))
  }

  getRaw (id) {
    return this.sessions.find(session => session.id === id) || null
  }

  get (id) {
    const session = this.getRaw(id)
    if (!session) {
      return null
    }
    const result = clone(session)
    result.checkpointComparisons = this.getCheckpointComparisons(session)
    return result
  }

  addEvents (id, incomingEvents) {
    const session = this.getRaw(id)
    if (!session) {
      return null
    }
    const accepted = []
    for (const incomingEvent of incomingEvents) {
      if (!incomingEvent || typeof incomingEvent.type !== 'string') {
        continue
      }
      const event = {
        sequence: session.nextSequence++,
        timestamp: incomingEvent.timestamp || new Date().toISOString(),
        type: incomingEvent.type,
        payload: incomingEvent.payload === undefined ? null : incomingEvent.payload
      }
      session.events.push(event)
      accepted.push(event)
      this.applyEvent(session, event)
    }
    session.updatedAt = new Date().toISOString()
    this.save(session)
    for (const event of accepted) {
      this.publish(id, event)
    }
    return {
      accepted: accepted.length,
      lastSequence: accepted.length > 0 ? accepted[accepted.length - 1].sequence : session.nextSequence - 1
    }
  }

  applyEvent (session, event) {
    const payload = event.payload || {}
    switch (event.type) {
      case 'accounts:add':
        session.accounts.push(...(Array.isArray(payload.items) ? payload.items : []))
        break
      case 'transactions:add':
        session.transactions.push(...(Array.isArray(payload.items) ? payload.items : []))
        break
      case 'state:get':
        if (!Object.prototype.hasOwnProperty.call(session.state.initial, payload.key)) {
          session.state.initial[payload.key] = payload.value
          session.state.current[payload.key] = payload.value
        }
        session.state.reads.push({ key: payload.key, value: payload.value, timestamp: event.timestamp })
        break
      case 'state:set':
        session.state.current[payload.key] = payload.value
        session.state.changes.push({ operation: 'set', key: payload.key, value: payload.value, timestamp: event.timestamp })
        break
      case 'state:clear':
        session.state.current = {}
        session.state.changes.push({ operation: 'clear', timestamp: event.timestamp })
        break
      case 'state:save':
        session.state.saved = clone(session.state.current)
        break
      case 'checkpoint':
        session.checkpoints[payload.name] = {
          value: payload.value,
          timestamp: event.timestamp
        }
        break
      case 'session:result':
        session.result = payload
        session.status = payload && payload.success ? 'success' : 'error'
        break
      case 'error':
        if (payload && payload.unhandled) {
          session.status = 'error'
        }
        break
    }
  }

  getCheckpointComparisons (session) {
    const sessionIndex = this.sessions.indexOf(session)
    const previousSessions = this.sessions.slice(0, sessionIndex).reverse()
    const result = {}
    for (const [name, checkpoint] of Object.entries(session.checkpoints)) {
      const previous = previousSessions.find(item => item.checkpoints && item.checkpoints[name])
      result[name] = {
        current: checkpoint.value,
        previous: previous ? previous.checkpoints[name].value : null,
        previousSessionId: previous ? previous.id : null
      }
    }
    return result
  }

  subscribe (id, listener) {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, new Set())
    }
    this.listeners.get(id).add(listener)
    return () => {
      const listeners = this.listeners.get(id)
      if (listeners) {
        listeners.delete(listener)
      }
    }
  }

  publish (id, event) {
    for (const listener of this.listeners.get(id) || []) {
      listener(event)
    }
  }

  save (session) {
    if (!this.persist) {
      return
    }
    fs.writeFileSync(path.join(this.storageDirectory, `${session.id}.json`), JSON.stringify(session), 'utf8')
  }

  trim () {
    while (this.sessions.length > this.limit) {
      const removed = this.sessions.shift()
      this.listeners.delete(removed.id)
      if (this.persist) {
        const filename = path.join(this.storageDirectory, `${removed.id}.json`)
        try {
          fs.unlinkSync(filename)
        } catch (error) {
          if (error.code !== 'ENOENT') {
            console.warn(`Could not remove old bootloader session ${filename}: ${error.message}`)
          }
        }
      }
    }
  }
}

module.exports = { SessionStore }
