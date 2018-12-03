export class RetryError {
  constructor (message, failedResults) {
    this.message = message
    this.failedResults = failedResults
    this.stack = new Error().stack
  }
}

export function toNodeCallbackArguments (getter) {
  return async () => {
    try {
      return [null, await getter()]
    } catch (e) {
      return [e, null]
    }
  }
}

export async function retry ({
  getter,
  predicate,
  maxAttempts = 1,
  log = false
}) {
  const failedResults = []
  for (let attempt = 1; attempt <= maxAttempts; ++attempt) {
    const getterResult = getter()
    const value = await getterResult
    const ok = predicate(value)
    log && console.info('retry', { ok, attempt, maxAttempts })
    if (ok) {
      return value
    }
    failedResults.push(value)
  }
  throw new RetryError(`could not satisfy predicate in ${maxAttempts} attempt(s)`, failedResults)
}
