import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'suf-purs-gov-rs',
  countryCodes: ['RS'],
  capabilities: { fetchReceipt: { matcher: { any: ['suf.purs.gov.rs', /^https:\/\/128\.pl\/[A-Za-z0-9]+$/] } } }
}
