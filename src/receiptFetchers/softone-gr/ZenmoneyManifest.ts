import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'softone-gr',
  countryCodes: ['GR'],
  capabilities: { fetchReceipt: { matcher: /^https:\/\/einvoice\.s1ecos\.gr\/(?:v|p)\/[A-Za-z0-9/-]+$/ } }
}
