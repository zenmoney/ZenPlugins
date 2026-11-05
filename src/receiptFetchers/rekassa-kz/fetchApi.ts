import { fetch } from '../../common/network'

export async function fetchReceipt (code: string): Promise<ArrayBuffer> {
  const response = await fetch(code, { binaryResponse: true, log: false, redirect: 'manual' })
  assert(response.status === 200, 'Unexpected receipt HTTP status', { status: response.status })
  assert(response.body instanceof ArrayBuffer, 'Expected receipt PDF bytes')
  return response.body
}
