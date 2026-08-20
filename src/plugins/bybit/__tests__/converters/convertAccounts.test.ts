import { InvalidPreferencesError } from '../../../../errors'
import { AccountType } from '../../../../types/zenmoney'
import {
  BYBIT_CARD_AGGREGATE_ACCOUNT_ID,
  createAggregatedAccount,
  parseCardBalanceCoinsList
} from '../../converters'
import { CoinBalance } from '../../models'

describe('parseCardBalanceCoinsList', () => {
  it('parses, trims, and uppercases a comma-separated list', () => {
    expect(parseCardBalanceCoinsList('usdt, USDC')).toEqual(new Set(['USDT', 'USDC']))
  })

  it('deduplicates coins', () => {
    expect(parseCardBalanceCoinsList('USDT, usdt, USDC')).toEqual(new Set(['USDT', 'USDC']))
  })

  it('treats empty and whitespace-only items as no-ops', () => {
    expect(parseCardBalanceCoinsList(', ,USDT,')).toEqual(new Set(['USDT']))
  })

  it('throws InvalidPreferencesError for unsupported coins', () => {
    expect(() => parseCardBalanceCoinsList('USDT, BTC')).toThrow(InvalidPreferencesError)
  })
})

describe('createAggregatedAccount', () => {
  const cardCoins = new Set(['USDT', 'USDC', 'USD'])

  it('sums uBalance for USDT and USDC and adds USD fiat 1:1', () => {
    const balances: CoinBalance[] = [
      { coin: 'USDT', walletBalance: 100, transferBalance: 95 },
      { coin: 'USDC', walletBalance: 50, transferBalance: 50 },
      { coin: 'USD', walletBalance: 12.34, transferBalance: 12.34 }
    ]
    const convertUsdtValues = new Map<string, number>([
      ['USDT', 95.01],
      ['USDC', 49.97]
    ])
    expect(createAggregatedAccount(balances, cardCoins, convertUsdtValues)).toEqual({
      id: BYBIT_CARD_AGGREGATE_ACCOUNT_ID,
      type: AccountType.ccard,
      title: 'Bybit Card',
      instrument: 'USD',
      balance: 95.01 + 49.97 + 12.34,
      creditLimit: 0,
      syncIds: [BYBIT_CARD_AGGREGATE_ACCOUNT_ID]
    })
  })

  it('ignores Funding coins that are not in cardBalanceCoins', () => {
    const balances: CoinBalance[] = [
      { coin: 'USDT', walletBalance: 10, transferBalance: 10 },
      { coin: 'BTC', walletBalance: 999, transferBalance: 999 }
    ]
    const convertUsdtValues = new Map<string, number>([
      ['USDT', 10],
      ['BTC', 9_999_999]
    ])
    const account = createAggregatedAccount(balances, new Set(['USDT', 'USD']), convertUsdtValues)
    expect(account.balance).toBe(10)
  })

  it('counts a card coin as 0 when it is missing from the Convert response', () => {
    const balances: CoinBalance[] = [
      { coin: 'USDT', walletBalance: 5, transferBalance: 5 },
      { coin: 'USDC', walletBalance: 3, transferBalance: 3 }
    ]
    const convertUsdtValues = new Map<string, number>([['USDT', 5]])
    const account = createAggregatedAccount(balances, cardCoins, convertUsdtValues)
    expect(account.balance).toBe(5)
  })

  it('uses transferBalance (not walletBalance) for USD fiat', () => {
    const balances: CoinBalance[] = [
      { coin: 'USD', walletBalance: 100, transferBalance: 80 }
    ]
    const account = createAggregatedAccount(balances, cardCoins, new Map())
    expect(account.balance).toBe(80)
  })

  it('returns a zero-balance account when there are no matching coins', () => {
    const account = createAggregatedAccount([], cardCoins, new Map())
    expect(account.balance).toBe(0)
    expect(account.id).toBe(BYBIT_CARD_AGGREGATE_ACCOUNT_ID)
  })
})
