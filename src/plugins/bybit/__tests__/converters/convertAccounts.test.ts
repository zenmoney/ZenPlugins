import { AccountType } from '../../../../types/zenmoney'
import { InvalidPreferencesError } from '../../../../errors'
import {
  BYBIT_FLEXIBLE_EARN_ACCOUNT_ID,
  BYBIT_FUNDING_ACCOUNT_ID,
  createFlexibleEarnAccount,
  createFundingAccount,
  convertEarnTransfers,
  convertExternalTransfers,
  convertInternalTransfers,
  parseTransferAssets,
  selectCardSettlementAccount
} from '../../converters'

describe('Bybit wallet accounts', () => {
  it('keeps Funding as a separate wallet balance', () => {
    expect(createFundingAccount([
      { coin: 'USDT', walletBalance: 10, transferBalance: 9.5 },
      { coin: 'USD', walletBalance: 5, transferBalance: 4 }
    ], new Map([['USDT', 9.55]]))).toEqual({
      id: BYBIT_FUNDING_ACCOUNT_ID,
      type: AccountType.checking,
      title: 'Bybit Funding',
      instrument: 'USD',
      balance: 14.55,
      syncIds: [BYBIT_FUNDING_ACCOUNT_ID]
    })
  })

  it('keeps Flexible Earn in its own investment account', () => {
    expect(createFlexibleEarnAccount([
      { coin: 'USDT', amount: 2300, availableAmount: 2252.3136 },
      { coin: 'BTC', amount: 0.01, availableAmount: 0.01 }
    ], new Map([['USDT', 1], ['BTC', 100000]]))).toEqual({
      id: BYBIT_FLEXIBLE_EARN_ACCOUNT_ID,
      type: AccountType.investment,
      title: 'Bybit Flexible Earn',
      instrument: 'USD',
      balance: 3300,
      savings: true,
      syncIds: [BYBIT_FLEXIBLE_EARN_ACCOUNT_ID]
    })
  })

  it('uses the live USDC/USDT quote instead of assuming a permanent 1:1 peg', () => {
    expect(createFlexibleEarnAccount([
      { coin: 'USDC', amount: 1000, availableAmount: 1000 }
    ], new Map([['USDC', 0.9985]])).balance).toBe(998.5)
  })

  it('routes Card purchases to the selected payment wallet', () => {
    const funding = createFundingAccount([], new Map())
    const earn = createFlexibleEarnAccount([{ coin: 'USDT', amount: 10, availableAmount: 10 }], new Map([['USDT', 1]]))

    expect(selectCardSettlementAccount('earn', funding, earn).id).toBe(BYBIT_FLEXIBLE_EARN_ACCOUNT_ID)
    expect(selectCardSettlementAccount('funding', funding, earn).id).toBe(BYBIT_FUNDING_ACCOUNT_ID)
    expect(() => selectCardSettlementAccount('auto', funding, earn)).toThrow(InvalidPreferencesError)
  })

  it('imports confirmed external stablecoin movements with stable ids', () => {
    const transactions = convertExternalTransfers([{
      id: 'deposit-1',
      direction: 'deposit',
      coin: 'USDT',
      amount: 100,
      fee: 0,
      date: new Date('2026-08-01T00:00:00Z'),
      network: 'BSC'
    }, {
      id: 'btc-1',
      direction: 'deposit',
      coin: 'BTC',
      amount: 1,
      fee: 0,
      date: new Date('2026-08-01T00:00:00Z'),
      network: 'BTC'
    }], 'funding', parseTransferAssets(undefined))
    expect(transactions).toHaveLength(1)
    expect(transactions[0].movements[0]).toMatchObject({
      id: 'bybit_external_deposit_deposit-1',
      account: { id: BYBIT_FUNDING_ACCOUNT_ID },
      sum: 100,
      fee: 0
    })
  })

  it('rejects non-stable transfer assets instead of treating one coin as one dollar', () => {
    expect(() => parseTransferAssets('USDT, BTC')).toThrow(InvalidPreferencesError)
  })

  it('creates balanced Funding to Unified and Funding to Earn transfers', () => {
    const assets = new Set(['USDT'])
    const internal = convertInternalTransfers([{
      id: 'move-1',
      coin: 'USDT',
      amount: 50,
      fromAccountType: 'FUND',
      toAccountType: 'UNIFIED',
      date: new Date('2026-08-02T00:00:00Z')
    }], assets)[0]
    expect(internal.movements.map(item => item.sum)).toEqual([-50, 50])

    const earn = convertEarnTransfers([{
      id: 'earn-1',
      coin: 'USDT',
      amount: 25,
      type: 'Stake',
      date: new Date('2026-08-03T00:00:00Z')
    }], 'funding', assets)[0]
    expect(earn.movements.map(item => item.sum)).toEqual([-25, 25])
    expect(earn.movements).toMatchObject([
      { account: { id: BYBIT_FUNDING_ACCOUNT_ID } },
      { account: { id: BYBIT_FLEXIBLE_EARN_ACCOUNT_ID } }
    ])
  })
})
