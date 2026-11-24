import { isQrCode } from '../../common/receiptFetcher/receipt'
import { UserInteractionError } from '../../errors'
import get from '../../types/get'
import type { FetchReceipt, FetchReceiptResult } from '../../types/receiptFetcher'
import { receiptUid } from './code'
import { convertReceipt } from './converters'
import { fetchReceiptResponse } from './fetchApi'

export async function fetchReceipt ({ code, transactionDate, isInBackground }: Parameters<FetchReceipt>[0]): Promise<FetchReceiptResult> {
  if (!isQrCode(code) || !receiptUid.test(code.value) || transactionDate === undefined) return { status: 'notApplicable' }
  const day = new Date(transactionDate + 'T00:00:00Z')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(transactionDate) || isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== transactionDate) return { status: 'notApplicable' }

  if (isInBackground) throw new UserInteractionError()
  ZenMoney.locale = 'ru'
  const result = await fetchReceiptResponse(code.value, transactionDate)
  const status = get(result, 'data.status')
  assert(get(result, 'status') === 'success', 'Unexpected MNS receipt response')
  if (status === 'incorrect') return { status: 'notFound' }
  assert(status === 'success', 'Unexpected MNS receipt result')
  const receipt = convertReceipt(get(result, 'data.message'))
  assert(receipt.id === code.value, 'Retrieved receipt does not match the requested identifier')
  return { status: 'found', receipt }
}
