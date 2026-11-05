import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'entersoft-gr',
  countryCodes: ['GR'],
  capabilities: { fetchReceipt: { matcher: /^https:\/\/e-invoicing\.gr\/edocuments\/ViewInvoice\// } }
}
