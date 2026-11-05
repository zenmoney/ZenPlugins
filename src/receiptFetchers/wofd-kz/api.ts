import { queryParams } from '../../common/receiptFetcher/receipt'
import get from '../../types/get'
import { fetchReceipt as fetchReceiptRaw, resolveKpos } from './fetchApi'

export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown } | { status: 'notApplicable' }> {
  if (/^https:\/\/kpos-sg\.kkgroup\.cn\/shopping_api\/backend\/webkassa\/redirect\?order_id=[A-Za-z0-9]+$/.test(code)) code = await resolveKpos(code)
  if (!/^https:\/\/(?:cabinet\.wofd\.kz\/consumer\/?|consumer\.wofd\.kz\/?)\?[^\s#]+$/.test(code)) return { status: 'notApplicable' }
  const { f, i, t } = queryParams(code)
  if (typeof f !== 'string' || !/^\d+$/.test(f) || typeof i !== 'string' || !/^\d+$/.test(i) || typeof t !== 'string' || !/^\d{8}T\d{6}$/.test(t)) return { status: 'notApplicable' }
  const data = await fetchReceiptRaw(f, i, `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`)
  assert(get(data, 'found') === 1, 'WOFD did not return a confirmed receipt')
  return { status: 'found', data }
}
