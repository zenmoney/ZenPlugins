import { fetch } from '../../common/network'

export async function fetchReceipt (code: string): Promise<string> {
  const response = await fetch(code, { log: false, headers: { Accept: '*/*' } })
  assert(response.status >= 200 && response.status < 300, 'Unexpected receipt HTTP status', { status: response.status })
  assert(typeof response.body === 'string', 'Expected receipt response text')
  return response.body
}
