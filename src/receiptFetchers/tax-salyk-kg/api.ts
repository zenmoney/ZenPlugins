import { hasHost } from '../../common/receiptFetcher/receipt'
import { fetchReceipt as fetchReceiptRaw } from './fetchApi'

export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown } | { status: 'notApplicable' | 'notFound' | 'pending' }> {
  if (!hasHost(code, ['tax.salyk.kg'])) return { status: 'notApplicable' }
  const data = await fetchReceiptRaw(code)
  assert(data !== null && typeof data === 'object' && !Array.isArray(data), 'Unexpected receipt response')
  return { status: 'found', data }
}
