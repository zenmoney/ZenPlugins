import { AccountOrCard, AccountType, Transaction } from '../../types/zenmoney'
import { CapitalTransfer, SpotAsset } from './models'

const STABLECOINS = new Set(['USDT', 'USDC', 'USD', 'FDUSD', 'TUSD'])

export function parseSettlementAssets (value?: string): Set<string> {
  return new Set((value ?? 'USDT,USDC,USD,USDE,FDUSD,TUSD')
    .split(',')
    .map(asset => asset.trim().toUpperCase())
    .filter(asset => asset !== ''))
}

export function valueInUsdt (asset: string, amount: number, prices: Map<string, number>): number {
  const symbol = asset.toUpperCase()
  if (symbol === 'USDT' || symbol === 'USD') return amount
  const direct = prices.get(`${symbol}USDT`)
  if (direct != null) return amount * direct
  for (const bridge of ['BTC', 'ETH', 'USDC']) {
    const assetBridge = prices.get(`${symbol}${bridge}`)
    const bridgeUsdt = prices.get(`${bridge}USDT`)
    if (assetBridge != null && bridgeUsdt != null) return amount * assetBridge * bridgeUsdt
  }
  if (STABLECOINS.has(symbol)) return amount
  return 0
}

export function createSpotAccount (label: string, balances: SpotAsset[], prices: Map<string, number>): AccountOrCard {
  const title = label.trim() === '' ? 'MEXC' : label.trim()
  const idCandidate = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  const id = `${idCandidate === '' ? 'mexc' : idCandidate}_spot`
  const balance = balances.reduce((sum, asset) => sum + valueInUsdt(asset.asset, asset.free + asset.locked, prices), 0)
  return {
    id,
    type: AccountType.investment,
    title: `${title} Spot`,
    instrument: 'USD',
    balance: Number(balance.toFixed(8)),
    savings: false,
    syncIds: [id]
  }
}

export function convertExternalStablecoinTransfers (label: string, transfers: CapitalTransfer[], settlementAssets = STABLECOINS): Transaction[] {
  const prefix = label.trim() === '' ? 'MEXC' : label.trim()
  const idCandidate = prefix.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  const accountId = `${idCandidate === '' ? 'mexc' : idCandidate}_spot`
  return transfers.filter(transfer => settlementAssets.has(transfer.coin) && !Number.isNaN(transfer.date.getTime())).map(transfer => ({
    hold: false,
    date: transfer.date,
    movements: [{
      id: `mexc_${transfer.direction}_${transfer.id}`,
      account: { id: accountId },
      invoice: null,
      sum: transfer.direction === 'deposit' ? transfer.amount : -transfer.amount,
      fee: transfer.direction === 'withdrawal' ? -Math.abs(transfer.fee) : 0
    }],
    merchant: null,
    comment: `MEXC external ${transfer.direction}: ${transfer.coin}${transfer.network == null || transfer.network === '' ? '' : `; network ${transfer.network}`}`
  }))
}
