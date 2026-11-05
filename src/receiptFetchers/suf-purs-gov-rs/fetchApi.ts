import { fetch } from '../../common/network'

export async function resolveShortLink (code: string): Promise<string> {
  const response = await fetch(code, { redirect: 'manual', log: false })
  assert([301, 302, 303, 307, 308].includes(response.status), 'Expected receipt short-link redirect', { status: response.status })
  const location = response.headers.location
  assert(typeof location === 'string', 'Missing receipt redirect location')
  return location
}

export async function fetchReceipt (code: string): Promise<string> {
  const response = await fetch(code, { log: false, redirect: 'manual', headers: { Accept: '*/*', 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36' } })
  assert(response.status >= 200 && response.status < 300, 'Unexpected receipt HTTP status', { status: response.status })
  assert(typeof response.body === 'string', 'Expected receipt response text')
  return response.body
}
