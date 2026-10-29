import { hasHost } from '../../common/receiptFetcher/receipt'
import { fetchReceipt as fetchReceiptRaw, fetchReceiptFragment } from './fetchApi'

export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown } | { status: 'notApplicable' | 'notFound' | 'pending' }> {
  if (!hasHost(code, ['ofd1.kz'])) return { status: 'notApplicable' }
  let data = await fetchReceiptRaw(code)
  if (data.includes('id="ticket_captcha_container"')) {
    data = await fetchReceiptFragment(code)
    assert(!data.includes('id="ticket_captcha_container"'), 'Receipt verification did not return a receipt')
  }
  assert(data.length > 0, 'Empty receipt page')
  if (data.includes('Чек не найден')) return { status: 'notFound' }
  return { status: 'found', data }
}
