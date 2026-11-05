import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'webkassa-by',
  countryCodes: ['BY'],
  capabilities: { fetchReceipt: { matcher: /^https:\/\/webkassa\.by\/p\?uid=[A-Fa-f0-9]{24}$/ } }
}
