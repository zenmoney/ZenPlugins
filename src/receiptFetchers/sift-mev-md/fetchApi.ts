import { fetch } from '../../common/network'

export async function fetchReceipt (code: string): Promise<string> {
  const response = await fetch(code, { log: false, headers: { Accept: '*/*', 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36' } })
  assert(response.status >= 200 && response.status < 300, 'Unexpected receipt HTTP status', { status: response.status })
  assert(typeof response.body === 'string', 'Expected receipt response text')
  return response.body
}
