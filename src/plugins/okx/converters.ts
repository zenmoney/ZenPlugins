import { AccountOrCard, AccountType, Transaction } from '../../types/zenmoney'
import { CapitalTransfer, WalletBalance } from './models'

export function parseSettlementAssets (value?: string): Set<string> {
  const assets = (value ?? 'USDT,USDC,USD,USDE,FDUSD,TUSD')
    .split(',')
    .map(asset => asset.trim().toUpperCase())
    .filter(asset => asset !== '')
  return new Set(assets)
}

export function createAccounts (label: string, wallets: WalletBalance[]): AccountOrCard[] {
  const prefix = label.trim() === '' ? 'OKX' : label.trim()
  const idPrefixCandidate = prefix.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  const idPrefix = idPrefixCandidate === '' ? 'okx' : idPrefixCandidate
  return wallets.map(wallet => {
    const id = `${idPrefix}_${wallet.wallet.toLowerCase()}`
    return {
      id,
      type: AccountType.investment,
      title: `${prefix} ${wallet.wallet}`,
      instrument: 'USD',
      balance: Number(wallet.valueUsdt.toFixed(8)),
      savings: wallet.savings,
      syncIds: [id]
    }
  })
}

export function convertExternalStablecoinTransfers (label: string, transfers: CapitalTransfer[], settlementAssets = new Set(['USDT', 'USDC', 'USD', 'USDE', 'FDUSD'])): Transaction[] {
  const prefix = label.trim() === '' ? 'OKX' : label.trim()
  const idPrefixCandidate = prefix.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  const idPrefix = idPrefixCandidate === '' ? 'okx' : idPrefixCandidate
  return transfers.filter(transfer => settlementAssets.has(transfer.coin) && !Number.isNaN(transfer.date.getTime())).map(transfer => ({
    hold: false,
    date: transfer.date,
    movements: [{
      id: `okx_${transfer.direction}_${transfer.id}`,
      account: { id: `${idPrefix}_funding` },
      invoice: null,
      sum: transfer.direction === 'deposit' ? transfer.amount : -transfer.amount,
      fee: transfer.direction === 'withdrawal' ? -Math.abs(transfer.fee) : 0
    }],
    merchant: null,
    comment: `OKX external ${transfer.direction}: ${transfer.coin}${transfer.network == null || transfer.network === '' ? '' : `; network ${transfer.network}`}`
  }))
}
