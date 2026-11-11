import { fetchJson } from '../../common/network'

export async function fetchReceipt (uid: string): Promise<unknown> {
  const response = await fetchJson(`https://taxon4ek.by/taxon4ek_api_release/api/outer/v1/bill/billInfoByOrderUid?orderUid=${encodeURIComponent(uid)}`)
  assert(response.status === 200, 'Unexpected receipt HTTP status', { status: response.status })
  return response.body
}
