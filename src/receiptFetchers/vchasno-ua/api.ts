import { load } from 'cheerio'
import { fetchReceipt as fetchReceiptRaw } from './fetchApi'

export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown } | { status: 'notApplicable' | 'notFound' }> {
  if (!/^https:\/\/kasa\.vchasno\.ua\/c\/[A-Za-z0-9_-]+(?:\?[^\s#]*)?$/.test(code)) return { status: 'notApplicable' }
  const response = await fetchReceiptRaw(code)
  assert(response.status === 200 || response.status === 404, 'Unexpected receipt HTTP status', { status: response.status })
  assert(typeof response.body === 'string', 'Expected Vchasno receipt HTML')
  const $ = load(response.body)
  const check = $('.check')
  if (response.status === 404 && check.length === 1 && check.find('p').toArray().some(p => $(p).text().trim() === 'Чек не знайдено / чек поки недоступний')) {
    return { status: 'notFound' }
  }
  assert(response.status === 200, 'Unexpected receipt HTTP status', { status: response.status })
  // Vchasno explicitly identifies these documents as test receipts not sent to the tax service.
  if (check.length === 1 && check.find('.testCheckInfo').text().replace(/\s+/g, ' ').trim() === 'ТЕСТОВИЙ ЧЕК Не передається в податкову') {
    return { status: 'notFound' }
  }
  return { status: 'found', data: response.body }
}
