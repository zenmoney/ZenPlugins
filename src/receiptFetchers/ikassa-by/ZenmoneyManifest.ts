import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'ikassa-by',
  countryCodes: ['BY'],
  capabilities: { fetchReceipt: { matcher: 'documentId=' } }
}
