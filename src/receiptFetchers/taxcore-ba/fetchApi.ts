import { fetchJson } from '../../common/network'

export async function fetchReceipt (code: string): Promise<unknown> {
  const response = await fetchJson(code)
  assert(response.status === 200, 'Unexpected receipt HTTP status', { status: response.status })
  return response.body
}
