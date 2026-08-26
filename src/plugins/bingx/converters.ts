import { AccountOrCard, AccountType, Transaction } from '../../types/zenmoney'
import { CapitalTransfer, InternalTransfer, WalletBalance } from './models'

export function parseSettlementAssets (value?: string): Set<string> {
  return new Set((value ?? 'USDT,USDC,USD,USDE,FDUSD,TUSD')
    .split(',')
    .map(asset => asset.trim().toUpperCase())
    .filter(asset => asset !== ''))
}

function slug (value: string): string {
  const candidate = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  return candidate === '' ? 'wallet' : candidate
}

export function createAccounts (label: string, wallets: WalletBalance[]): AccountOrCard[] {
  const prefix = label.trim() === '' ? 'BingX' : label.trim()
  const idPrefix = slug(prefix)
  return wallets.map(wallet => {
    const id = `${idPrefix}_${slug(wallet.wallet)}`
    return { id, type: AccountType.investment, title: `${prefix} ${wallet.wallet}`, instrument: 'USD', balance: Number(wallet.valueUsdt.toFixed(8)), savings: wallet.savings, syncIds: [id] }
  })
}

export function convertExternalStablecoinTransfers (label: string, transfers: CapitalTransfer[], settlementAssets = new Set(['USDT', 'USDC', 'BUSD', 'FDUSD'])): Transaction[] {
  const prefix = label.trim() === '' ? 'BingX' : label.trim()
  const idPrefix = slug(prefix)
  return transfers.filter(transfer => settlementAssets.has(transfer.coin) && !Number.isNaN(transfer.date.getTime())).map(transfer => ({
    hold: false,
    date: transfer.date,
    movements: [{
      id: `bingx_${transfer.direction}_${transfer.id}`,
      account: { id: `${idPrefix}_fund_spot` },
      invoice: null,
      sum: transfer.direction === 'deposit' ? transfer.amount : -transfer.amount,
      fee: transfer.direction === 'withdrawal' ? -Math.abs(transfer.fee) : 0
    }],
    merchant: null,
    comment: `BingX external ${transfer.direction}: ${transfer.coin}${transfer.network == null || transfer.network === '' ? '' : `; network ${transfer.network}`}`
  }))
}

export function convertInternalTransfers (label: string, transfers: InternalTransfer[], settlementAssets = new Set(['USDT', 'USDC', 'BUSD', 'FDUSD'])): Transaction[] {
  const idPrefix = slug(label.trim() === '' ? 'BingX' : label.trim())
  return transfers.filter(transfer => settlementAssets.has(transfer.coin) && !Number.isNaN(transfer.date.getTime())).map(transfer => ({
    hold: false,
    date: transfer.date,
    movements: [{
      id: `bingx_internal_${transfer.id}_out`,
      account: { id: `${idPrefix}_${slug(transfer.fromWallet)}` },
      invoice: null,
      sum: -transfer.amount,
      fee: 0
    }, {
      id: `bingx_internal_${transfer.id}_in`,
      account: { id: `${idPrefix}_${slug(transfer.toWallet)}` },
      invoice: null,
      sum: transfer.amount,
      fee: 0
    }],
    merchant: null,
    comment: `BingX internal transfer: ${transfer.coin}`
  }))
}
