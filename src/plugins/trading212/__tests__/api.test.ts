import { ExportData, Preferences } from '../models'

const mockFetch = jest.fn()
const mockListExports = jest.fn()
const mockRequestExport = jest.fn()

jest.mock('../../../common/network', () => ({ fetch: mockFetch }))
jest.mock('../fetchApi', () => ({
  fetchAccountSummary: jest.fn(),
  listExports: mockListExports,
  requestExport: mockRequestExport
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { fetchTransactions } = require('../api') as typeof import('../api')

const preferences: Preferences = {
  apiKey: 'test-key',
  apiSecret: 'test-secret',
  roundUpTransactions: false,
  investCashback: false
}

const report = (status: ExportData['status'], downloadLink = ''): ExportData => ({
  reportId: 123,
  dataIncluded: {
    includeOrders: false,
    includeDividends: true,
    includeInterest: true,
    incudeTransactions: true
  },
  timeFrom: '2025-01-01T00:00:00.000Z',
  timeTo: '2026-01-01T00:00:00.000Z',
  status,
  downloadLink
})

describe('fetchTransactions', () => {
  let setTimeoutSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation(((callback: () => void) => {
      callback()
      return 0
    }) as typeof setTimeout)
    mockRequestExport.mockResolvedValue({ reportId: 123 })
  })

  afterEach(() => {
    setTimeoutSpy.mockRestore()
  })

  it('checks every 60 seconds until the report is finished', async () => {
    mockListExports
      .mockResolvedValueOnce([report('Queued')])
      .mockResolvedValueOnce([report('Running')])
      .mockResolvedValueOnce([report('Finished', 'https://example.com/report.csv')])
    mockFetch.mockResolvedValue({
      status: 200,
      url: 'https://example.com/report.csv',
      headers: {},
      body: 'ID,Action\ntransaction-1,Deposit'
    })

    await expect(fetchTransactions(preferences)).resolves.toEqual([
      { ID: 'transaction-1', Action: 'Deposit' }
    ])
    expect(mockListExports).toHaveBeenCalledTimes(3)
    expect(setTimeoutSpy).toHaveBeenCalledTimes(3)
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 60000)
  })

  it('fails after five unsuccessful checks', async () => {
    mockListExports.mockResolvedValue([report('Processing')])

    await expect(fetchTransactions(preferences)).rejects.toThrow('Export took too long, try a shorter period')
    expect(mockListExports).toHaveBeenCalledTimes(5)
    expect(setTimeoutSpy).toHaveBeenCalledTimes(5)
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
