import { queryParams } from '../../common/receiptFetcher/receipt'
import { fetchReceipt as fetchReceiptRaw } from './fetchApi'

export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown } | { status: 'notApplicable' }> {
  if (/^(?:https?:\/\/)?ukassa\.kz\/check\/?\?[^#]*(?:#.*)?$/i.test(code)) {
    const { id, fiscal_number: fiscalNumber, kgd } = queryParams(code)
    if (typeof id !== 'string' || !/^\d+$/.test(id) ||
        typeof fiscalNumber !== 'string' || !/^\d+$/.test(fiscalNumber) ||
        typeof kgd !== 'string' || kgd.length === 0) return { status: 'notApplicable' }
    return { status: 'found', data: await fetchReceiptRaw(id, fiscalNumber, kgd) }
  }
  return { status: 'notApplicable' }
}
