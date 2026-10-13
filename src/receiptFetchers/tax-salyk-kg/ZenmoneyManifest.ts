import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'tax-salyk-kg',
  countryCodes: ['KG'],
  capabilities: { fetchReceipt: { matcher: 'tax.salyk.kg' } }
}
