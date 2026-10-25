import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'buhta-kz',
  countryCodes: ['KZ'],
  capabilities: { fetchReceipt: { matcher: /^https?:\/\/buhta\.com\/receipt\//i } }
}
