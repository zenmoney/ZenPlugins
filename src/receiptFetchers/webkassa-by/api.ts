import { parsePdf } from '../../common/pdfUtils'
import { queryParams } from '../../common/receiptFetcher/receipt'
import { fiscalUid, ikassaRenderLink, webkassaLink } from './codeMatchers'
import { fetchReceipt as fetchReceiptRaw } from './fetchApi'

function parseUid (code: string): string | undefined {
  if (fiscalUid.test(code)) return code
  const webkassaUid = webkassaLink.exec(code)?.[1]
  if (webkassaUid !== undefined) return webkassaUid

  const renderUid = ikassaRenderLink.exec(code)?.[1]
  const { documentId } = queryParams(code)
  if (documentId === undefined) return renderUid
  if (typeof documentId !== 'string' || !fiscalUid.test(documentId)) return undefined
  if (renderUid !== undefined && renderUid.toUpperCase() !== documentId.toUpperCase()) return undefined
  return documentId
}

export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown, uid: string } | { status: 'notApplicable' | 'notFound' }> {
  const uid = parseUid(code)?.toUpperCase()
  if (uid === undefined) return { status: 'notApplicable' }
  // The public endpoint looks up the uppercase fiscal UID case-sensitively.
  const bytes = await fetchReceiptRaw(uid)
  if (bytes === undefined) return { status: 'notFound' }
  const parsed = await parsePdf({ arrayBuffer: async () => bytes })
  return { status: 'found', data: parsed.text, uid }
}
