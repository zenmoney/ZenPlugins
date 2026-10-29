import type { FetchReceipt, FetchReceiptResult } from '../../types/receiptFetcher'
import { isQrCode } from '../../common/receiptFetcher/receipt'
import { fetchReceipt as fetchReceiptApi } from './api'
import { convertReceipt } from './converters'

export async function fetchReceipt ({ code }: Parameters<FetchReceipt>[0]): Promise<FetchReceiptResult> {
  ZenMoney.locale = 'ru'
  if (!isQrCode(code)) return { status: 'notApplicable' }
  const result = await fetchReceiptApi(code.value)
  if (result.status !== 'found') return result
  const receipt = convertReceipt(result.data)
  assert(receipt.id === result.documentId, 'Retrieved receipt does not match the requested identifier')
  return { status: 'found', receipt }
}
