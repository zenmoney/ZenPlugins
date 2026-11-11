import { fetch } from '../../common/network'
import type { FetchResponse } from '../../common/network'

export async function fetchReceipt (documentId: string, cloud = false): Promise<FetchResponse> {
  const host = cloud ? 'receipts.cloud.ikassa.by' : 'receipts.ikassa.by'
  return await fetch(`https://${host}/render/${encodeURIComponent(documentId)}`, { headers: { Accept: 'text/html' } })
}
