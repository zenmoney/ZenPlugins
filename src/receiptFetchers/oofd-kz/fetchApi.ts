import { fetch, fetchJson } from '../../common/network'
import qs from 'querystring'

export async function fetchConsumerPage (parameters: Record<string, string>): Promise<{ body: string, url: string }> {
  return await fetchPublicPage('https://consumer.oofd.kz/?' + qs.stringify({ i: parameters.fiscalNumber, f: parameters.cashboxNumber, s: parameters.totalSum, t: parameters.purchaseTime }))
}

export async function fetchPublicPage (code: string): Promise<{ body: string, url: string }> {
  const response = await fetch(code.replace(/^http:/, 'https:'), { log: false })
  assert(response.status >= 200 && response.status < 300, 'Unexpected receipt HTTP status', { status: response.status })
  assert(typeof response.body === 'string', 'Expected receipt response text')
  assert(typeof response.url === 'string', 'Unexpected receipt response URL')
  return { body: response.body, url: response.url }
}

export async function fetchReceipt (path: string): Promise<unknown> {
  const response = await fetchJson(`https://consumer.oofd.kz/api/tickets${path}`, { log: false })
  assert(response.status >= 200 && response.status < 300, 'Unexpected receipt HTTP status', { status: response.status })
  return response.body
}
