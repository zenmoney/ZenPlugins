import { hasHost } from '../../common/receiptFetcher/receipt'
import { fetchPublicPage, fetchConsumerPage, fetchReceipt as fetchReceiptRaw } from './fetchApi'

export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown } | { status: 'notApplicable' | 'notFound' | 'pending' }> {
  if (!hasHost(code, ['consumer.oofd.kz', 'kkm.webkassa.kz'])) return { status: 'notApplicable' }
  let response
  if (hasHost(code, ['kkm.webkassa.kz'])) {
    const page = await fetchPublicPage(code)
    const parameters = parseWebkassaResponse(page.body)
    assert(parameters !== null, 'Unexpected Webkassa receipt page')
    const validated: Record<string, string> = {}
    for (const [name, value] of Object.entries(parameters)) {
      assert(typeof value === 'string' && value.length > 0, 'Unexpected Webkassa receipt page')
      validated[name] = value
    }
    response = await fetchConsumerPage(validated)
  } else response = await fetchPublicPage(code)
  assert(typeof response.url === 'string' && hasHost(response.url, ['consumer.oofd.kz']), 'Unexpected OOFD redirect')
  const path = response.url.replace(/^https?:\/\/[^/]+/, '')
  if (path.split('?')[0] === '/') return { status: 'notFound' }
  assert(/^\/ticket(?:\/|\?|$)/.test(path), 'Unexpected OOFD receipt path')
  return { status: 'found', data: await fetchReceiptRaw(path) }
}

export function parseWebkassaResponse (body: string): Record<string, string | null> | null {
  let result: Record<string, string | null> | null = null
  const index = body.indexOf('function GoToOFDWebsite')
  // No captured fixture covers this older script-based redirect; the HTML fixture covers the branch below.
  if (index >= 0) {
    const str = body.slice(index, Math.min(body.length, index + 230))
    result = {}
    for (const name of [
      'fiscalNumber',
      'cashboxNumber',
      'totalSum',
      'purchaseTime'
    ]) {
      const match = str.match(new RegExp(`var ${name} = '([^']+)';`))
      const value = (match != null) ? match[1].trim() : ''
      if (!(value.length > 0)) {
        return null
      }
      result[name] = value
    }
  } else if (body.includes('id="ticket-pdf"')) {
    result = {}
    const fields: Array<[string, () => string | null]> = [
      [
        'fiscalNumber',
        () => {
          const m = body.match(/Фискальный признак:\s?(\d+)/)
          return (m != null) && (m.length !== 0) ? m[1] : null
        }
      ],
      [
        'cashboxNumber',
        () => {
          const m = body.match(/Код ККМ КГД \(РНМ\):\s*(\d+)/)
          return (m != null) && (m.length !== 0) ? m[1] : null
        }
      ],
      [
        'totalSum',
        () => {
          const m = body.match(/ИТОГО:\s+([\d.,&#;]+)/)
          return (m != null) && (m.length !== 0) ? m[1].replace(/&#160;/g, '').replace(',', '.') : null
        }
      ],
      [
        'purchaseTime',
        () => {
          const m = body.match(/Время: (\d{2}).(\d{2}).(\d{4})\s(\d{2}).(\d{2}).(\d{2})/)
          return (m != null) && (m.length !== 0) && ((m[6]?.length ?? 0) > 0) ? `${m[3]}${m[2]}${m[1]}T${m[4]}${m[5]}${m[6]}` : null
        }
      ]
    ]
    for (const [name, process] of fields) {
      result[name] = process()
    }
  }

  return result
}
