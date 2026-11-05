import { fetchReceipt as fetchReceiptRaw } from './fetchApi'

export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown } | { status: 'notApplicable' }> {
  if (!/^https:\/\/ofd\.apb\.online\/Ofd\/check\?[^\s#]+$/.test(code)) return { status: 'notApplicable' }
  return { status: 'found', data: await fetchReceiptRaw(code) }
}
