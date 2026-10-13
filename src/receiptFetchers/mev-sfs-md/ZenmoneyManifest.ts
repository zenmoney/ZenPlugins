import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'mev-sfs-md',
  countryCodes: ['MD'],
  capabilities: { fetchReceipt: { matcher: 'mev.sfs.md' } }
}
