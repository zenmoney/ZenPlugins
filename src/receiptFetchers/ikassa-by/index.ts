import type { FetchReceipt, FetchReceiptResult } from '../../types/receiptFetcher'
import { isQrCode } from '../../common/receiptFetcher/receipt'
import { fetchReceipt as fetchReceiptApi } from './api'
import { convertReceipt } from './converters'
import { fetchReceiptByUid as fetchWebkassaReceipt } from '../webkassa-by/api'
import { convertReceipt as convertWebkassaReceipt } from '../webkassa-by/converters'

export async function fetchReceipt ({ code }: Parameters<FetchReceipt>[0]): Promise<FetchReceiptResult> {
  ZenMoney.locale = 'ru'
  if (!isQrCode(code)) return { status: 'notApplicable' }
  const result = await fetchReceiptApi(code.value)
  if (result.status === 'notApplicable') return result
  if (result.status === 'notFound') {
    if (!/^[A-Fa-f0-9]{24}$/.test(result.documentId)) return { status: 'notFound' }
    const fallback = await fetchWebkassaReceipt(result.documentId)
    if (fallback.status === 'notFound') return fallback
    const receipt = convertWebkassaReceipt(fallback.data)
    assert(receipt.id?.toUpperCase() === result.documentId.toUpperCase(), 'Retrieved receipt does not match the requested identifier')
    return { status: 'found', receipt }
  }
  const receipt = convertReceipt(result.data)
  assert(receipt.id === result.documentId, 'Retrieved receipt does not match the requested identifier')
  return { status: 'found', receipt }
}
