import { parsePdf } from '../../common/pdfUtils'
import { fiscalUid, webkassaLink } from './codeMatchers'
import { fetchReceipt as fetchReceiptRaw } from './fetchApi'

export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown, uid: string } | { status: 'notApplicable' | 'notFound' }> {
  const uid = (fiscalUid.test(code) ? code : webkassaLink.exec(code)?.[1])?.toUpperCase()
  if (uid === undefined) return { status: 'notApplicable' }
  // The public endpoint looks up the uppercase fiscal UID case-sensitively.
  const bytes = await fetchReceiptRaw(uid)
  if (bytes === undefined) return { status: 'notFound' }
  const parsed = await parsePdf({ arrayBuffer: async () => bytes })
  return { status: 'found', data: parsed.text, uid }
}
