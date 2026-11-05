import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'kaspi-ofd-kz',
  countryCodes: ['KZ'],
  capabilities: { fetchReceipt: { matcher: /^https:\/\/receipt\.kaspi\.kz\/(?:fiscal|web\/fiscal)\?[^\s#]+$/ } }
}
