import { hasHost } from '../../common/receiptFetcher/receipt'
import { fetchReceipt as fetchReceiptRaw } from './fetchApi'

export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown } | { status: 'notApplicable' | 'notFound' | 'pending' }> {
  if (!hasHost(code, ['ofd1.kz'])) return { status: 'notApplicable' }
  const data = await fetchReceiptRaw(code)
  assert(data.length > 0, 'Empty receipt page')
  if (data.includes('Чек не найден')) return { status: 'notFound' }
  return { status: 'found', data }
}
