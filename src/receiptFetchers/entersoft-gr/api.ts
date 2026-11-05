import { load } from 'cheerio'
import { fetchPage } from './fetchApi'

export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown } | { status: 'notApplicable' }> {
  if (!/^https:\/\/e-invoicing\.gr\/edocuments\/ViewInvoice\/-?\d+\/[A-Za-z0-9_-]+$/.test(code)) return { status: 'notApplicable' }
  const page = await fetchPage(code)
  const $ = load(page)
  const iframe = $('iframe')
  assert(iframe.length === 1, 'Missing or ambiguous Entersoft invoice frame')
  const src = iframe.attr('src')
  assert(src !== undefined && /^\/api\/GetInvoice\?/.test(src), 'Unexpected Entersoft frame route')
  const target = new URL(src, 'https://e-invoicing.gr')
  assert(target.origin === 'https://e-invoicing.gr' && target.pathname === '/api/GetInvoice' && target.username === '' && target.password === '', 'Unexpected Entersoft frame destination')
  return { status: 'found', data: await fetchPage(target.toString()) }
}
