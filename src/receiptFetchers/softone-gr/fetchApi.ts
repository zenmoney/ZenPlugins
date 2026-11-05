import { fetch } from '../../common/network'

export async function fetchReceipt (code: string): Promise<unknown> {
  // Public documents may contain unstructured customer/card details.
  const response = await fetch(code, { log: false, redirect: 'manual' })
  assert(response.status === 200, 'Unexpected receipt HTTP status', { status: response.status })
  return response.body
}
