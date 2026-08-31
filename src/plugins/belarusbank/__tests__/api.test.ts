import { convertAccount, convertCard } from '../converters'
import { UserInteractionError } from '../../../errors'
import type { AuthState } from '../models'

// Test records are synthetic and must not be copied from real bank data.
const mockFetchApi = jest.fn()
const mockParsePdf = jest.fn()

jest.mock('../fetchApi', () => ({
  fetchApi: mockFetchApi
}))
jest.mock('../../../common/pdfUtils', () => ({
  parsePdf: mockParsePdf
}))

const { authenticate, getCardTransactions, getGeneralPaymentHistory, getPaymentHistory, getProducts, getStatementTransactions, isCardLinkedToAccount } = jest.requireActual<typeof import('../api')>('../api')
const auth: AuthState = {
  login: 'test-login',
  sessionToken: 'session-token',
  refreshToken: 'refresh-token',
  tokenType: 'Bearer'
}

describe('Belarusbank API', () => {
  beforeEach(() => {
    mockFetchApi.mockReset()
    mockParsePdf.mockReset()
  })

  it('does not start an interactive SMS login during a background sync', async () => {
    const pluginData: Record<string, unknown> = {}
    Object.defineProperty(globalThis, 'ZenMoney', {
      configurable: true,
      value: {
        getData: jest.fn((key: string, defaultValue: unknown) => pluginData[key] ?? defaultValue),
        setData: jest.fn((key: string, value: unknown) => { pluginData[key] = value }),
        saveData: jest.fn()
      } as unknown as typeof ZenMoney
    })
    mockFetchApi.mockResolvedValue({ status: 401, body: {} })

    await expect(authenticate({ login: 'test-login', password: 'test-password' }, true)).rejects.toBeInstanceOf(UserInteractionError)
    expect(mockFetchApi).toHaveBeenCalledTimes(2)
    expect(mockFetchApi).toHaveBeenNthCalledWith(1, 'users/auth/login', expect.objectContaining({ retry: false }))
    expect(mockFetchApi).toHaveBeenNthCalledWith(2, 'users/auth/login/preparation', expect.objectContaining({
      query: { loginMode: 'PIN' },
      retry: false
    }))
  })

  it('tries direct cold-start login before SMS when plugin data is empty', async () => {
    const pluginData: Record<string, unknown> = {}
    Object.defineProperty(globalThis, 'ZenMoney', {
      configurable: true,
      value: {
        getData: jest.fn((key: string, defaultValue: unknown) => pluginData[key] ?? defaultValue),
        setData: jest.fn((key: string, value: unknown) => { pluginData[key] = value }),
        saveData: jest.fn()
      } as unknown as typeof ZenMoney
    })
    mockFetchApi.mockResolvedValue({
      status: 200,
      body: {
        sessionToken: 'new-session-token',
        refreshToken: 'new-refresh-token',
        tokenType: 'Bearer'
      }
    })

    await expect(authenticate({ login: 'test-login', password: 'test-password' }, true)).resolves.toMatchObject({
      sessionToken: 'new-session-token',
      refreshToken: 'new-refresh-token'
    })
    expect(mockFetchApi).toHaveBeenCalledTimes(1)
    expect(mockFetchApi).toHaveBeenCalledWith('users/auth/login', expect.objectContaining({
      method: 'POST',
      body: expect.objectContaining({
        login: 'test-login',
        password: 'test-password'
      }),
      retry: false
    }))
  })

  it('re-authenticates with stored credentials without SMS after refresh expires', async () => {
    const setData = jest.fn()
    const saveData = jest.fn()
    Object.defineProperty(globalThis, 'ZenMoney', {
      configurable: true,
      value: {
        getData: jest.fn((key: string) => key === 'belarusbankAuth' ? auth : 'device-uid'),
        setData,
        saveData
      } as unknown as typeof ZenMoney
    })
    mockFetchApi
      .mockResolvedValueOnce({ status: 401, body: {} })
      .mockResolvedValueOnce({
        status: 200,
        body: {
          sessionToken: 'new-session-token',
          refreshToken: 'new-refresh-token',
          tokenType: 'Bearer'
        }
      })

    await expect(authenticate({ login: 'test-login', password: 'test-password' }, true)).resolves.toMatchObject({
      sessionToken: 'new-session-token',
      refreshToken: 'new-refresh-token'
    })
    expect(mockFetchApi).toHaveBeenNthCalledWith(2, 'users/auth/login', {
      method: 'POST',
      body: expect.objectContaining({
        login: 'test-login',
        password: 'test-password'
      }),
      retry: false
    })
    expect(setData).toHaveBeenCalledWith('belarusbankAuth', expect.objectContaining({
      sessionToken: 'new-session-token',
      refreshToken: 'new-refresh-token'
    }))
    expect(saveData).toHaveBeenCalledTimes(1)
  })

  it('uses the official PIN login mode without sending the local PIN to the bank', async () => {
    const setData = jest.fn()
    Object.defineProperty(globalThis, 'ZenMoney', {
      configurable: true,
      value: {
        getData: jest.fn((key: string) => key === 'belarusbankAuth' ? auth : 'device-uid'),
        setData,
        saveData: jest.fn()
      } as unknown as typeof ZenMoney
    })
    mockFetchApi
      .mockResolvedValueOnce({ status: 401, body: {} })
      .mockResolvedValueOnce({ status: 401, body: {} })
      .mockResolvedValueOnce({ status: 200, body: { requestId: 'trusted-request-id' } })
      .mockResolvedValueOnce({
        status: 200,
        body: {
          sessionToken: 'new-session-token',
          refreshToken: 'new-refresh-token',
          tokenType: 'Bearer'
        }
      })

    await expect(authenticate({ login: 'test-login', password: 'test-password' }, true)).resolves.toMatchObject({
      sessionToken: 'new-session-token',
      refreshToken: 'new-refresh-token'
    })
    expect(mockFetchApi).toHaveBeenNthCalledWith(3, 'users/auth/login/preparation', {
      method: 'POST',
      query: { loginMode: 'PIN' },
      body: expect.objectContaining({
        login: 'test-login',
        password: 'test-password'
      }),
      retry: false
    })
    expect(mockFetchApi).toHaveBeenNthCalledWith(4, 'users/auth/login/trusted-request-id', {
      method: 'POST',
      body: { requestId: 'trusted-request-id' },
      retry: false
    })
  })

  it('rotates and persists a stored refresh session without SMS', async () => {
    const setData = jest.fn()
    const saveData = jest.fn()
    Object.defineProperty(globalThis, 'ZenMoney', {
      configurable: true,
      value: {
        getData: jest.fn(() => auth),
        setData,
        saveData
      } as unknown as typeof ZenMoney
    })
    mockFetchApi.mockResolvedValue({
      status: 200,
      body: {
        sessionToken: 'rotated-session-token',
        refreshToken: 'rotated-refresh-token',
        tokenType: 'Bearer'
      }
    })

    await expect(authenticate({ login: 'test-login', password: 'test-password' }, true)).resolves.toEqual({
      login: 'test-login',
      sessionToken: 'rotated-session-token',
      refreshToken: 'rotated-refresh-token',
      tokenType: 'Bearer'
    })
    expect(mockFetchApi).toHaveBeenCalledWith('users/auth/refresh-token', {
      method: 'POST',
      body: 'refresh-token',
      rawStringBody: true,
      retry: false
    })
    expect(setData).toHaveBeenCalledWith('belarusbankAuth', {
      login: 'test-login',
      sessionToken: 'rotated-session-token',
      refreshToken: 'rotated-refresh-token',
      tokenType: 'Bearer'
    })
    expect(saveData).toHaveBeenCalledTimes(1)
  })

  it('loads all visible product types and enriches deposit and credit details', async () => {
    mockFetchApi.mockImplementation(async (path: string) => {
      switch (path) {
        case 'cards': return { status: 200, body: { cards: [] } }
        case 'accounts': return { status: 200, body: { accounts: [] } }
        case 'deposits': return {
          status: 200,
          body: {
            accounts: [{
              productId: 'deposit-1',
              contractCurrencyIso: 'BYN',
              contractCurrentRest: '1000'
            }]
          }
        }
        case 'credits': return {
          status: 200,
          body: {
            credits: [{
              productId: 'credit-1',
              contractCurrencyIso: 'BYN'
            }]
          }
        }
        case 'deposits/deposit-1': return {
          status: 200,
          body: {
            productId: 'deposit-1',
            contractCurrencyIso: 'BYN',
            contractCurrentRest: '1000',
            contractOpenDate: '2026-01-01',
            contractEndDate: '2027-01-01',
            percRate: '10'
          }
        }
        case 'credits/credit-1': return {
          status: 200,
          body: {
            productId: 'credit-1',
            contractCurrencyIso: 'BYN',
            contractOpenDate: '2026-01-01',
            returnDate: '2027-01-01',
            contractFirstSum: '500',
            restCredit: '300'
          }
        }
        default: throw new Error(`Unexpected path: ${path}`)
      }
    })

    const products = await getProducts(auth)

    expect(products.map(({ id }) => id)).toEqual(['deposit-1', 'credit-1'])
    expect(products[0]).toMatchObject({
      balance: 1000,
      percent: 10,
      _meta: { productKind: 'deposit' }
    })
    expect(mockFetchApi).toHaveBeenCalledWith('deposits', {
      query: { ibState: 'VISIBLE', refresh: true },
      sessionToken: 'session-token',
      tokenType: 'Bearer'
    })
    expect(mockFetchApi).toHaveBeenCalledWith('deposits/deposit-1', {
      sessionToken: 'session-token',
      tokenType: 'Bearer'
    })
  })

  it('links current accounts to cards and omits standalone current-account products', async () => {
    mockFetchApi.mockImplementation(async (path: string, options?: { query?: { contractNumber?: string } }) => {
      switch (path) {
        case 'cards': {
          const card = {
            productId: 'card-1',
            cardAccountNumber: ' CONTRACT-1 ',
            ibanNum: 'BY00 LINKED',
            currencyIso: 'BYN'
          }
          return {
            status: 200,
            body: {
              cards: options?.query?.contractNumber === 'contract-2' ? [] : [card]
            }
          }
        }
        case 'accounts': return {
          status: 200,
          body: {
            accounts: [{
              productId: 'account-1',
              contractNumber: 'contract-1',
              ibanNum: 'BY00LINKED',
              contractCurrencyIso: 'BYN',
              contractCurrentRest: '456.78'
            }, {
              productId: 'account-unlinked',
              contractNumber: 'contract-2',
              ibanNum: 'BY00UNLINKED',
              contractCurrencyIso: 'BYN'
            }]
          }
        }
        case 'deposits': return { status: 200, body: { accounts: [] } }
        case 'credits': return { status: 200, body: { credits: [] } }
        default: throw new Error(`Unexpected path: ${path}`)
      }
    })

    const products = await getProducts(auth)

    expect(products.map(({ id }) => id)).toEqual(['card-1'])
    expect(products[0].syncIds).toEqual(expect.arrayContaining(['card-1', 'account-1', 'BY00 LINKED', 'BY00LINKED', 'CONTRACT-1', 'contract-1']))
    expect(products[0].balance).toBe(456.78)
    expect(isCardLinkedToAccount({ productId: 'card-1', contractNumber: ' CONTRACT-1 ' }, {
      productId: 'account-1',
      contractNumber: 'contract-1'
    })).toBe(true)
  })

  it('loads card operations by product id with date-only filters', async () => {
    const account = convertCard({
      productId: 'product-1',
      productCardId: 'physical-card-1',
      currencyIso: 'BYN'
    })
    mockFetchApi.mockResolvedValue({
      status: 200,
      body: {
        dataTable: [{
          id: 1,
          authorizationDate: '2026-08-20T10:30:00+03:00',
          operationDirection: 'debit',
          amount: '5',
          currency: 'BYN'
        }],
        total: 1
      }
    })

    const transactions = await getCardTransactions(
      auth,
      account,
      new Date('2026-08-01T12:00:00Z'),
      new Date('2026-08-29T12:00:00Z')
    )

    expect(transactions[0].movements[0].sum).toBe(-5)
    expect(mockFetchApi).toHaveBeenNthCalledWith(1, 'cards/transactions/product-1', {
      method: 'POST',
      query: { page: 1, size: 100 },
      body: {
        dateStart: '2026-08-01',
        dateEnd: '2026-08-29'
      },
      sessionToken: 'session-token',
      tokenType: 'Bearer'
    })
    expect(mockFetchApi).toHaveBeenCalledTimes(1)
  })

  it('does not request card operations when service right 17 is denied', async () => {
    const account = convertCard({
      productId: 'product-1',
      currencyIso: 'BYN',
      serviceRights: '111111111111111110'
    })

    await expect(getCardTransactions(
      auth,
      account,
      new Date('2026-08-01T00:00:00Z'),
      new Date('2026-08-29T00:00:00Z')
    )).resolves.toEqual([])
    expect(mockFetchApi).not.toHaveBeenCalled()
  })

  it('isolates bank code 1094 to one day and keeps transactions from available days', async () => {
    const account = convertCard({ productId: 'product-1', currencyIso: 'BYN' })
    mockFetchApi.mockImplementation(async (_path: string, options: { body?: { dateStart?: string, dateEnd?: string } }) => {
      if (options.body?.dateEnd === '2026-08-29') {
        return {
          status: 400,
          body: {
            errorInfo: {
              code: 1094,
              errorDescription: 'Невозможно сформировать список операций'
            }
          }
        }
      }

      return {
        status: 200,
        body: {
          dataTable: [{
            id: 1,
            authorizationDate: '2026-08-28T12:00:00+03:00',
            operationDirection: 'debit',
            amount: '10.00',
            currency: '933'
          }],
          total: 1
        }
      }
    })

    await expect(getCardTransactions(
      auth,
      account,
      new Date('2026-08-28T00:00:00Z'),
      new Date('2026-08-29T00:00:00Z')
    )).resolves.toEqual([
      expect.objectContaining({
        movements: [expect.objectContaining({ sum: -10 })]
      })
    ])
    expect(mockFetchApi).toHaveBeenCalledTimes(2)
    expect(mockFetchApi.mock.calls.map(([, options]) => options.body)).toEqual([
      { dateStart: '2026-08-28', dateEnd: '2026-08-29' },
      { dateStart: '2026-08-28', dateEnd: '2026-08-28' }
    ])
  })

  it('loads the official card-account statement as binary and parses its text layer', async () => {
    const account = convertCard({ productId: 'product-1', currencyIso: 'RUB' })
    const binary = new ArrayBuffer(8)
    mockFetchApi.mockResolvedValue({ status: 200, body: binary })
    mockParsePdf.mockResolvedValue({
      text: [
        '04.02.2026',
        '08:15:30',
        '04.02.2026456,77 RUB+456,77456,78',
        'Зачисление процентов'
      ].join('\n')
    })

    const transactions = await getStatementTransactions(
      auth,
      account,
      new Date('2025-01-01T00:00:00Z'),
      new Date('2026-08-29T00:00:00Z')
    )

    expect(transactions).toMatchObject([{
      hold: false,
      comment: 'Зачисление процентов',
      movements: [{ sum: 456.77, account: { id: 'product-1' } }]
    }])
    expect(mockFetchApi).toHaveBeenCalledWith('cards/documents/product-1/statement', expect.objectContaining({
      query: { startDate: '2025-01-01', endDate: '2026-08-29' },
      binaryResponse: true
    }))
    expect(mockParsePdf).toHaveBeenCalledWith(expect.objectContaining({ arrayBuffer: expect.any(Function) }))
  })

  it('loads six months of product payment history in one date span', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-08-29T12:00:00Z').getTime())
    const account = convertAccount({
      productId: 'account-1',
      contractCurrencyIso: 'BYN'
    })
    mockFetchApi.mockResolvedValue({
      status: 200,
      body: {
        dataTable: [{
          id: 1,
          paymentName: 'Оплата услуги',
          amount: '5',
          currency: 'BYN',
          time: '2026-03-20T10:30:00+03:00'
        }],
        total: 1
      }
    })

    try {
      const transactions = await getPaymentHistory(
        auth,
        account,
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-08-29T12:00:00Z')
      )

      expect(transactions).toHaveLength(1)
      expect(transactions[0]).toMatchObject({
        comment: 'Оплата услуги',
        movements: [{ sum: -5, account: { id: 'account-1' } }]
      })
      expect(mockFetchApi).toHaveBeenCalledWith('payments/history', {
        method: 'POST',
        query: { page: 1, size: 300 },
        body: {
          dateRangeStartDt: '2026-02-28',
          dateRangeEndDt: '2026-08-29',
          productId: 'account-1',
          productType: 'ACCOUNT',
          refresh: true
        },
        sessionToken: 'session-token',
        tokenType: 'Bearer'
      })
    } finally {
      now.mockRestore()
    }
  })

  it('loads general card history once and maps rows by card number', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-08-29T12:00:00Z').getTime())
    const bynCard = convertCard({ productId: 'byn-card', cardPAN: '**** 1111', currencyIso: 'BYN' })
    const rubCard = convertCard({ productId: 'rub-card', cardPAN: '**** 2222', currencyIso: 'RUB' })
    mockFetchApi.mockResolvedValue({
      status: 200,
      body: {
        dataTable: [{
          id: 1,
          paymentName: 'BYN payment',
          amount: '5',
          currency: 'BYN',
          time: '2026-02-10T10:30:00+03:00',
          cardNumber: '**** 1111'
        }, {
          id: 2,
          paymentName: 'RUB payment',
          amount: '7',
          currency: 'RUB',
          time: '2026-02-11T10:30:00+03:00',
          cardNumber: '**** 2222'
        }],
        total: 2
      }
    })

    try {
      const transactions = await getGeneralPaymentHistory(
        auth,
        [bynCard, rubCard],
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-08-29T12:00:00Z')
      )

      expect(transactions.map((transaction) => transaction.movements[0])).toEqual(expect.arrayContaining([
        expect.objectContaining({ account: { id: 'byn-card' }, sum: -5 }),
        expect.objectContaining({ account: { id: 'rub-card' }, sum: -7 })
      ]))
      expect(mockFetchApi).toHaveBeenCalledTimes(1)
      expect(mockFetchApi).toHaveBeenCalledWith('payments/history', expect.objectContaining({
        body: {
          dateRangeStartDt: '2026-02-28',
          dateRangeEndDt: '2026-08-29',
          productType: 'CARD',
          refresh: true
        }
      }))
    } finally {
      now.mockRestore()
    }
  })

  it('merges payment-history fragments by card, currency and rrn', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-08-29T12:00:00Z').getTime())
    const card = convertCard({ productId: 'card-1', cardPAN: '**** 3333', currencyIso: 'BYN' })
    const fragment = (id: string, amount: string, rrn: string): Record<string, unknown> => ({
      id,
      paymentName: 'Тестовая составная операция',
      amount,
      feeAmount: '0.00',
      currency: 'BYN',
      time: '2026-02-01T10:20:30Z',
      timeBpc: '2026-02-01T10:20:30Z',
      cardNumber: '**** 3333',
      rrn,
      approvalId: 'synthetic-approval',
      channelTypeId: 2,
      paymentId: 'synthetic-payment',
      paymentIdLeaf: 'synthetic-payment-leaf',
      statusType: 'success'
    })
    mockFetchApi.mockResolvedValue({
      status: 200,
      body: {
        dataTable: [
          fragment('zero', '0.00', 'synthetic-composite-rrn'),
          fragment('part-1', '1.25', 'synthetic-composite-rrn'),
          fragment('part-2', '0.15', 'synthetic-composite-rrn'),
          fragment('part-3', '1.25', 'synthetic-composite-rrn'),
          fragment('part-4', '0.15', 'synthetic-composite-rrn'),
          fragment('other-rrn', '5.00', 'different-rrn')
        ],
        total: 6
      }
    })

    try {
      const transactions = await getGeneralPaymentHistory(
        auth,
        [card],
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-08-29T12:00:00Z')
      )

      expect(transactions).toHaveLength(2)
      expect(transactions.map((transaction) => transaction.movements[0].sum)).toEqual([-2.8, -5])
      expect(transactions[0].movements[0].id).toEqual(expect.stringMatching(/^[a-f0-9]{32}$/))
      expect(transactions[0].movements[0].id).not.toBe(transactions[1].movements[0].id)
    } finally {
      now.mockRestore()
    }
  })

  it('does not merge nearby subset sums or equal payments with different rrns', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-08-29T12:00:00Z').getTime())
    const card = convertCard({ productId: 'card-1', cardPAN: '**** 3333', currencyIso: 'BYN' })
    const payment = (id: string, amount: string, rrn: string, time: string): Record<string, unknown> => ({
      id,
      paymentName: 'Отдельная операция',
      amount,
      feeAmount: '0.00',
      currency: 'BYN',
      time,
      timeBpc: time,
      cardNumber: '**** 3333',
      rrn,
      approvalId: `approval-${rrn}`,
      channelTypeId: 2,
      paymentId: 'synthetic-payment',
      paymentIdLeaf: 'synthetic-payment-leaf',
      statusType: 'success'
    })
    mockFetchApi.mockResolvedValue({
      status: 200,
      body: {
        dataTable: [
          payment('subset-1', '12.00', 'rrn-1', '2026-01-10T10:16:14Z'),
          payment('subset-2', '88.00', 'rrn-2', '2026-01-10T10:17:09Z'),
          payment('subset-result', '100.00', 'rrn-3', '2026-01-10T10:18:19Z'),
          payment('equal-1', '250.00', 'rrn-4', '2026-01-11T12:00:00Z'),
          payment('equal-2', '250.00', 'rrn-5', '2026-01-11T12:00:27Z'),
          payment('equal-3', '250.00', 'rrn-6', '2026-01-11T12:00:54Z')
        ],
        total: 6
      }
    })

    try {
      const transactions = await getGeneralPaymentHistory(
        auth,
        [card],
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-08-29T12:00:00Z')
      )

      expect(transactions).toHaveLength(6)
      expect(transactions.map((transaction) => transaction.movements[0].sum)).toEqual([
        -12,
        -88,
        -100,
        -250,
        -250,
        -250
      ])
    } finally {
      now.mockRestore()
    }
  })

  it('retries an empty refreshed payment history from the bank cache', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-08-29T12:00:00Z').getTime())
    const card = convertCard({ productId: 'card-1', cardPAN: '**** 1111', currencyIso: 'BYN' })
    mockFetchApi
      .mockResolvedValueOnce({
        status: 200,
        body: { dataTable: [], total: 0 }
      })
      .mockResolvedValueOnce({
        status: 200,
        body: {
          dataTable: [{
            id: 1,
            paymentName: 'Cached payment',
            amount: '5',
            currency: 'BYN',
            time: '2026-02-10T10:30:00+03:00',
            cardNumber: '**** 1111'
          }],
          total: 1
        }
      })

    try {
      const transactions = await getGeneralPaymentHistory(
        auth,
        [card],
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-08-29T12:00:00Z')
      )

      expect(transactions).toHaveLength(1)
      expect(transactions[0]).toMatchObject({
        comment: 'Cached payment',
        movements: [{ sum: -5, account: { id: 'card-1' } }]
      })
      expect(mockFetchApi).toHaveBeenNthCalledWith(1, 'payments/history', expect.objectContaining({
        query: { page: 1, size: 300 },
        body: expect.objectContaining({ refresh: true })
      }))
      expect(mockFetchApi).toHaveBeenNthCalledWith(2, 'payments/history', expect.objectContaining({
        query: { page: 1, size: 300 },
        body: expect.objectContaining({ refresh: false })
      }))
    } finally {
      now.mockRestore()
    }
  })

  it('paginates card payment history with the card product filter', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-08-29T12:00:00Z').getTime())
    const account = convertCard({
      productId: 'card-1',
      currencyIso: 'BYN'
    })
    mockFetchApi
      .mockResolvedValueOnce({
        status: 200,
        body: {
          dataTable: [{
            id: 1,
            paymentName: 'Платёж 1',
            amount: '5',
            currency: 'BYN',
            time: '2026-03-20T10:30:00+03:00'
          }],
          total: 301
        }
      })
      .mockResolvedValueOnce({
        status: 200,
        body: {
          dataTable: [{
            id: 2,
            paymentName: 'Платёж 2',
            amount: '7',
            currency: 'BYN',
            time: '2026-03-21T10:30:00+03:00'
          }],
          total: 301
        }
      })

    try {
      const transactions = await getPaymentHistory(
        auth,
        account,
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-08-29T12:00:00Z')
      )

      expect(transactions).toHaveLength(2)
      expect(mockFetchApi).toHaveBeenNthCalledWith(1, 'payments/history', expect.objectContaining({
        query: { page: 1, size: 300 },
        body: expect.objectContaining({
          productId: 'card-1',
          productType: 'CARD',
          refresh: true
        })
      }))
      expect(mockFetchApi).toHaveBeenNthCalledWith(2, 'payments/history', expect.objectContaining({
        query: { page: 2, size: 300 },
        body: expect.objectContaining({
          productId: 'card-1',
          productType: 'CARD',
          refresh: false
        })
      }))
    } finally {
      now.mockRestore()
    }
  })

  it('starts with the full range and falls back to periods accepted by the bank', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-02T12:00:00Z').getTime())
    const account = convertCard({
      productId: 'product-1',
      currencyIso: 'BYN'
    })
    mockFetchApi.mockImplementation(async (_path: string, options: { body?: { dateStart?: string, dateEnd?: string } }) => {
      const dateStart = new Date(`${options.body?.dateStart ?? ''}T00:00:00Z`)
      const dateEnd = new Date(`${options.body?.dateEnd ?? ''}T00:00:00Z`)
      const inclusiveDays = Math.round((dateEnd.getTime() - dateStart.getTime()) / (24 * 60 * 60 * 1000)) + 1

      if (inclusiveDays > 15) {
        return {
          status: 400,
          body: { errorInfo: { code: 1094, errorDescription: 'Диапазон не поддерживается' } }
        }
      }

      return {
        status: 200,
        body: { dataTable: [], total: 0 }
      }
    })

    try {
      await getCardTransactions(
        auth,
        account,
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-03-02T00:00:00Z')
      )

      expect(mockFetchApi).toHaveBeenCalledTimes(7)
      expect(mockFetchApi.mock.calls.map((call) => call[1]?.body)).toEqual([
        { dateStart: '2026-01-01', dateEnd: '2026-03-02' },
        { dateStart: '2026-01-01', dateEnd: '2026-03-01' },
        { dateStart: '2026-01-01', dateEnd: '2026-01-15' },
        { dateStart: '2026-01-16', dateEnd: '2026-01-30' },
        { dateStart: '2026-01-31', dateEnd: '2026-02-14' },
        { dateStart: '2026-02-15', dateEnd: '2026-03-01' },
        { dateStart: '2026-03-02', dateEnd: '2026-03-02' }
      ])
    } finally {
      now.mockRestore()
    }
  })

  it('loads the remaining day when a 16-day range is rejected', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-08-29T12:00:00Z').getTime())
    const account = convertCard({ productId: 'product-1', currencyIso: 'BYN' })
    mockFetchApi.mockImplementation(async (_path: string, options: { body?: { dateStart?: string, dateEnd?: string } }) => {
      const dateStart = new Date(`${options.body?.dateStart ?? ''}T00:00:00Z`)
      const dateEnd = new Date(`${options.body?.dateEnd ?? ''}T00:00:00Z`)
      const inclusiveDays = Math.round((dateEnd.getTime() - dateStart.getTime()) / (24 * 60 * 60 * 1000)) + 1

      return inclusiveDays > 15
        ? { status: 400, body: { errorInfo: { code: 1094 } } }
        : { status: 200, body: { dataTable: [], total: 0 } }
    })

    try {
      await getCardTransactions(
        auth,
        account,
        new Date('2026-08-14T00:00:00Z'),
        new Date('2026-08-29T00:00:00Z')
      )

      expect(mockFetchApi.mock.calls.map((call) => call[1]?.body)).toEqual([
        { dateStart: '2026-08-14', dateEnd: '2026-08-29' },
        { dateStart: '2026-08-14', dateEnd: '2026-08-28' },
        { dateStart: '2026-08-29', dateEnd: '2026-08-29' }
      ])
    } finally {
      now.mockRestore()
    }
  })

  it('continues after an unavailable date inside a supported period', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-08-29T12:00:00Z').getTime())
    const account = convertCard({ productId: 'product-1', currencyIso: 'BYN' })
    mockFetchApi.mockImplementation(async (_path: string, options: { body?: { dateStart?: string, dateEnd?: string } }) => {
      const dateStart = options.body?.dateStart ?? ''
      const dateEnd = options.body?.dateEnd ?? ''
      const includesUnavailableDate = dateStart <= '2026-08-08' && dateEnd >= '2026-08-08'

      return includesUnavailableDate
        ? { status: 400, body: { errorInfo: { code: 1094 } } }
        : { status: 200, body: { dataTable: [], total: 0 } }
    })

    try {
      await getCardTransactions(
        auth,
        account,
        new Date('2026-08-01T00:00:00Z'),
        new Date('2026-08-15T00:00:00Z')
      )

      expect(mockFetchApi.mock.calls.map((call) => call[1]?.body)).toEqual(expect.arrayContaining([
        { dateStart: '2026-08-01', dateEnd: '2026-08-07' },
        { dateStart: '2026-08-09', dateEnd: '2026-08-15' }
      ]))
    } finally {
      now.mockRestore()
    }
  })

  it('stops chunk fallback after a whole period remains unavailable', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-02T12:00:00Z').getTime())
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {})
    const warningLog = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const account = convertCard({ productId: 'product-1', currencyIso: 'BYN' })
    mockFetchApi.mockResolvedValue({ status: 400, body: { errorInfo: { code: 1094 } } })

    try {
      await expect(getCardTransactions(
        auth,
        account,
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-02-01T00:00:00Z')
      )).resolves.toEqual([])

      expect(mockFetchApi).toHaveBeenCalledTimes(17)
      expect(mockFetchApi).toHaveBeenLastCalledWith('cards/transactions/product-1', expect.objectContaining({
        body: { dateStart: '2026-01-01', dateEnd: '2026-01-01' }
      }))
    } finally {
      errorLog.mockRestore()
      warningLog.mockRestore()
      now.mockRestore()
    }
  })

  it('includes the oldest supported date when the requested end is at midnight', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-08-29T12:00:00Z').getTime())
    const account = convertCard({ productId: 'product-1', currencyIso: 'BYN' })
    mockFetchApi.mockResolvedValue({ status: 200, body: { dataTable: [], total: 0 } })

    try {
      await getCardTransactions(
        auth,
        account,
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-02-28T00:00:00Z')
      )

      expect(mockFetchApi).toHaveBeenCalledWith('cards/transactions/product-1', expect.objectContaining({
        body: { dateStart: '2026-02-28', dateEnd: '2026-02-28' }
      }))
    } finally {
      now.mockRestore()
    }
  })

  it('limits card operations to the six calendar months offered by the bank', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-08-29T12:00:00Z').getTime())
    const account = convertCard({
      productId: 'product-1',
      currencyIso: 'BYN'
    })
    mockFetchApi.mockResolvedValue({
      status: 200,
      body: { dataTable: [], total: 0 }
    })

    try {
      await getCardTransactions(
        auth,
        account,
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-08-29T12:00:00Z')
      )

      expect(mockFetchApi.mock.calls.map((call) => call[1]?.body)).toEqual([
        { dateStart: '2026-02-28', dateEnd: '2026-08-29' }
      ])
    } finally {
      now.mockRestore()
    }
  })
})
