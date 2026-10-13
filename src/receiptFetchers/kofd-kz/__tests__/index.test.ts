import fixture from './convertReceipt-01.json'

jest.mock('../api', () => ({ fetchReceipt: jest.fn() }))
jest.mock('../converters', () => ({ convertReceipt: jest.fn() }))

const { fetchReceipt } = jest.requireActual<typeof import('../index')>('../index')
const { fetchReceipt: fetchReceiptApi } = jest.requireMock<typeof import('../api')>('../api')
const { convertReceipt } = jest.requireMock<typeof import('../converters')>('../converters')

const args: Parameters<typeof fetchReceipt>[0] = {
  code: { format: 'qr', value: 'https://cabinet.kofd.kz/consumer/?i=727064057371&f=010101779476&s=1484.00&t=20220920T101117' },
  isInBackground: false
}
afterEach(() => { jest.resetAllMocks() })

// Lookup outcomes must pass through without invoking conversion.
test.each(['notApplicable', 'notFound', 'pending'] as const)('[model] preserves %s without conversion', async status => {
  jest.mocked(fetchReceiptApi).mockResolvedValue({ status })
  await expect(fetchReceipt(args)).resolves.toEqual({ status })
  expect(convertReceipt).not.toHaveBeenCalled()
})

// A converter failure must reject the operation with the original error.
test('[model] conversion failures remain errors', async () => {
  const failure = new Error('conversion failed')
  jest.mocked(fetchReceiptApi).mockResolvedValue({ status: 'found', data: fixture })
  jest.mocked(convertReceipt).mockImplementation(() => { throw failure })
  await expect(fetchReceipt(args)).rejects.toBe(failure)
})
