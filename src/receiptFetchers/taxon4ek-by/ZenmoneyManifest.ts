import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'taxon4ek-by',
  countryCodes: ['BY'],
  capabilities: { fetchReceipt: { matcher: /^https:\/\/taxon4ek\.by\/billInfoByOrderUid\/[a-f0-9-]+$/i } }
}
