import get from '../../types/get'
import { fetchReceipt as fetchReceiptRaw } from './fetchApi'
import { readReceiptEnvelope } from './protocol'

export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown } | { status: 'notApplicable' | 'notFound' }> {
  const match = code.match(/^https?:\/\/buhta\.com\/receipt\/(\d+)\/([a-z0-9]{26})\/?(?:[?#].*)?$/i)
  if (match === null) return { status: 'notApplicable' }
  const html = await fetchReceiptRaw(match[1], match[2])
  const payload = readReceiptEnvelope(html)
  if (get(payload, 'error.statusCode') === 5 && get(payload, 'error.errorMessage') === 'Receipt not found.') return { status: 'notFound' }
  assert(typeof get(payload, 'ok') === 'string', 'Unexpected receipt lookup response')
  return { status: 'found', data: html }
}
