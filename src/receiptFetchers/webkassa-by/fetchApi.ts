import { fetch } from '../../common/network'

export async function fetchReceipt (uid: string): Promise<ArrayBuffer> {
  const response = await fetch(`https://webkassa.by/rsCashAppsWeb/noauth/files/print-forms/checks/${encodeURIComponent(uid)}`, { binaryResponse: true })
  assert(response.status === 200, 'Unexpected receipt HTTP status', { status: response.status })
  assert(response.body instanceof ArrayBuffer, 'Expected receipt PDF bytes')
  return response.body
}
