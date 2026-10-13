import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'oofd-kz',
  countryCodes: ['KZ'],
  capabilities: { fetchReceipt: { matcher: { any: ['consumer.oofd.kz', 'kkm.webkassa.kz'] } } }
}
