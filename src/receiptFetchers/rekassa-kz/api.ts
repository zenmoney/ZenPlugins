import { parsePdf } from '../../common/pdfUtils'
import { fetchReceipt as fetchReceiptRaw } from './fetchApi'

export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown } | { status: 'notApplicable' }> {
  if (!/^https:\/\/ofd\.rekassa\.kz\/t\/?\?[^\s#]+$/.test(code)) return { status: 'notApplicable' }
  const bytes = await fetchReceiptRaw(code)
  const parsed = await parsePdf({ arrayBuffer: async () => bytes })
  return { status: 'found', data: parsed.text }
}
