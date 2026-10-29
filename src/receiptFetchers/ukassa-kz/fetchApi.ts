import { fetchJson } from '../../common/network'

export async function fetchReceipt (id: string, fiscalNumber: string, kgd: string): Promise<unknown> {
  const response = await fetchJson('https://ukassa.kz/api/operation/get_client_check/', {
    method: 'POST',
    body: { id, fiscal_number: fiscalNumber, kod_kgd: kgd },
    log: false
  })
  assert(response.status >= 200 && response.status < 300, 'Unexpected receipt HTTP status', { status: response.status })
  return response.body
}
