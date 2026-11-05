import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'taxservice-am',
  countryCodes: ['AM'],
  capabilities: { fetchReceipt: { matcher: /^https:\/\/mytax\.taxservice\.am\/receipt\/\d+\/[A-Za-z0-9]+$/ } }
}
