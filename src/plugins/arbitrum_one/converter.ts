import { BalanceResponse, TokenBalance, Transaction, TokenTransfer } from './types'

// -----------
// Tokens
// -----------
import { SUPPORTED_TOKENS } from './supportedTokens'

// ------
// Merchants
// ------
import { normalizeMerchant } from './merchants'

// -------------------------
// ACCOUNTS
// -------------------------

export function convertBalances (native: BalanceResponse, tokenBalances: TokenBalance[]): any[] {
  const result = []

  // ETH → μETH
  const ethRaw = Number(native.balance)
  const ethAmount = isFinite(ethRaw) ? ethRaw / 1e18 : 0

  result.push({
    id: 'arbitrum-one-main',
    type: 'checking',
    title: 'Arbitrum One (ETH)',
    instrument: 'μETH',
    balance: ethAmount, // ZenMoney интерпретирует как μETH
    syncIds: ['arbitrum-one-main']
  })

  // Tokens
  for (const tb of tokenBalances) {
    const token = SUPPORTED_TOKENS.find(
      (t) => t.contract.toLowerCase() === tb.contract.toLowerCase()
    )

    if (token == null) continue

    const raw = Number(tb.balance)
    const amount = isFinite(raw) ? raw / 10 ** token.decimals : 0

    result.push({
      id: `arbitrum-one-${token.symbol.toLowerCase()}`,
      type: 'checking',
      title: `Arbitrum One (${token.symbol})`,
      instrument: token.symbol,
      balance: amount,
      syncIds: [`arbitrum-one-${token.symbol.toLowerCase()}`]
    })
  }

  return result
}

// -------------------------
// TRANSACTIONS
// -------------------------

export function convertTransactions (
  nativeTxs: Transaction[],
  tokenTxs: TokenTransfer[],
  address: string
): any[] {
  const result = []
  const addr = address.toLowerCase()

  // ETH transactions
  for (const tx of nativeTxs) {
    const value = Number(tx.value) / 1e18
    const fee = (Number(tx.gasUsed) * Number(tx.gasPrice)) / 1e18

    // пропускаем полностью пустые транзакции (ни value, ни fee)
    if ((value === 0 || !isFinite(value)) && (fee === 0 || !isFinite(fee))) {
      continue
    }

    const from = tx.from.toLowerCase()
    const isOutgoing = from === addr
    const sign = isOutgoing ? -1 : 1

    result.push({
      hold: null,
      date: new Date(Number(tx.timeStamp) * 1000),
      movements: [
        {
          id: tx.hash,
          account: { id: 'arbitrum-one-main' },
          invoice: null,
          sum: sign * value,
          fee: isOutgoing ? fee : 0
        }
      ],
      merchant: {
        fullTitle: normalizeMerchant(isOutgoing ? tx.to : tx.from, address),
        mcc: null,
        location: null
      },
      comment: null
    })
  }

  // ERC20 transactions
  for (const tx of tokenTxs) {
    const token = SUPPORTED_TOKENS.find(
      (t) => t.contract.toLowerCase() === tx.contract.toLowerCase()
    )

    if (token == null) continue

    const value = Number(tx.value) / 10 ** token.decimals
    if (value === 0) continue

    const from = tx.from.toLowerCase()
    // const to = tx.to.toLowerCase()

    const isOutgoing = from === addr
    const sign = isOutgoing ? -1 : 1

    result.push({
      hold: null,
      date: new Date(Number(tx.timeStamp) * 1000),
      movements: [
        {
          id: `${tx.hash}-${token.symbol}`,
          account: { id: `arbitrum-one-${token.symbol.toLowerCase()}` },
          invoice: null,
          sum: sign * value,
          fee: 0
        }
      ],
      merchant: {
        fullTitle: isOutgoing ? tx.to : tx.from,
        mcc: null,
        location: null
      },
      comment: null
    })
  }

  return result
}
