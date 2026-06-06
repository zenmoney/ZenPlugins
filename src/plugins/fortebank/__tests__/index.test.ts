/* eslint-disable @typescript-eslint/no-var-requires */

// Mock ZenMoney global
global.ZenMoney = {
  pickDocuments: jest.fn(),
  trace: jest.fn(),
  setDebug: jest.fn(),
  request: jest.fn(),
  saveData: jest.fn(),
  getData: jest.fn(),
  retrieveData: jest.fn(),
  setData: jest.fn(),
  getPreferences: jest.fn(),
  setDefaultPreferences: jest.fn(),
  getLevel: jest.fn().mockReturnValue(0)
} as any

describe('Fortebank KZ Scraper', () => {
  let scrape: any
  let readPdfTextsSequentially: any
  let relinkInternalTransfers: any
  let parsePdfMock: jest.Mock
  let isAccountStatementMock: jest.Mock
  let isDepositStatementMock: jest.Mock
  let parseAccountHeaderMock: jest.Mock
  let parseAccountTransactionsMock: jest.Mock
  let detectLocaleMock: jest.Mock
  let splitSectionsMock: jest.Mock
  let parseHeaderMock: jest.Mock
  let parseTransactionsMock: jest.Mock
  let convertAccountMock: jest.Mock
  let convertDepositMock: jest.Mock
  let convertTransactionMock: jest.Mock

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    ; (global.ZenMoney.pickDocuments as jest.Mock).mockResolvedValue(['blob'])

    parsePdfMock = jest.fn()
    isAccountStatementMock = jest.fn()
    isDepositStatementMock = jest.fn()
    parseAccountHeaderMock = jest.fn()
    parseAccountTransactionsMock = jest.fn()
    detectLocaleMock = jest.fn()
    splitSectionsMock = jest.fn()
    parseHeaderMock = jest.fn()
    parseTransactionsMock = jest.fn()
    convertAccountMock = jest.fn()
    convertDepositMock = jest.fn()
    convertTransactionMock = jest.fn()

    // Mock pdfUtils
    jest.doMock('../../../common/pdfUtils', () => ({
      __esModule: true,
      parsePdf: parsePdfMock
    }))

    // Mock account-parser
    jest.doMock('../account-parser', () => ({
      __esModule: true,
      isAccountStatement: isAccountStatementMock,
      parseAccountHeader: parseAccountHeaderMock,
      parseAccountTransactions: parseAccountTransactionsMock
    }))

    jest.doMock('../deposit-parser', () => ({
      __esModule: true,
      isDepositStatement: isDepositStatementMock,
      parseDepositHeader: jest.fn().mockReturnValue({})
    }))

    // Mock parser
    jest.doMock('../parser', () => ({
      __esModule: true,
      detectLocale: detectLocaleMock,
      splitSections: splitSectionsMock,
      parseHeader: parseHeaderMock,
      parseTransactions: parseTransactionsMock
    }))

    // Mock converters
    jest.doMock('../converters', () => ({
      __esModule: true,
      convertAccount: convertAccountMock,
      convertDeposit: convertDepositMock,
      convertTransaction: convertTransactionMock
    }))

    // Import the module under test
    const index = require('../index')
    scrape = index.scrape
    readPdfTextsSequentially = index.readPdfTextsSequentially
    relinkInternalTransfers = index.relinkInternalTransfers

    // Default mock behaviors
    parsePdfMock.mockResolvedValue({ text: 'mock pdf text' })
    convertAccountMock.mockReturnValue({ id: 'acc1', title: 'Test Account', syncIds: [] })
    convertDepositMock.mockReturnValue({ id: 'dep1', title: 'Test Deposit', syncIds: [] })
    convertTransactionMock.mockReturnValue({ date: '2025-01-01', amount: 100 })
    parseAccountHeaderMock.mockReturnValue({})
    parseAccountTransactionsMock.mockReturnValue([])
    parseHeaderMock.mockReturnValue({})
    parseTransactionsMock.mockReturnValue([])
    splitSectionsMock.mockReturnValue({ header: '', transactions: '', attic: '' })
    detectLocaleMock.mockReturnValue('ru')
    isDepositStatementMock.mockReturnValue(false)
  })

  it('should use account-parser if isAccountStatement returns true', async () => {
    // Setup
    isAccountStatementMock.mockReturnValue(true)

    // Execute
    await scrape({} as any)

    // Assert
    expect(isAccountStatementMock).toHaveBeenCalledWith('mock pdf text')
    expect(parseAccountHeaderMock).toHaveBeenCalled()
    expect(parseAccountTransactionsMock).toHaveBeenCalled()

    // Check that standard parser functions were NOT called
    expect(detectLocaleMock).not.toHaveBeenCalled()
  })

  it('should use standard parser if isAccountStatement returns false', async () => {
    // Setup
    isAccountStatementMock.mockReturnValue(false)

    // Execute
    await scrape({} as any)

    // Assert
    expect(isAccountStatementMock).toHaveBeenCalledWith('mock pdf text')

    // Check that standard parser functions WERE called
    expect(detectLocaleMock).toHaveBeenCalledWith('mock pdf text')
    expect(splitSectionsMock).toHaveBeenCalled()
    expect(parseHeaderMock).toHaveBeenCalled()
    expect(parseTransactionsMock).toHaveBeenCalled()

    // Check that account parser functions were NOT called
    expect(parseAccountHeaderMock).not.toHaveBeenCalled()
    expect(parseAccountTransactionsMock).not.toHaveBeenCalled()
  })

  it('should handle errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })
    parsePdfMock.mockRejectedValue(new Error('PDF Error'))

    await expect(scrape({} as any)).rejects.toThrow('PDF Error')
    consoleSpy.mockRestore()
  })

  it('should read pdfs sequentially', async () => {
    let resolveFirst: ((value: { text: string }) => void) | undefined

    parsePdfMock
      .mockImplementationOnce(async () => await new Promise(resolve => {
        resolveFirst = resolve
      }))
      .mockResolvedValueOnce({ text: 'second pdf text' })

    const promise = readPdfTextsSequentially(['first-blob', 'second-blob'] as any)

    await Promise.resolve()

    expect(parsePdfMock).toHaveBeenCalledTimes(1)
    expect(parsePdfMock).toHaveBeenNthCalledWith(1, 'first-blob')

    resolveFirst?.({ text: 'first pdf text' })

    await expect(promise).resolves.toEqual(['first pdf text', 'second pdf text'])
    expect(parsePdfMock).toHaveBeenCalledTimes(2)
    expect(parsePdfMock).toHaveBeenNthCalledWith(2, 'second-blob')
  })

  it('should relink counterpart movement to known internal account by sync id', () => {
    const accounts = [
      { id: 'card-1', syncIds: ['KZ000000000000000001'] },
      { id: 'deposit-1', syncIds: ['KZ000000000000000003'] }
    ]

    const transactions = [{
      date: new Date('2026-04-13T00:00:00.000Z'),
      hold: false,
      merchant: null,
      comment: 'Перевод',
      movements: [
        {
          id: null,
          account: { id: 'card-1' },
          invoice: null,
          sum: -99.98,
          fee: 0
        },
        {
          id: null,
          account: {
            type: 'checking',
            instrument: 'KZT',
            company: null,
            syncIds: ['KZ000000000000000003']
          },
          invoice: null,
          sum: 99.98,
          fee: 0
        }
      ]
    }]

    const [transaction] = relinkInternalTransfers(accounts, transactions)
    expect(transaction.movements[1].account).toEqual({ id: 'deposit-1' })
  })
})
