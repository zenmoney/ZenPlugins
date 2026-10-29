import { hasHost, queryParams } from '../../common/receiptFetcher/receipt'
import get from '../../types/get'
import { fetchReceipt as fetchReceiptRaw } from './fetchApi'

const isDocumentId = (value: unknown): value is string => typeof value === 'string' && value.length === 24 && /^[A-Za-z0-9]{24}$/.test(value)

function parseDocumentId (code: string): string | undefined {
  if (isDocumentId(code)) return code
  const { documentId } = queryParams(code)
  if (documentId !== undefined && !isDocumentId(documentId)) return undefined
  if (hasHost(code, ['receipts.ikassa.by'])) {
    let url: URL
    try { url = new URL(code) } catch (error) {
      if (get(error, 'name') === 'TypeError') return undefined
      throw error
    }
    const pathId = url.pathname.match(/^\/render\/([A-Za-z0-9]{24})\/?$/)?.[1]
    if (pathId !== undefined) return documentId === undefined || pathId === documentId ? pathId : undefined
  }
  return documentId
}

export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown, documentId: string } | { status: 'notApplicable' | 'notFound' }> {
  const documentId = parseDocumentId(code)
  if (documentId === undefined) return { status: 'notApplicable' }
  const response = await fetchReceiptRaw(documentId)
  // Observed for a missing UID on 2026-10-25; a generic 400 is not absence.
  if (response.status === 400 && typeof response.body === 'string' && response.body.startsWith('{')) {
    const error: unknown = JSON.parse(response.body)
    if (get(error, 'code') === 'unknown' && get(error, 'message') === 'no rows in result set') return { status: 'notFound' }
  }
  assert(response.status >= 200 && response.status < 300, 'Unexpected receipt HTTP status', { status: response.status })
  return { status: 'found', data: response.body, documentId }
}
