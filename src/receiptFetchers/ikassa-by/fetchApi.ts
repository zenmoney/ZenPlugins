import { fetch } from '../../common/network'
import type { FetchResponse } from '../../common/network'

export async function fetchReceipt (documentId: string): Promise<FetchResponse> {
  // Printed HTML may include unstructured card/customer slips; keep raw body logging disabled.
  return await fetch(`https://receipts.ikassa.by/render/${encodeURIComponent(documentId)}`, { log: false, headers: { Accept: 'text/html' } })
}
