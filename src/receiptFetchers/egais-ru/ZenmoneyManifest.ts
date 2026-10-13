import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'egais-ru',
  countryCodes: ['RU'],
  capabilities: { fetchReceipt: { matcher: 'check.egais.ru' } }
}
