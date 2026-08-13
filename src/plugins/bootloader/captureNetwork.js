function headersToObject (headers) {
  if (!headers) {
    return {}
  }
  const result = {}
  if (typeof headers.forEach === 'function') {
    headers.forEach((value, key) => { result[key] = value })
  } else if (Array.isArray(headers)) {
    for (const pair of headers) {
      result[pair[0]] = pair[1]
    }
  } else {
    Object.assign(result, headers)
  }
  return result
}

function limitBody (body, maxBodyBytes) {
  if (body === undefined || body === null) {
    return null
  }
  if (typeof body !== 'string') {
    if (ArrayBuffer.isView(body) || body instanceof ArrayBuffer) {
      return `<binary[${body.byteLength}]>`
    }
    body = JSON.stringify(body)
  }
  if (body.length > maxBodyBytes) {
    return body.slice(0, maxBodyBytes) + `\n<truncated ${body.length - maxBodyBytes} chars>`
  }
  return body
}

export function installNetworkCapture ({ transport, config }) {
  if (!config?.enabled || typeof global.fetch !== 'function') {
    return
  }
  const originalFetch = global.fetch.bind(global)
  let nextRequestId = 1
  global.fetch = async function (url, options = {}) {
    const init = options && typeof options === 'object' ? options : {}
    const requestId = String(nextRequestId++)
    const startedAt = Date.now()
    const requestUrl = typeof url === 'string' ? url : url?.url || String(url)
    transport.enqueue('network:request', {
      id: requestId,
      url: requestUrl,
      method: init.method || url?.method || 'GET',
      headers: headersToObject(init.headers || url?.headers),
      body: limitBody(init.body, config.maxBodyBytes)
    })
    let response
    try {
      response = await originalFetch(url, options)
    } catch (error) {
      transport.enqueue('network:response', {
        id: requestId,
        url: requestUrl,
        ms: Date.now() - startedAt,
        error
      })
      throw error
    }
    transport.enqueue('network:response', {
      id: requestId,
      url: response.url || requestUrl,
      ms: Date.now() - startedAt,
      status: response.status,
      statusText: response.statusText,
      headers: headersToObject(response.headers)
    })

    const captureBody = async (method, args) => {
      const body = await response[method].apply(response, args)
      transport.enqueue('network:response-body', {
        id: requestId,
        body: limitBody(body, config.maxBodyBytes),
        encoding: method
      })
      return body
    }

    if (typeof Proxy === 'function') {
      return new Proxy(response, {
        get (target, property) {
          if ((property === 'text' || property === 'arrayBuffer') && typeof target[property] === 'function') {
            return function () { return captureBody(property, Array.from(arguments)) }
          }
          const value = target[property]
          return typeof value === 'function' ? value.bind(target) : value
        }
      })
    }
    return response
  }
}
