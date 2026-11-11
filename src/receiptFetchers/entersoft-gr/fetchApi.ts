import { fetch } from '../../common/network'

export async function fetchPage (url: string): Promise<string> {
  const response = await fetch(url)
  assert(response.status === 200, 'Unexpected receipt HTTP status', { status: response.status })
  assert(typeof response.body === 'string', 'Expected Entersoft page')
  return response.body
}
