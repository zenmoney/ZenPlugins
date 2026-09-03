import { AccountType } from '../../../types/zenmoney'
import { convertC2CTransfers, convertEarnTransfers, convertExternalStablecoinTransfers, convertInternalTransfers, convertPayTransfers, createAccounts, valueInUsdt } from '../converters'

describe('Binance balance conversion', () => {
  const prices = new Map([['BTCUSDT', 60000], ['ETHBTC', 0.05]])

  it('values stablecoins, direct pairs and bridge pairs', () => {
    expect(valueInUsdt('USDT', 10, prices)).toBe(10)
    expect(valueInUsdt('BTC', 0.1, prices)).toBe(6000)
    expect(valueInUsdt('ETH', 2, prices)).toBe(6000)
    expect(valueInUsdt('UNKNOWN', 10, prices)).toBe(0)
    expect(valueInUsdt('USDC', 1000, new Map([['USDCUSDT', 0.9985]]))).toBe(998.5)
  })

  it('creates stable ids for main and secondary accounts', () => {
    const accounts = createAccounts('Binance M', [{ asset: 'USDT', free: 100, locked: 2 }], [{ asset: 'USDT', amount: 3 }], [{ asset: 'BTC', amount: 0.1 }], [], prices, undefined, [], true)
    expect(accounts[0]).toEqual({ id: 'binance_m_spot', type: AccountType.investment, title: 'Binance M Spot', instrument: 'USD', balance: 102, savings: false, syncIds: ['binance_m_spot'] })
    expect(accounts[1]).toMatchObject({ id: 'binance_m_funding', title: 'Binance M Funding', balance: 3 })
    expect(accounts[2]).toMatchObject({ id: 'binance_m_earn', title: 'Binance M Earn', balance: 6000 })
  })

  it('allows users to disable exchange wallets without changing the others', () => {
    const accounts = createAccounts('Binance', [{ asset: 'USDT', free: 10, locked: 0 }], [{ asset: 'USDT', amount: 20 }], [{ asset: 'USDT', amount: 30 }], [], prices, { spot: false, funding: true, earn: false }, [], true)
    expect(accounts).toHaveLength(1)
    expect(accounts[0]).toMatchObject({ id: 'binance_funding', balance: 20 })
  })

  it('discovers active exchange wallets without duplicating represented wallets', () => {
    const accounts = createAccounts('Binance', [], [], [], [], prices, { spot: true, funding: true, earn: true }, [
      { walletName: 'Spot', balance: 10, active: true },
      { walletName: 'USD-M Futures', balance: 358.52, active: true },
      { walletName: 'Inactive Wallet', balance: 5, active: false }
    ], true)
    expect(accounts.filter(account => account.title === 'Binance Spot')).toHaveLength(1)
    expect(accounts).toContainEqual(expect.objectContaining({ id: 'binance_usd_m_futures', title: 'Binance USD-M Futures', balance: 358.52 }))
    expect(accounts.some(account => account.title.includes('Inactive'))).toBe(false)
  })

  it('imports only external stablecoin transfers with deterministic IDs', () => {
    const transactions = convertExternalStablecoinTransfers('Binance', [
      { id: 'deposit-1', direction: 'deposit', coin: 'USDT', amount: 50, fee: 0, date: new Date('2026-07-08T12:00:00Z'), network: 'TRX', walletType: 0 },
      { id: 'withdraw-1', direction: 'withdrawal', coin: 'USDC', amount: 20, fee: 1, date: new Date('2026-07-09T12:00:00Z'), network: null, walletType: 1 },
      { id: 'btc-1', direction: 'deposit', coin: 'BTC', amount: 1, fee: 0, date: new Date('2026-07-10T12:00:00Z'), network: null, walletType: 0 }
    ], undefined, true)
    expect(transactions).toHaveLength(2)
    expect(transactions[0].movements[0]).toMatchObject({ id: 'binance_deposit_deposit-1', account: { id: 'binance_spot' }, sum: 50, fee: 0 })
    expect(transactions[1].movements[0]).toMatchObject({ id: 'binance_withdrawal_withdraw-1', account: { id: 'binance_funding' }, sum: -20, fee: -1 })
  })

  it('never imports a transfer into a wallet the user opted out of syncing', () => {
    const transactions = convertExternalStablecoinTransfers('Binance', [
      { id: 'spot-deposit', direction: 'deposit', coin: 'USDT', amount: 10, fee: 0, date: new Date('2026-07-08T12:00:00Z'), network: 'TRX', walletType: 0 },
      { id: 'funding-withdrawal', direction: 'withdrawal', coin: 'USDT', amount: 20, fee: 0, date: new Date('2026-07-09T12:00:00Z'), network: 'BSC', walletType: 1 }
    ], { spot: true, funding: false }, true)
    expect(transactions).toHaveLength(1)
    expect(transactions[0].movements[0].account).toEqual({ id: 'binance_spot' })
  })

  it('can use one optional portfolio account, including selected active wallets', () => {
    const accounts = createAccounts('Binance', [{ asset: 'USDT', free: 10, locked: 0 }], [{ asset: 'USDT', amount: 20 }], [{ asset: 'USDT', amount: 30 }], [], prices, { spot: true, funding: true, earn: true }, [
      { walletName: 'Copy Trading', balance: 40, active: true }
    ], false)
    expect(accounts).toEqual([expect.objectContaining({ id: 'binance_portfolio', title: 'Binance', balance: 100 })])
  })

  it('imports Binance Pay and completed P2P into their actual wallets', () => {
    const selection = { spot: true, funding: true, earn: true }
    expect(convertPayTransfers('Binance', [{
      id: 'pay-1', amount: 1099, coin: 'USDT', date: new Date('2026-08-20T10:00:00Z'), walletType: 1, orderType: 'C2C', counterparty: 'Sergey'
    }], selection, true)[0]).toMatchObject({
      movements: [{ id: 'binance_pay_pay-1', account: { id: 'binance_funding' }, sum: 1099 }]
    })
    expect(convertC2CTransfers('Binance', [{
      id: 'p2p-1', direction: 'sell', coin: 'USDT', amount: 100, fee: 0.1, date: new Date('2026-08-21T10:00:00Z'), fiat: 'EUR', fiatAmount: 86, counterparty: null
    }], selection, true)[0]).toMatchObject({
      movements: [{ id: 'binance_c2c_p2p-1', account: { id: 'binance_funding' }, sum: -100, fee: -0.1 }]
    })
  })

  it('creates balanced internal and Earn transfers without portfolio noise', () => {
    const selection = { spot: true, funding: true, earn: true }
    const internal = convertInternalTransfers('Binance', [{ id: 'move-1', coin: 'USDT', amount: 25, date: new Date('2026-08-22T10:00:00Z'), from: 'funding', to: 'spot' }], selection, true)[0]
    expect(internal.movements.map(row => row.sum)).toEqual([-25, 25])
    const earn = convertEarnTransfers('Binance', [{ id: 'earn-1', coin: 'USDT', amount: 10, date: new Date('2026-08-23T10:00:00Z'), direction: 'subscription' }], selection, true)[0]
    expect(earn.movements.map(row => row.sum)).toEqual([-10, 10])
    expect(convertInternalTransfers('Binance', [{ id: 'move-1', coin: 'USDT', amount: 25, date: new Date(), from: 'funding', to: 'spot' }], selection, false)).toEqual([])
  })
})
