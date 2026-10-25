import type { FetchReceipt, FetchReceiptResult } from '../../types/receiptFetcher'
import { isQrCode } from '../../common/receiptFetcher/receipt'
import { fetchReceipt as fetchReceiptApi } from './api'
import { convertReceipt } from './converters'

export async function fetchReceipt ({ code }: Parameters<FetchReceipt>[0]): Promise<FetchReceiptResult> {
  if (!isQrCode(code)) return { status: 'notApplicable' }
  const result = await fetchReceiptApi(code.value)
  if (result.status !== 'found') return result
  return { status: 'found', receipt: convertReceipt(result.data) }
}
