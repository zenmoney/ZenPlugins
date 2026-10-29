import { fetch } from '../../common/network'
import { queryParams } from '../../common/receiptFetcher/receipt'
import qs from 'querystring'

export async function fetchReceipt (code: string, headers: Record<string, string> = {}): Promise<string> {
  const response = await fetch(code, { log: false, headers: { Accept: '*/*', ...headers } })
  assert(response.status >= 200 && response.status < 300, 'Unexpected receipt HTTP status', { status: response.status })
  assert(typeof response.body === 'string', 'Expected receipt response text')
  return response.body
}

export async function fetchReceiptFragment (code: string): Promise<string> {
  // The current page uses this fallback when its reCAPTCHA script cannot load.
  const query = qs.stringify({ ...queryParams(code), fragment: '1', captcha_skip: '1' })
  return await fetchReceipt(`${code.split(/[?#]/)[0]}?${query}`, { 'X-Requested-With': 'XMLHttpRequest' })
}
