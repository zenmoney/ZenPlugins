import { parsePdf } from '../../common/pdfUtils'
import { fetchReceipt as fetchReceiptRaw } from './fetchApi'

export async function fetchReceipt (code: string): Promise<Awaited<ReturnType<typeof fetchReceiptByUid>> | { status: 'notApplicable' }> {
  const match = code.match(/^https:\/\/webkassa\.by\/p\?uid=([A-Fa-f0-9]{24})$/)
  if (match === null) return { status: 'notApplicable' }
  return await fetchReceiptByUid(match[1])
}

export async function fetchReceiptByUid (uid: string): Promise<{ status: 'found', data: unknown } | { status: 'notFound' }> {
  // The public endpoint looks up the uppercase fiscal UID case-sensitively.
  const bytes = await fetchReceiptRaw(uid.toUpperCase())
  if (bytes === undefined) return { status: 'notFound' }
  const parsed = await parsePdf({ arrayBuffer: async () => bytes })
  return { status: 'found', data: parsed.text }
}
