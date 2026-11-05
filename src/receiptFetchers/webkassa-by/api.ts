import { parsePdf } from '../../common/pdfUtils'
import { fetchReceipt as fetchReceiptRaw } from './fetchApi'

export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown } | { status: 'notApplicable' }> {
  const match = code.match(/^https:\/\/webkassa\.by\/p\?uid=([A-Fa-f0-9]{24})$/)
  if (match === null) return { status: 'notApplicable' }
  const bytes = await fetchReceiptRaw(match[1])
  const parsed = await parsePdf({ arrayBuffer: async () => bytes })
  return { status: 'found', data: parsed.text }
}
