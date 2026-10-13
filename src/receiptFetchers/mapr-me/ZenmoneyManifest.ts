import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'mapr-me',
  countryCodes: ['ME'],
  capabilities: { fetchReceipt: { matcher: 'mapr.tax.gov.me' } }
}
