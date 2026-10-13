import { fetchJson } from '../../common/network'

export async function fetchReceipt (documentId: string): Promise<unknown> {
  const response = await fetchJson(`https://api.ikassa.by/api/public/document/${encodeURIComponent(documentId)}`, { log: false, headers: { Accept: '*/*', 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36' } })
  assert(response.status >= 200 && response.status < 300, 'Unexpected receipt HTTP status', { status: response.status })
  return response.body
}
