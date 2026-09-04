import { buildRequestPath, parseCapitalTransfers, signRequest } from '../fetchApi'

describe('Bitget API conversion', () => {
  it('signs the exact sorted request path', () => {
    const path = buildRequestPath('/api/v2/spot/wallet/deposit-records', { limit: 100, startTime: 10, endTime: 20 })
    expect(path).toBe('/api/v2/spot/wallet/deposit-records?endTime=20&limit=100&startTime=10')
    expect(signRequest('secret', '123', path)).toBe('UVsCInGPaO3vxFX/42U42v9VZg1BM/n9Q0CU2wkIXdo=')
  })

  it('keeps completed records and normalizes a negative withdrawal fee', () => {
    const result = parseCapitalTransfers([
      { orderId: 'deposit', status: 'success', coin: 'USDT', size: '10', cTime: '1000', chain: 'bsc' },
      { orderId: 'pending', status: 'pending', coin: 'USDT', size: '20', cTime: '1000' }
    ], [
      { orderId: 'withdrawal', status: 'success', coin: 'USDC', size: '5', fee: '-0.25', cTime: '2000', chain: 'erc20' }
    ])
    expect(result).toHaveLength(2)
    expect(result[1]).toMatchObject({ id: 'withdrawal', direction: 'withdrawal', amount: 5, fee: 0.25 })
  })
})
