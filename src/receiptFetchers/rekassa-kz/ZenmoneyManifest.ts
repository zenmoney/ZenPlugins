import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'rekassa-kz',
  countryCodes: ['KZ'],
  capabilities: { fetchReceipt: { matcher: /^https:\/\/ofd\.rekassa\.kz\/t\/?\?/ } }
}
