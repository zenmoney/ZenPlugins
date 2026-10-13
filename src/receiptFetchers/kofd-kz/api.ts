import get from '../../types/get'
import { hasHost, queryParams } from '../../common/receiptFetcher/receipt'
import { fetchReceipt as fetchReceiptRaw } from './fetchApi'
export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown } | { status: 'notApplicable' | 'notFound' | 'pending' }> {
  if (!hasHost(code, ['consumer.kofd.kz', 'cabinet.kofd.kz'])) return { status: 'notApplicable' }
  const params = queryParams(code)
  if (typeof params.f !== 'string' || params.f.length === 0 || typeof params.i !== 'string' || params.i.length === 0 || typeof params.t !== 'string' || params.t.length === 0) return { status: 'notApplicable' }
  const date = params.t.match(/^(\d{4})(\d{2})(\d{2})T/)
  if (date == null) return { status: 'notApplicable' }
  const body = await fetchReceiptRaw({ registrationNumber: params.f, ticketNumber: params.i, ticketDate: `${date[1]}-${date[2]}-${date[3]}` })
  assert(get(body, 'data') != null, 'Unexpected KOFD response')
  if (Number(get(body, 'data.found')) === 0) return { status: 'notFound' }
  const ticket = get(body, 'data.ticket')
  assert(Array.isArray(ticket) && ticket.length > 0, 'Missing KOFD receipt')
  return { status: 'found', data: ticket }
}
