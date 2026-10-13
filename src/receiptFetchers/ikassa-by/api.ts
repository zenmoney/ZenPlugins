import { queryParams } from '../../common/receiptFetcher/receipt'
import { fetchReceipt as fetchReceiptRaw } from './fetchApi'
export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown } | { status: 'notApplicable' | 'notFound' | 'pending' }> {
  const { documentId } = queryParams(code)
  if (typeof documentId !== 'string' || documentId.length === 0) return { status: 'notApplicable' }
  return { status: 'found', data: await fetchReceiptRaw(documentId) }
}
