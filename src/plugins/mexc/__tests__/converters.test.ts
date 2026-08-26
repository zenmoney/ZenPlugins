import { AccountType } from '../../../types/zenmoney'
import { convertExternalStablecoinTransfers, createSpotAccount, parseSettlementAssets, valueInUsdt } from '../converters'

describe('MEXC balance conversion', () => {
  const prices = new Map([['BTCUSDT', 60000], ['ETHBTC', 0.05]])

  it('values stablecoins, direct and bridged assets', () => {
    expect(valueInUsdt('USDT', 10, prices)).toBe(10)
    expect(valueInUsdt('BTC', 0.1, prices)).toBe(6000)
    expect(valueInUsdt('ETH', 2, prices)).toBe(6000)
    expect(valueInUsdt('UNKNOWN', 1, prices)).toBe(0)
  })

  it('uses a market quote for non-USDT stablecoins when available', () => {
    expect(valueInUsdt('USDC', 100, new Map([['USDCUSDT', 0.999]]))).toBe(99.9)
    expect(valueInUsdt('USDC', 100, new Map())).toBe(100)
  })

  it('creates one stable MEXC Spot account', () => {
    expect(createSpotAccount('MEXC', [
      { asset: 'USDT', free: 100, locked: 2 },
      { asset: 'BTC', free: 0.1, locked: 0 }
    ], prices)).toEqual({
      id: 'mexc_spot',
      type: AccountType.investment,
      title: 'MEXC Spot',
      instrument: 'USD',
      balance: 6102,
      savings: false,
      syncIds: ['mexc_spot']
    })
  })

  it('imports only stable external transfers with deterministic ids', () => {
    const result = convertExternalStablecoinTransfers('MEXC', [
      { id: 'deposit', direction: 'deposit', coin: 'USDT', amount: 10, fee: 0, date: new Date('2026-08-01T00:00:00Z'), network: 'TRC20' },
      { id: 'withdrawal', direction: 'withdrawal', coin: 'USDC', amount: 20, fee: 1, date: new Date('2026-08-02T00:00:00Z'), network: null },
      { id: 'btc', direction: 'deposit', coin: 'BTC', amount: 1, fee: 0, date: new Date('2026-08-03T00:00:00Z'), network: null }
    ])
    expect(result).toHaveLength(2)
    expect(result[0].movements[0]).toMatchObject({ id: 'mexc_deposit_deposit', sum: 10, fee: 0 })
    expect(result[1].movements[0]).toMatchObject({ id: 'mexc_withdrawal_withdrawal', sum: -20, fee: -1 })
  })

  it('normalizes custom settlement assets', () => {
    expect([...parseSettlementAssets(' usdt,USDC,usdt ')]).toEqual(['USDT', 'USDC'])
  })
})
