import { AccountType } from '../../../types/zenmoney'
import { convertExternalStablecoinTransfers, createAccounts, parseSettlementAssets } from '../converters'

describe('Bitget accounts', () => {
  it('creates one account for each actual exchange wallet', () => {
    expect(createAccounts('Bitget', [
      { accountType: 'spot', valueUsdt: 647.84903385 },
      { accountType: 'bots', valueUsdt: 21.04068974 },
      { accountType: 'earn', valueUsdt: 100 }
    ])).toEqual([
      { id: 'bitget_spot', type: AccountType.investment, title: 'Bitget Spot', instrument: 'USD', balance: 647.84903385, savings: false, syncIds: ['bitget_spot'] },
      { id: 'bitget_bots', type: AccountType.investment, title: 'Bitget Bots', instrument: 'USD', balance: 21.04068974, savings: true, syncIds: ['bitget_bots'] },
      { id: 'bitget_earn', type: AccountType.investment, title: 'Bitget Earn', instrument: 'USD', balance: 100, savings: true, syncIds: ['bitget_earn'] }
    ])
  })

  it('creates deterministic stablecoin transfer movements', () => {
    const result = convertExternalStablecoinTransfers('Bitget', [
      { id: 'in', direction: 'deposit', coin: 'USDT', amount: 10, fee: 0, date: new Date('2026-08-01T00:00:00Z'), network: 'bsc' },
      { id: 'out', direction: 'withdrawal', coin: 'USDC', amount: 20, fee: 1, date: new Date('2026-08-02T00:00:00Z'), network: null },
      { id: 'other', direction: 'deposit', coin: 'BTC', amount: 1, fee: 0, date: new Date('2026-08-03T00:00:00Z'), network: null }
    ])
    expect(result).toHaveLength(2)
    expect(result[0].movements[0]).toMatchObject({ id: 'bitget_deposit_in', account: { id: 'bitget_spot' }, sum: 10 })
    expect(result[1].movements[0]).toMatchObject({ id: 'bitget_withdrawal_out', sum: -20, fee: -1 })
  })

  it('normalizes custom settlement assets', () => {
    expect([...parseSettlementAssets(' usdt,USDC,usdt ')]).toEqual(['USDT', 'USDC'])
  })
})
