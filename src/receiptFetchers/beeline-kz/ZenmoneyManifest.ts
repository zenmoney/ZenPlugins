import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'beeline-kz',
  countryCodes: ['KZ'],
  capabilities: { fetchReceipt: { matcher: 'ofd.beeline.kz/t/?i' } }
}
