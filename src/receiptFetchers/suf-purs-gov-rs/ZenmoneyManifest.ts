import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'suf-purs-gov-rs',
  countryCodes: ['RS'],
  capabilities: { fetchReceipt: { matcher: 'suf.purs.gov.rs' } }
}
