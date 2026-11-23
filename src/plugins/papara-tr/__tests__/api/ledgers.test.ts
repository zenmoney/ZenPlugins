import fetchMock from 'fetch-mock'
import { fetchLedgers } from '../../api'
import { ZPAPIError } from '../../../../errors'

const URL = 'https://webapi.papara.com/user/ledgers'

type Call = [string, RequestInit | undefined]
function requestedPages (): number[] {
  return (fetchMock.calls() as unknown as { matched: Call[] }).matched
    .map(([, options]) => (JSON.parse(String(options?.body)) as { page: number }).page)
}

// Page 1 dates and totalPageCount are reduced from the observed 2026-11-24 ledgers response
// (prototype build); only `id` and `createdAt` decide pagination, so the other fields are omitted.
const observedPage1 = {
  data: {
    totalPageCount: 121,
    totalItemCount: 0,
    items: [
      { id: 4459780203, createdAt: '2026-11-21T16:33:32.263' },
      { id: 4459780189, createdAt: '2026-11-21T16:33:30.017' },
      { id: 4459645743, createdAt: '2026-11-21T08:47:22.277' },
      { id: 4459211739, createdAt: '2026-11-19T23:50:50.373' },
      { id: 4459211731, createdAt: '2026-11-19T23:50:48.720' },
      { id: 4459095943, createdAt: '2026-11-19T18:26:58.887' },
      { id: 4459095937, createdAt: '2026-11-19T18:26:58.003' },
      { id: 4459079162, createdAt: '2026-11-19T17:50:14.340' },
      { id: 4459079143, createdAt: '2026-11-19T17:50:12.707' },
      { id: 4458984027, createdAt: '2026-11-19T13:57:45.007' }
    ]
  },
  succeeded: true,
  error: null
}

describe('ledger pagination', () => {
  afterEach(() => { fetchMock.restore() })

  it('stops after the page containing an operation older than fromDate', async () => {
    fetchMock.post(URL, observedPage1)
    const items = await fetchLedgers('token', new Date('2026-11-19T14:00:00+03:00'))
    expect(items).toEqual(observedPage1.data.items)
    expect(requestedPages()).toEqual([1])
  })

  it('[model] requests the next page while every operation is at or after fromDate', async () => {
    // Model: page 2 was not captured; an operation exactly at fromDate is in scope and does not end paging.
    const page2 = { data: { totalPageCount: 121, totalItemCount: 0, items: [{ id: 2, createdAt: '2026-11-18T10:00:00.000' }] }, succeeded: true, error: null }
    fetchMock.post(URL, (_url: string, options: RequestInit) => JSON.parse(String(options.body)).page === 1 ? observedPage1 : page2)
    const items = await fetchLedgers('token', new Date('2026-11-19T13:57:45.007+03:00'))
    expect(items).toEqual([...observedPage1.data.items, ...page2.data.items])
    expect(requestedPages()).toEqual([1, 2])
  })

  it('[model] stops at totalPageCount when the whole history is newer than fromDate', async () => {
    // Model of the documented termination field with a synthetic two-page history.
    const pages: Record<number, unknown> = {
      1: { data: { totalPageCount: 2, totalItemCount: 0, items: [{ id: 3, createdAt: '2026-11-21T10:00:00.000' }] }, succeeded: true, error: null },
      2: { data: { totalPageCount: 2, totalItemCount: 0, items: [{ id: 2, createdAt: '2026-11-20T10:00:00.000' }] }, succeeded: true, error: null }
    }
    fetchMock.post(URL, (_url: string, options: RequestInit) => pages[JSON.parse(String(options.body)).page as number])
    const items = await fetchLedgers('token', new Date('2020-01-01T00:00:00'))
    expect(items).toEqual([{ id: 3, createdAt: '2026-11-21T10:00:00.000' }, { id: 2, createdAt: '2026-11-20T10:00:00.000' }])
    expect(requestedPages()).toEqual([1, 2])
  })

  it('fails the whole history load on an error page', async () => {
    // Observed 2026-11-24 response to pageSize 50; a page error must not yield partial history.
    fetchMock.post(URL, { succeeded: false, error: { message: 'Bir hata oluştu. Ekibimiz konu ile ilgili bilgilendirildi. Lütfen daha sonra tekrar dene.', code: 999 } })
    let error: unknown
    try { await fetchLedgers('token', new Date('2026-11-01T00:00:00+03:00')) } catch (e) { error = e }
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(String(error)).toContain('Unexpected Papara ledgers response')
    expect(String(error)).toContain('999')
  })

  it('sends the page size accepted by the server and requests all currencies at once', async () => {
    fetchMock.post(URL, observedPage1)
    await fetchLedgers('token', new Date('2026-11-21T00:00:00+03:00'))
    const [, options] = (fetchMock.calls() as unknown as { matched: Call[] }).matched[0]
    expect(JSON.parse(String(options?.body))).toEqual({ pageSize: 10, page: 1, currency: null, category: null })
    expect((options?.headers as Record<string, string>).Authorization).toBe('Bearer token')
  })

  it('propagates the observed device rejection of a saved token as an ordinary error', async () => {
    // Observed 2026-11-26: user/ledgers answered 401 with code 1528 when the device cookie was missing.
    fetchMock.post(URL, { status: 401, body: { succeeded: false, error: { data: null, message: 'Cihaz bilgileri teyit edilemedi.', code: 1528, externalCode: null, externalMessage: null }, result: null, traceId: null } })
    const error = await fetchLedgers('token', new Date('2026-11-12T00:00:00+03:00')).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(String(error)).toContain('user/ledgers')
  })
})
