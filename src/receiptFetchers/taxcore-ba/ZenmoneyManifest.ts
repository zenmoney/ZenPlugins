import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'taxcore-ba',
  countryCodes: ['BA'],
  capabilities: { fetchReceipt: { matcher: /^https:\/\/suf\.poreskaupravars\.org\/v\/\?vl=[^\s#]+$/ } }
}
