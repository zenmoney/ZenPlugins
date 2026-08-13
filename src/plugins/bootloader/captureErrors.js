import { serializeError } from './serialization'

export function installUnhandledErrorCapture ({ transport, enabled }) {
  if (!enabled || typeof global.addEventListener !== 'function') {
    return
  }
  global.addEventListener('error', event => {
    transport.enqueue('error', serializeError(event.error || event.message, true))
  })
  global.addEventListener('unhandledrejection', event => {
    transport.enqueue('error', serializeError(event.reason, true))
  })
}
