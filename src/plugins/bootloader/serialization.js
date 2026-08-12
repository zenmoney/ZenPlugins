export function toSerializable (value, options = {}) {
  const seen = []
  const maxDepth = options.maxDepth === undefined ? 12 : options.maxDepth
  const walk = (item, depth) => {
    if (item === undefined) {
      return '[undefined]'
    }
    if (item === null || typeof item === 'string' || typeof item === 'boolean') {
      return item
    }
    if (typeof item === 'number') {
      return Number.isFinite(item) ? item : String(item)
    }
    if (typeof item === 'bigint') {
      return `${item}n`
    }
    if (typeof item === 'function') {
      return `[Function ${item.name || 'anonymous'}]`
    }
    if (typeof item === 'symbol') {
      return String(item)
    }
    if (depth >= maxDepth) {
      return '[Max depth]'
    }
    if (item instanceof Date) {
      return item.toISOString()
    }
    if (item instanceof Error) {
      return {
        name: item.name,
        message: item.message,
        stack: item.stack || null,
        ...walk(Object.keys(item).reduce((result, key) => {
          result[key] = item[key]
          return result
        }, {}), depth + 1)
      }
    }
    if (seen.indexOf(item) >= 0) {
      return '[Circular]'
    }
    seen.push(item)
    let result
    if (Array.isArray(item)) {
      result = item.map(value => walk(value, depth + 1))
    } else if (ArrayBuffer.isView(item)) {
      result = `<${Object.prototype.toString.call(item).slice(8, -1)}[${item.byteLength}]>`
    } else if (item instanceof ArrayBuffer) {
      result = `<ArrayBuffer[${item.byteLength}]>`
    } else {
      result = {}
      for (const key of Object.keys(item)) {
        try {
          result[key] = walk(item[key], depth + 1)
        } catch (error) {
          result[key] = `[Could not serialize: ${error.message}]`
        }
      }
    }
    seen.pop()
    return result
  }
  return walk(value, 0)
}

export function serializeError (error, unhandled = false) {
  const serialized = toSerializable(error)
  const result = serialized && typeof serialized === 'object'
    ? serialized
    : { message: String(error) }
  return {
    name: result.name || error?.name || 'Error',
    message: result.message || error?.message || String(error),
    stack: result.stack || error?.stack || null,
    unhandled,
    details: result
  }
}
