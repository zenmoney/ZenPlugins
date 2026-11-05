import { fetchReceipt as fetchReceiptRaw } from './fetchApi'

export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown } | { status: 'notApplicable' }> {
  if (!/^https:\/\/mytax\.taxservice\.am\/receipt\/\d+\/[A-Za-z0-9]+$/.test(code)) return { status: 'notApplicable' }
  return { status: 'found', data: await fetchReceiptRaw(code) }
}
