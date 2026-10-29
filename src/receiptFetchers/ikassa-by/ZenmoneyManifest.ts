import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'ikassa-by',
  countryCodes: ['BY'],
  capabilities: {
    fetchReceipt: {
      matcher: { any: [/^[A-Za-z0-9]{24}$/, 'documentId=', /^https?:\/\/receipts\.ikassa\.by\/render\//i] }
    }
  }
}
