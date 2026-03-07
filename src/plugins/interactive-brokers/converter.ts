import { ParsedFlex } from './flexParser'

interface ZenMoneyAccount {
  id: string
  title: string
  type: 'investment'
  instrument: string
  balance: number
  syncID: string[]
  savings: boolean
}

interface ZenMoneyResult {
  accounts: ZenMoneyAccount[]
  transactions: any[]
  assets: any[]
  instruments: any[]
}

export function convertToZenmoney (parsed: ParsedFlex): ZenMoneyResult {
  const accounts: ZenMoneyAccount[] = []
  if (parsed.equity != null) {
    const e = parsed.equity
    const base = e.baseCurrency

    const add = (id: string, title: string, balance: number): void => {
      accounts.push({
        id,
        title,
        type: 'investment',
        instrument: base,
        balance,
        syncID: [id],
        savings: false
      })
    }

    add('IBKR_CASH', 'IBKR Cash', e.cash)
    add('IBKR_STOCK', 'IBKR Stocks', e.stock)
    add('IBKR_OPTIONS', 'IBKR Options', e.options)
    add('IBKR_CRYPTO', 'IBKR Crypto', e.crypto)
    add('IBKR_FUNDS', 'IBKR Funds', e.funds)
    add('IBKR_DIVIDENDS', 'IBKR Dividends', e.dividendAccruals)
  }

  return {
    accounts,
    transactions: [], // placeholder — no movements
    assets: [],
    instruments: []
  }
}
