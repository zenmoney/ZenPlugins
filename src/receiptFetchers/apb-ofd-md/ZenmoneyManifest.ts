import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

export const manifest: ReceiptFetcherManifest = {
  id: 'apb-ofd-md',
  countryCodes: ['MD'],
  capabilities: { fetchReceipt: { matcher: /^https:\/\/ofd\.apb\.online\/Ofd\/check\?[^\s#]+$/ } }
}
