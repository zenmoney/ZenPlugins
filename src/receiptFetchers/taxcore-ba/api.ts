import { fetchReceipt as fetchReceiptRaw } from './fetchApi'

export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown } | { status: 'notApplicable' }> {
  if (!/^https:\/\/suf\.poreskaupravars\.org\/v\/\?vl=[^\s#]+$/.test(code)) return { status: 'notApplicable' }
  return { status: 'found', data: await fetchReceiptRaw(code) }
}
