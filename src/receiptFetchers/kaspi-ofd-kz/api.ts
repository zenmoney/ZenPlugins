import { fetchReceipt as fetchReceiptRaw } from './fetchApi'

export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown } | { status: 'notApplicable' }> {
  if (!/^https:\/\/receipt\.kaspi\.kz\/(?:fiscal|web\/fiscal)\?[^\s#]+$/.test(code)) return { status: 'notApplicable' }
  return { status: 'found', data: await fetchReceiptRaw(code.replace('receipt.kaspi.kz/fiscal?', 'receipt.kaspi.kz/web/fiscal?')) }
}
