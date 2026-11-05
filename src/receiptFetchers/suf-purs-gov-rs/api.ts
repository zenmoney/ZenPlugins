import { hasHost } from '../../common/receiptFetcher/receipt'
import { fetchReceipt as fetchReceiptRaw, resolveShortLink } from './fetchApi'

export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown } | { status: 'notApplicable' | 'notFound' | 'pending' }> {
  if (/^https:\/\/128\.pl\/[A-Za-z0-9]+$/.test(code)) {
    const target = await resolveShortLink(code)
    // A general shortener is not a provider. Never follow an unrelated destination.
    if (!/^https:\/\/suf\.purs\.gov\.rs\/v\/\?vl=[^\s#]+$/.test(target)) return { status: 'notApplicable' }
    code = target
  }
  if (!hasHost(code, ['suf.purs.gov.rs'])) return { status: 'notApplicable' }
  const data = await fetchReceiptRaw(code)
  assert(data.length > 0, 'Empty receipt page')
  return { status: 'found', data }
}
