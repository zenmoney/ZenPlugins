import { AccountType } from '../../../types/zenmoney'
import { convertExternalStablecoinTransfers, createAccounts, parseSettlementAssets } from '../converters'

describe('OKX accounts', () => {
  it('keeps actual OKX wallet types separate', () => {
    expect(createAccounts('OKX', [
      { wallet: 'Trading', valueUsdt: 723.49765952, savings: false },
      { wallet: 'Funding', valueUsdt: 0, savings: false },
      { wallet: 'Savings', valueUsdt: 452.95799248, savings: true }
    ])).toEqual([
      { id: 'okx_trading', type: AccountType.investment, title: 'OKX Trading', instrument: 'USD', balance: 723.49765952, savings: false, syncIds: ['okx_trading'] },
      { id: 'okx_funding', type: AccountType.investment, title: 'OKX Funding', instrument: 'USD', balance: 0, savings: false, syncIds: ['okx_funding'] },
      { id: 'okx_savings', type: AccountType.investment, title: 'OKX Savings', instrument: 'USD', balance: 452.95799248, savings: true, syncIds: ['okx_savings'] }
    ])
  })

  it('uses the Funding wallet for confirmed external transfers', () => {
    const result = convertExternalStablecoinTransfers('OKX', [
      { id: 'in', direction: 'deposit', coin: 'USDT', amount: 100, fee: 0, date: new Date('2026-04-17T14:55:10Z'), network: 'USDT-Aptos' },
      { id: 'out', direction: 'withdrawal', coin: 'USDC', amount: 20, fee: 0.5, date: new Date('2026-08-01T00:00:00Z'), network: null }
    ])
    expect(result).toHaveLength(2)
    expect(result[0].movements[0]).toMatchObject({ id: 'okx_deposit_in', account: { id: 'okx_funding' }, sum: 100 })
    expect(result[1].movements[0]).toMatchObject({ id: 'okx_withdrawal_out', sum: -20, fee: -0.5 })
  })

  it('normalizes the user-selected settlement assets', () => {
    expect([...parseSettlementAssets(' usdt, USDC,usdt ')]).toEqual(['USDT', 'USDC'])
  })
})
