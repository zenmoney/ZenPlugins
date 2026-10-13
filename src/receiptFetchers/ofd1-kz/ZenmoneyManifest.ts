import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'ofd1-kz',
  countryCodes: ['KZ'],
  capabilities: { fetchReceipt: { matcher: 'ofd1.kz' } }
}
