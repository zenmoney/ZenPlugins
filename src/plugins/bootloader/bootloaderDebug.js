function deepFreeze (value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value
  }
  for (const nested of Object.values(value)) {
    deepFreeze(nested)
  }
  return Object.freeze(value)
}

export function installBootloaderDebug ({ transport, session }) {
  const debug = {
    isActive: true,
    version: '2',
    sessionId: session.sessionId,
    plugin: deepFreeze({ ...session.plugin }),
    server: deepFreeze({ url: session.serverUrl }),
    config: deepFreeze({ ...session.config }),
    checkpoint (name, value) {
      if (typeof name !== 'string' || !name.trim()) {
        return Promise.reject(new Error('bootloader.checkpoint name must be a non-empty string'))
      }
      transport.enqueue('checkpoint', { name, value })
      return transport.flush()
    }
  }
  global.bootloader = deepFreeze(debug)
  return global.bootloader
}
