import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'vs-gr',
  countryCodes: ['GR'],
  capabilities: { fetchReceipt: { matcher: /^https:\/\/vs\.gr\/iv\/invoice\/download\/[A-Za-z0-9_~/-]+$/ } }
}
