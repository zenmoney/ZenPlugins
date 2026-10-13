import { fetchJson } from '../../common/network'

export async function fetchReceipt (code: string): Promise<unknown> {
  const response = await fetchJson(`https://consumer.1-ofd.ru/api/tickets/ticket/${code.slice(code.indexOf('?') + 1)}`, { log: false })
  assert(response.status >= 200 && response.status < 300, 'Unexpected receipt HTTP status', { status: response.status })
  return response.body
}
