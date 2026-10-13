import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'consumer1-ofd-ru',
  countryCodes: ['RU'],
  capabilities: { fetchReceipt: { matcher: 'consumer.1-ofd.ru' } }
}
