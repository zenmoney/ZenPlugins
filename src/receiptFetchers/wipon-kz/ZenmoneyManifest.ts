import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'wipon-kz',
  countryCodes: ['KZ'],
  capabilities: { fetchReceipt: { matcher: /^https:\/\/(?:api\.kassa\.wipon\.kz\/links\/check\/[A-Za-z0-9-]+|api\.wipon\.kz\/v2\/sale\/\d+\/check|nurkassa\.kz\/consumer\/check\?[^\s#]+)$/ } }
}
