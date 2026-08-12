import { toSerializable } from './serialization'

export const BOOTLOADER_PORT = 5050

async function responseToJson (response) {
  const text = await response.text()
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch (error) {
    throw new Error(`Bootloader server returned invalid JSON (${response.status}): ${text}`)
  }
  if (response.status < 200 || response.status >= 300) {
    throw new Error(body?.error?.message || `Bootloader server returned HTTP ${response.status}`)
  }
  return body
}

function makeServerUrl (serverIp) {
  const value = String(serverIp || '').trim()
  if (!value) {
    throw new Error('Bootloader server IP is required')
  }
  if (value.includes('://') || value.includes('/') || value.includes('?') || value.includes('#')) {
    throw new Error('Bootloader serverIp must contain only an IP address')
  }
  const ipv4 = value.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  const isIpv4 = ipv4 && ipv4.slice(1).every(part => Number(part) <= 255)
  const ipv6Parts = value.split(':')
  const isIpv6 = ipv6Parts.length >= 3 && ipv6Parts.length <= 8 &&
    !value.includes(':::') && /^[0-9a-f:]+$/i.test(value) &&
    ipv6Parts.every(part => part.length <= 4)
  if (!isIpv4 && !isIpv6) {
    throw new Error('Bootloader serverIp must contain only an IP address')
  }
  const host = value.includes(':') ? `[${value}]` : value
  return `http://${host}:${BOOTLOADER_PORT}`
}

export class BootloaderTransport {
  constructor (fetchImplementation) {
    this.fetchImplementation = fetchImplementation
    this.serverUrl = null
    this.sessionId = null
    this.queue = []
    this.flushPromise = null
    this.flushTimer = null
  }

  async request (url, options = {}, timeoutMs = 5000) {
    let timeoutId
    try {
      return await Promise.race([
        this.fetchImplementation(url, options),
        new Promise((resolve, reject) => {
          timeoutId = setTimeout(() => reject(new Error(`Timed out connecting to ${url}`)), timeoutMs)
        })
      ])
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async connect (serverIp) {
    const serverUrl = makeServerUrl(serverIp)
    try {
      const response = await this.request(`${serverUrl}/api/v2/health`, {
        headers: { Accept: 'application/json' }
      })
      const health = await responseToJson(response)
      if (health?.name !== 'zenmoney-bootloader' || health?.protocolVersion !== 2) {
        throw new Error('incompatible server')
      }
      this.serverUrl = serverUrl
      return { serverUrl, health }
    } catch (error) {
      throw new Error(`Could not connect to Bootloader V2 server at ${serverUrl}: ${error.message}`)
    }
  }

  async createSession (client) {
    const response = await this.request(`${this.serverUrl}/api/v2/sessions`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(toSerializable(client))
    })
    const session = await responseToJson(response)
    this.sessionId = session.sessionId
    return session
  }

  enqueue (type, payload) {
    this.queue.push({
      timestamp: new Date().toISOString(),
      type,
      payload: toSerializable(payload)
    })
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flushTimer = null
        this.flush().catch(() => {})
      }, 100)
    }
  }

  async flush () {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
    if (this.flushPromise) {
      await this.flushPromise
      if (this.queue.length > 0) {
        return this.flush()
      }
      return
    }
    if (this.queue.length === 0 || !this.sessionId) {
      return
    }
    const events = this.queue.splice(0, this.queue.length)
    this.flushPromise = (async () => {
      try {
        const response = await this.request(`${this.serverUrl}/api/v2/sessions/${this.sessionId}/events`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ events })
        })
        await responseToJson(response)
      } catch (error) {
        this.queue.unshift(...events)
        throw error
      } finally {
        this.flushPromise = null
      }
    })()
    return this.flushPromise
  }

  async fetchText (url) {
    const response = await this.request(url, { headers: { Accept: 'application/javascript' } }, 10000)
    const body = await response.text()
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Could not load plugin script: HTTP ${response.status} ${body}`)
    }
    return body
  }
}
