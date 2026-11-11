import { load } from 'cheerio'
import { fetch } from '../../common/network'

export async function fetchReceipt (code: string): Promise<unknown> {
  const response = await fetch(code, {
    sanitizeRequestLog: { headers: { Authorization: true, Cookie: true } },
    sanitizeResponseLog: {
      headers: { Authorization: true, Cookie: true, 'Set-Cookie': true },
      body: (body: unknown) => {
        if (typeof body !== 'string') return body
        const $ = load(body)
        $('tr').each((_, row) => {
          const cells = $(row).children('td')
          if (cells.first().text().trim() === 'ЕПЗ') {
            const card = cells.eq(1)
            const value = card.text().trim()
            if (/^\d(?:[ -]?\d){12,18}$/.test(value)) card.text(value.replace(/\d(?=(?:[ -]?\d){4})/g, 'X'))
          }
        })
        return $.html({ decodeEntities: false })
      }
    }
  })
  assert(response.status === 200, 'Unexpected receipt HTTP status', { status: response.status })
  return response.body
}
