import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'sift-mev-md',
  countryCodes: ['MD'],
  capabilities: { fetchReceipt: { matcher: 'sift-mev.sfs.md' } }
}
