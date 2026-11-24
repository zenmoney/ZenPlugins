import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'
import { fiscalUid, webkassaLink } from './codeMatchers'

export const manifest: ReceiptFetcherManifest = {
  id: 'webkassa-by',
  countryCodes: ['BY'],
  capabilities: {
    fetchReceipt: { matcher: { any: [webkassaLink, fiscalUid] } }
  }
}
