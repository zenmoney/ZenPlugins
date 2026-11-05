import { fetchReceipt as fetchReceiptRaw } from './fetchApi'

export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown } | { status: 'notApplicable' }> {
  const match = code.match(/^https:\/\/taxon4ek\.by\/billInfoByOrderUid\/([a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12})$/i)
  if (match === null) return { status: 'notApplicable' }
  return { status: 'found', data: await fetchReceiptRaw(match[1]) }
}
