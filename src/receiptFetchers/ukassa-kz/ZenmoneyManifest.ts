import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'ukassa-kz',
  countryCodes: ['KZ'],
  capabilities: { fetchReceipt: { matcher: /^(?:https?:\/\/)?ukassa\.kz\/check\/?\?/i } }
}
