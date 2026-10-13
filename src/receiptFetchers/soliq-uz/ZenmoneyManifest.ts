import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'soliq-uz',
  countryCodes: ['UZ'],
  capabilities: { fetchReceipt: { matcher: 'ofd.soliq.uz' } }
}
