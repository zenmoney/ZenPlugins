import qs from 'querystring'
import { fetchJson } from '../../common/network'

export async function verifyInvoice (parameters: Record<string, string>): Promise<unknown> {
  const response = await fetchJson('https://mapr.tax.gov.me/ic/api/verifyInvoice', {
    log: false,
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    stringify: qs.stringify,
    body: parameters
  })
  assert(response.status >= 200 && response.status < 300, 'Unexpected receipt HTTP status', { status: response.status })
  return response.body ?? null
}
