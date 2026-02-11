import { describe, it, expect, jest } from '@jest/globals'
import { ArbitrumOneApi } from '../api'

type FetchMock = jest.MockedFunction<typeof fetch>

describe('ArbitrumOneApi очередь', () => {
  it('выполняет задачи последовательно через публичные методы', async () => {
    const mockFetch = jest.fn() as FetchMock
    global.fetch = mockFetch

    // Первый вызов API
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        status: '1',
        result: { balance: '100' }
      })
    } as any)

    // Второй вызов API
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        status: '1',
        result: { balance: '200' }
      })
    } as any)

    const api = new ArbitrumOneApi('TEST')

    // Запускаем два запроса подряд — они должны выполниться по очереди
    const p1 = api.getBalance('0x111')
    const p2 = api.getBalance('0x222')

    const r1 = await p1
    const r2 = await p2

    expect(r1.balance).toBe('100')
    expect(r2.balance).toBe('200')

    // Проверяем, что fetch вызван дважды
    expect(mockFetch).toHaveBeenCalledTimes(2)

    // Проверяем порядок вызовов
    expect(mockFetch.mock.calls[0][0]).toContain('0x111')
    expect(mockFetch.mock.calls[1][0]).toContain('0x222')
  })
})
