import { describe, it, expect, jest } from '@jest/globals'
import { ArbitrumOneApi } from '../api'

type FetchMock = jest.MockedFunction<typeof fetch>

describe('ArbitrumOneApi очередь', () => {
  it('выполняет задачи последовательно через публичные методы', async () => {
    const mockFetch = jest.fn() as FetchMock
    global.fetch = mockFetch

    // First API call
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        status: '1',
        result: { balance: '100' }
      })
    } as any)

    // Second API call
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        status: '1',
        result: { balance: '200' }
      })
    } as any)

    const api = new ArbitrumOneApi('TEST')

    // Start two requests in a row — they should execute sequentially
    const p1 = api.getBalance('0x111')
    const p2 = api.getBalance('0x222')

    const r1 = await p1
    const r2 = await p2

    expect(r1.balance).toBe('100')
    expect(r2.balance).toBe('200')

    // Check that fetch was called twice
    expect(mockFetch).toHaveBeenCalledTimes(2)

    // Check order of calls
    expect(mockFetch.mock.calls[0][0]).toContain('0x111')
    expect(mockFetch.mock.calls[1][0]).toContain('0x222')
  })
})
