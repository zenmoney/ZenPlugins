import { AccountOrCard, AccountType, Transaction } from '../../types/zenmoney'
import { CapitalTransfer, WalletBalance } from './models'

export function parseSettlementAssets (value?: string): Set<string> {
  return new Set((value ?? 'USDT,USDC,USD,USDE,FDUSD,TUSD')
    .split(',')
    .map(asset => asset.trim().toUpperCase())
    .filter(asset => asset !== ''))
}

function accountSlug (value: string): string {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  return slug === '' ? 'wallet' : slug
}

export function createAccounts (label: string, wallets: WalletBalance[]): AccountOrCard[] {
  const titlePrefix = label.trim() === '' ? 'Bitget' : label.trim()
  const idPrefix = accountSlug(titlePrefix)
  return wallets.map(wallet => {
    const walletTitle = wallet.accountType.charAt(0).toUpperCase() + wallet.accountType.slice(1)
    const id = `${idPrefix}_${accountSlug(wallet.accountType)}`
    return {
      id,
      type: AccountType.investment,
      title: `${titlePrefix} ${walletTitle}`,
      instrument: 'USD',
      balance: Number(wallet.valueUsdt.toFixed(8)),
      savings: ['bots', 'earn'].includes(wallet.accountType.toLowerCase()),
      syncIds: [id]
    }
  })
}

export function convertExternalStablecoinTransfers (label: string, transfers: CapitalTransfer[], settlementAssets = new Set(['USDT', 'USDC', 'USD', 'FDUSD'])): Transaction[] {
  const idPrefix = accountSlug(label.trim() === '' ? 'Bitget' : label.trim())
  return transfers.filter(transfer => settlementAssets.has(transfer.coin) && !Number.isNaN(transfer.date.getTime())).map(transfer => ({
    hold: false,
    date: transfer.date,
    movements: [{
      id: `bitget_${transfer.direction}_${transfer.id}`,
      account: { id: `${idPrefix}_spot` },
      invoice: null,
      sum: transfer.direction === 'deposit' ? transfer.amount : -transfer.amount,
      fee: transfer.direction === 'withdrawal' ? -Math.abs(transfer.fee) : 0
    }],
    merchant: null,
    comment: `Bitget external ${transfer.direction}: ${transfer.coin}${transfer.network == null || transfer.network === '' ? '' : `; network ${transfer.network}`}`
  }))
}
