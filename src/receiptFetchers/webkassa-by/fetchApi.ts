import { fetch } from '../../common/network'
import get from '../../types/get'

export async function fetchReceipt (uid: string): Promise<ArrayBuffer | undefined> {
  const response = await fetch(`https://webkassa.by/rsCashAppsWeb/noauth/files/print-forms/checks/${encodeURIComponent(uid)}`, { binaryResponse: true })
  const contentType = response.headers['content-type']
  if (response.status === 500 && response.body instanceof ArrayBuffer &&
    typeof contentType === 'string' && /^application\/json\b/i.test(contentType)) {
    // The public print endpoint uses HTTP 500 with this specific error for an absent UID.
    const error: unknown = JSON.parse(await new Blob([response.body]).text())
    if (get(error, 'errCodeForClient') === 10 && get(error, 'errMessForClient') === 'запись не найдена') return undefined
  }
  assert(response.status === 200, 'Unexpected receipt HTTP status', { status: response.status })
  assert(response.body instanceof ArrayBuffer, 'Expected receipt PDF bytes')
  return response.body
}
