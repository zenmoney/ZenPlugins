import qs from 'querystring'
import { fetchJson } from '../../common/network'

export async function fetchReceipt (parameters: Record<string, string>): Promise<unknown> {
  const response = await fetchJson(`https://cabinet.kofd.kz/api/tickets?${qs.stringify(parameters)}`, { log: false })
  assert(response.status >= 200 && response.status < 300, 'Unexpected receipt HTTP status', { status: response.status })
  return response.body
}
