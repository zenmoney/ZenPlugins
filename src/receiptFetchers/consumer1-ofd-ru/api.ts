import get from '../../types/get'
import { hasHost, queryParams } from '../../common/receiptFetcher/receipt'
import { fetchReceipt as fetchReceiptRaw } from './fetchApi'
export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown } | { status: 'notApplicable' | 'notFound' | 'pending' }> {
  if (!hasHost(code, ['consumer.1-ofd.ru']) || typeof queryParams(code).t !== 'string') return { status: 'notApplicable' }
  const data = await fetchReceiptRaw(code)
  assert(Array.isArray(get(data, 'ticket.items')), 'Unexpected OFD receipt')
  return { status: 'found', data }
}
