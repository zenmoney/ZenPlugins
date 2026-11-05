import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'wofd-kz',
  countryCodes: ['KZ'],
  capabilities: { fetchReceipt: { matcher: /^https:\/\/(?:cabinet\.wofd\.kz\/consumer\/?\?|consumer\.wofd\.kz\/?\?|kpos-sg\.kkgroup\.cn\/shopping_api\/backend\/webkassa\/redirect\?)/ } }
}
