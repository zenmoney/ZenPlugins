import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'
import { receiptUid } from './code'

export const manifest: ReceiptFetcherManifest = {
  id: 'mns-by',
  countryCodes: ['BY'],
  capabilities: { fetchReceipt: { matcher: receiptUid } }
}
