import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'kofd-kz',
  countryCodes: ['KZ'],
  capabilities: { fetchReceipt: { matcher: { any: ['consumer.kofd.kz', 'cabinet.kofd.kz'] } } }
}
