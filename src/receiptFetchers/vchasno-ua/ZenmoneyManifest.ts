import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'vchasno-ua',
  countryCodes: ['UA'],
  capabilities: { fetchReceipt: { matcher: /^https:\/\/kasa\.vchasno\.ua\/c\/[A-Za-z0-9_-]+(?:\?[^\s#]*)?$/ } }
}
