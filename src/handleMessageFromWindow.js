import { ZPAPI } from './ZPAPI'

function toSerializableError (error) {
  if (error == null) {
    return {
      name: 'Error',
      message: 'Unknown error',
      fatal: false,
      allowRetry: false,
      allow_retry: false
    }
  }

  const seen = new WeakSet()
  const sanitize = (value) => {
    if (value == null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value
    }
    if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint') {
      return undefined
    }
    if (Array.isArray(value)) {
      return value.map(sanitize)
    }
    if (typeof value === 'object') {
      if (seen.has(value)) {
        return '[Circular]'
      }
      seen.add(value)
      const out = {}
      for (const [key, nested] of Object.entries(value)) {
        const clean = sanitize(nested)
        if (clean !== undefined) {
          out[key] = clean
        }
      }
      return out
    }
    return undefined
  }

  const payload = sanitize(error)
  const result = typeof payload === 'object' && payload != null ? payload : { message: String(error) }
  if (typeof error.name === 'string' && result.name == null) {
    result.name = error.name
  }
  if (typeof error.message === 'string' && result.message == null) {
    result.message = error.message
  }
  if (typeof error.stack === 'string' && result.stack == null) {
    result.stack = error.stack
  }
  result.fatal = Boolean(result.fatal)
  result.allowRetry = Boolean(result.allowRetry || result.allow_retry)
  result.allow_retry = result.allowRetry
  return result
}

const messageHandlers = {
  ':commands/execute-sync': async ({ payload: { manifest, preferences, data }, reply }) => {
    reply({ type: ':events/scrape-started' })
    const api = new ZPAPI({ manifest, preferences, data })
    global.ZenMoney = api
    try {
      const { main } = require('currentPluginManifest')
      main()
      const result = await api.setResultCalled
      reply({
        type: ':events/scrape-success',
        payload: result
      })
    } catch (error) {
      reply({
        type: ':events/scrape-error',
        payload: toSerializableError(error)
      })
    }
  },

  ':events/received-user-input': () => {},
  ':events/cookie-set': () => {},
  ':events/cookies-saved': () => {},
  ':events/cookies-restored': () => {},
  ':events/file-selected': () => {},
  ':events/alert-closed': () => {}
}

export async function handleMessageFromWindow ({ event }) {
  const messageHandler = messageHandlers[event.data.type] || (() => console.warn('message', event.data.type, ' from window was not handled', { event }))
  await messageHandler({
    payload: event.data.payload,
    reply: (message) => event.target.postMessage(message)
  })
}
