import { fetch } from '../../common/network'
import { delay } from '../../common/utils'
import { TemporaryUnavailableError } from '../../errors'

const MAX_RPS = 10
const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 250

let activeList = []

function isRetryableResponse (response) {
  return response.status === 429 || response.status >= 500
}

async function fetchRateLimited (url, options) {
  if (activeList.length < MAX_RPS) {
    const request = fetch(url, options)
    const waiter = request
      .then(async () => await delay(1000))
      .catch(async () => await delay(1000))
      .then(() => {
        activeList = activeList.filter(item => item !== waiter)
      })
    activeList.push(waiter)
    return await request
  }

  await Promise.race(activeList)
  return await fetchRateLimited(url, options)
}

async function fetchRetrying (url, options) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetchRateLimited(url, options)
      if (!isRetryableResponse(response)) {
        return response
      }
      if (attempt === MAX_ATTEMPTS) {
        throw new TemporaryUnavailableError()
      }
    } catch (error) {
      if (error instanceof TemporaryUnavailableError) {
        throw error
      }
      if (attempt === MAX_ATTEMPTS) {
        throw new TemporaryUnavailableError(error && error.message)
      }
    }

    await delay(RETRY_DELAY_MS * attempt)
  }
}

export async function fetchRateLimitedWithRetry (url, options = {}) {
  return await fetchRetrying(url, options)
}
