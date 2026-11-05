import { fetchReceipt as fetchReceiptRaw } from './fetchApi'

export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown } | { status: 'notApplicable' }> {
  if (!/^https:\/\/(?:api\.kassa\.wipon\.kz\/links\/check\/[A-Za-z0-9-]+|api\.wipon\.kz\/v2\/sale\/\d+\/check|nurkassa\.kz\/consumer\/check\?[^\s#]+)$/.test(code)) return { status: 'notApplicable' }
  return { status: 'found', data: await fetchReceiptRaw(code) }
}
