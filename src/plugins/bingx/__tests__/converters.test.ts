import { AccountType } from '../../../types/zenmoney'
import { convertExternalStablecoinTransfers, convertInternalTransfers, createAccounts, parseSettlementAssets } from '../converters'
import { historyRows, internalTransferRows } from '../fetchApi'

describe('BingX accounts', () => {
  it('keeps Fund/Spot and bots separate', () => {
    expect(createAccounts('BingX', [
      { wallet: 'Fund / Spot', valueUsdt: 636.19996441, savings: false },
      { wallet: 'Grid Bots', valueUsdt: 61.76, savings: true }
    ])).toEqual([
      { id: 'bingx_fund_spot', type: AccountType.investment, title: 'BingX Fund / Spot', instrument: 'USD', balance: 636.19996441, savings: false, syncIds: ['bingx_fund_spot'] },
      { id: 'bingx_grid_bots', type: AccountType.investment, title: 'BingX Grid Bots', instrument: 'USD', balance: 61.76, savings: true, syncIds: ['bingx_grid_bots'] }
    ])
  })

  it('uses Fund / Spot for external stablecoin transfers', () => {
    const result = convertExternalStablecoinTransfers('BingX', [
      { id: 'in', direction: 'deposit', coin: 'USDT', amount: 100, fee: 0, date: new Date('2026-04-17T14:30:56Z'), network: 'BEP20' },
      { id: 'out', direction: 'withdrawal', coin: 'USDC', amount: 20, fee: 1, date: new Date('2026-08-01T00:00:00Z'), network: null }
    ])
    expect(result).toHaveLength(2)
    expect(result[0].movements[0]).toMatchObject({ id: 'bingx_deposit_in', account: { id: 'bingx_fund_spot' }, sum: 100 })
    expect(result[1].movements[0]).toMatchObject({ id: 'bingx_withdrawal_out', sum: -20, fee: -1 })
  })

  it('accepts BingX bare-array capital history responses', () => {
    expect(historyRows([{ id: 'deposit-1' }])).toEqual([{ id: 'deposit-1' }])
  })

  it('accepts both internal-transfer response shapes', () => {
    const rows = [{ tranId: 123 }]
    expect(internalTransferRows({ rows })).toEqual(rows)
    expect(internalTransferRows({ data: { rows } })).toEqual(rows)
  })

  it('creates a balanced own-account transfer', () => {
    const result = convertInternalTransfers('BingX', [{ id: '123', coin: 'USDT', amount: 50, date: new Date('2026-08-01T00:00:00Z'), fromWallet: 'Fund / Spot', toWallet: 'USDT-M Futures' }])
    expect(result).toHaveLength(1)
    expect(result[0].movements).toEqual([
      { id: 'bingx_internal_123_out', account: { id: 'bingx_fund_spot' }, invoice: null, sum: -50, fee: 0 },
      { id: 'bingx_internal_123_in', account: { id: 'bingx_usdt_m_futures' }, invoice: null, sum: 50, fee: 0 }
    ])
  })

  it('normalizes custom settlement assets', () => {
    expect([...parseSettlementAssets(' usdt,USDC,usdt ')]).toEqual(['USDT', 'USDC'])
  })
})
