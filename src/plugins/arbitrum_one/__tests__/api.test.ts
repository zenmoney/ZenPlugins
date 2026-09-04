import { describe, it, expect, jest } from '@jest/globals'
import { ArbitrumOneApi } from '../api'

type FetchMock = jest.MockedFunction<typeof fetch>

describe('ArbitrumOneApi.getBalance', () => {
  it('возвращает корректный баланс (объект result)', async () => {
    const mockFetch = jest.fn() as FetchMock
    global.fetch = mockFetch

    mockFetch.mockResolvedValue({
      json: async () => ({
        status: '1',
        result: { balance: '1000000000000000000' }
      })
    } as any)

    const api = new ArbitrumOneApi('TEST_KEY')
    const res = await api.getBalance('0x123')

    expect(res.balance).toBe('1000000000000000000')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('возвращает корректный баланс (строка result)', async () => {
    const mockFetch = jest.fn() as FetchMock
    global.fetch = mockFetch

    mockFetch.mockResolvedValue({
      json: async () => ({
        status: '1',
        result: '2000000000000000000'
      })
    } as any)

    const api = new ArbitrumOneApi('TEST_KEY')
    const res = await api.getBalance('0x123')

    expect(res.balance).toBe('2000000000000000000')
  })
})

describe('ArbitrumOneApi.getBlockNumberByTimestamp', () => {
  it('возвращает число блока', async () => {
    const mockFetch = jest.fn() as FetchMock
    global.fetch = mockFetch

    mockFetch.mockResolvedValue({
      json: async () => ({
        status: '1',
        result: '123456'
      })
    } as any)

    const api = new ArbitrumOneApi('TEST_KEY')
    const block = await api.getBlockNumberByTimestamp(1700000000)

    expect(block).toBe(123456)
  })
})
