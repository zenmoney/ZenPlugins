import { fetch } from '../../common/network'

export async function fetchReceipt (registerId: string, receiptId: string): Promise<string> {
  const response = await fetch(`https://buhta.com/receipt/${encodeURIComponent(registerId)}/${encodeURIComponent(receiptId)}`, {
    headers: { Accept: 'text/html', 'Accept-Language': 'ru' },
    log: false
  })
  assert(response.status >= 200 && response.status < 300, 'Unexpected receipt HTTP status', { status: response.status })
  assert(typeof response.body === 'string', 'Expected receipt response text')
  return response.body
}
