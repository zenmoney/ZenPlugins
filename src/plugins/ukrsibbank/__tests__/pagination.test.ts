import fetchMock from 'fetch-mock'

const { fetchTransactions }: {
  fetchTransactions: (session: object, from: Date, to: Date) => Promise<unknown[]>
} = jest.requireActual('../api')

const url = 'https://online.ukrsibbank.com/clientendpoint/product/transactions'
const from = new Date('2026-10-01T00:00:00+03:00')
const to = new Date('2026-11-05T12:00:00+02:00')
const session = {
  authState: {
    device: { deviceId: 'model-device' },
    authorization: 'model-authorization',
    refreshToken: 'model-refresh'
  },
  isInBackground: false
}

// Official AppGallery C114447209, com.ukrsibbank.uso.android 2.261.0, inspected 2026-11-05.
// APK SHA-256: 0a22dbcd22082f9259e8b7625f1ec70ecede8ed287f4ef42ece6640ca610d733.
// kii.a (SyncServiceImpl.loadOperHistory) sends count=300, advances offset by the received
// count and stops below 300. rf1.u/u9 sends TransactionRequest as JSON to /product/transactions.
// These transport models use opaque IDs only; they do not claim bank conversion coverage.
describe('[model] UKRSIB pagination follows the official client page boundary', () => {
  beforeEach(() => {
    global.ZenMoney = { features: {} } as unknown as typeof ZenMoney
  })
  afterEach(() => { fetchMock.restore() })

  it('completes a 152-record page without requesting the same history again', async () => {
    // Report 197998 failed at offset=152/count=152 with the former 50-record boundary.
    const page = Array.from({ length: 152 }, (_, index) => ({ id: `model-${index}` }))
    fetchMock.postOnce(url, page)

    await expect(fetchTransactions(session, from, to)).resolves.toEqual(page)
    expect(fetchMock.calls(url)).toHaveLength(1)
    expect(JSON.parse(String(fetchMock.lastOptions(url)?.body))).toEqual({
      dateFrom: from.getTime(), dateTo: to.getTime(), offset: 0, count: 300
    })
  })

  it('continues after a full page and retains the final operation', async () => {
    const page = Array.from({ length: 300 }, (_, index) => ({ id: `model-${index}` }))
    const last = { id: 'model-last' }
    fetchMock.postOnce(url, page)
    fetchMock.postOnce(url, [last], { overwriteRoutes: false })

    await expect(fetchTransactions(session, from, to)).resolves.toEqual([...page, last])
    expect(fetchMock.calls(url)).toHaveLength(2)
    expect(JSON.parse(String(fetchMock.lastOptions(url)?.body))).toEqual({
      dateFrom: from.getTime(), dateTo: to.getTime(), offset: 300, count: 300
    })
  })

  it('rejects repeated full pages instead of returning incomplete history', async () => {
    const page = Array.from({ length: 300 }, (_, index) => ({ id: `model-${index}` }))
    fetchMock.post(url, page)

    await expect(fetchTransactions(session, from, to)).rejects.toThrow('UKRSIB transaction pagination repeated a full page')
    expect(fetchMock.calls(url)).toHaveLength(2)
  })
})
