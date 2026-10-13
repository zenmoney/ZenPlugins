import { hasHost, queryParams } from '../../common/receiptFetcher/receipt'
import { verifyInvoice } from './fetchApi'
export async function fetchReceipt (code: string): Promise<{ status: 'found', data: unknown } | { status: 'notApplicable' | 'notFound' | 'pending' }> {
  if (!hasHost(code, ['mapr.tax.gov.me'])) return { status: 'notApplicable' }
  const { iic, crtd, tin } = queryParams(code)
  if (typeof iic !== 'string' || iic.length === 0 || typeof crtd !== 'string' || crtd.length === 0 || typeof tin !== 'string' || tin.length === 0) return { status: 'notApplicable' }
  const data = await verifyInvoice({ iic, dateTimeCreated: crtd, tin })
  return data === null ? { status: 'notFound' } : { status: 'found', data }
}
