import { AccountOrCard, AccountType, Transaction } from '../../types/zenmoney'
import { AccountSelection, AssetAmount, C2CTransfer, CapitalTransfer, EarnPosition, EarnTransfer, FundingAsset, InternalTransfer, PayTransfer, WalletBalance } from './models'

export const STABLECOINS = new Set(['USDT', 'USDC', 'FDUSD', 'TUSD', 'USD'])

export function valueInUsdt (asset: string, amount: number, prices: Map<string, number>): number {
  const normalized = asset.toUpperCase()
  if (normalized === 'USDT' || normalized === 'USD') return amount
  const direct = prices.get(`${normalized}USDT`)
  if (direct != null) return amount * direct
  if (STABLECOINS.has(normalized)) return amount
  for (const bridge of ['BTC', 'ETH', 'BNB']) {
    const assetBridge = prices.get(`${normalized}${bridge}`)
    const bridgeUsdt = prices.get(`${bridge}USDT`)
    if (assetBridge != null && bridgeUsdt != null) return amount * assetBridge * bridgeUsdt
  }
  return 0
}

function total (rows: Array<{ asset: string, amount: number }>, prices: Map<string, number>): number {
  const value = rows.reduce((sum, row) => sum + valueInUsdt(row.asset, row.amount, prices), 0)
  return Number(value.toFixed(8))
}

export function createAccounts (
  label: string,
  spot: AssetAmount[],
  funding: FundingAsset[],
  flexible: EarnPosition[],
  lockedEarn: EarnPosition[],
  prices: Map<string, number>,
  selection: AccountSelection = { spot: true, funding: true, earn: true },
  discoveredWallets: WalletBalance[] = [],
  detailedWallets = false
): AccountOrCard[] {
  const prefix = label.trim() === '' ? 'Binance' : label.trim()
  const idPrefixCandidate = prefix.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  const idPrefix = idPrefixCandidate === '' ? 'binance' : idPrefixCandidate
  const accounts: AccountOrCard[] = []
  if (selection.spot) {
    const rows = spot.map(row => ({ asset: row.asset, amount: row.free + row.locked }))
    accounts.push(account(`${idPrefix}_spot`, `${prefix} Spot`, total(rows, prices), false))
  }
  if (selection.funding) {
    accounts.push(account(`${idPrefix}_funding`, `${prefix} Funding`, total(funding, prices), false))
  }
  if (selection.earn) {
    accounts.push(account(`${idPrefix}_earn`, `${prefix} Earn`, total([...flexible, ...lockedEarn], prices), true))
  }
  const representedWallets = new Set(['spot', 'funding', 'earn', 'simple earn'])
  for (const wallet of discoveredWallets) {
    const normalized = wallet.walletName.trim().toLowerCase()
    if (!wallet.active || representedWallets.has(normalized)) continue
    const walletIdCandidate = normalized.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    const walletId = walletIdCandidate === '' ? 'wallet' : walletIdCandidate
    accounts.push(account(`${idPrefix}_${walletId}`, `${prefix} ${wallet.walletName}`, Number(wallet.balance.toFixed(8)), true))
  }
  if (detailedWallets) return accounts

  // Household-finance default: one exchange portfolio, not a row per
  // technical wallet.  Users who need wallet-level liquidity controls can
  // explicitly choose the detailed layout in preferences.
  return [account(`${idPrefix}_portfolio`, prefix, Number(accounts.reduce((sum, item) => sum + (item.balance ?? 0), 0).toFixed(8)), true)]
}

function account (id: string, title: string, balance: number, savings: boolean): AccountOrCard {
  return {
    id,
    type: AccountType.investment,
    title,
    instrument: 'USD',
    balance,
    savings,
    syncIds: [id]
  }
}

function ids (label: string, detailedWallets: boolean): Record<'spot' | 'funding' | 'earn', string> {
  const prefix = label.trim() === '' ? 'Binance' : label.trim()
  const candidate = prefix.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  const idPrefix = candidate === '' ? 'binance' : candidate
  if (!detailedWallets) return { spot: `${idPrefix}_portfolio`, funding: `${idPrefix}_portfolio`, earn: `${idPrefix}_portfolio` }
  return { spot: `${idPrefix}_spot`, funding: `${idPrefix}_funding`, earn: `${idPrefix}_earn` }
}

export function convertExternalStablecoinTransfers (
  label: string,
  transfers: CapitalTransfer[],
  selection: Pick<AccountSelection, 'spot' | 'funding'> = { spot: true, funding: true },
  detailedWallets = false,
  settlementAssets = STABLECOINS
): Transaction[] {
  const prefix = label.trim() === '' ? 'Binance' : label.trim()
  const idPrefixCandidate = prefix.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  const idPrefix = idPrefixCandidate === '' ? 'binance' : idPrefixCandidate
  return transfers
    .filter(transfer => {
      const accountIsEnabled = transfer.walletType === 1 ? selection.funding : selection.spot
      return accountIsEnabled && settlementAssets.has(transfer.coin) && !Number.isNaN(transfer.date.getTime())
    })
    .map(transfer => {
      const sign = transfer.direction === 'deposit' ? 1 : -1
      const accountId = detailedWallets ? (transfer.walletType === 1 ? `${idPrefix}_funding` : `${idPrefix}_spot`) : `${idPrefix}_portfolio`
      const network = transfer.network == null || transfer.network === '' ? '' : `; network ${transfer.network}`
      return {
        hold: false,
        date: transfer.date,
        movements: [{
          id: `binance_${transfer.direction}_${transfer.id}`,
          account: { id: accountId },
          invoice: null,
          sum: sign * transfer.amount,
          fee: transfer.direction === 'withdrawal' && transfer.fee !== 0 ? -Math.abs(transfer.fee) : 0
        }],
        merchant: null,
        comment: `Binance external ${transfer.direction}: ${transfer.coin}${network}`
      }
    })
}

export function convertPayTransfers (
  label: string,
  transfers: PayTransfer[],
  selection: AccountSelection,
  detailedWallets: boolean,
  settlementAssets = STABLECOINS
): Transaction[] {
  const accountIds = ids(label, detailedWallets)
  return transfers.flatMap(transfer => {
    const wallet = transfer.walletType === 2 ? 'spot' : transfer.walletType === 5 ? 'earn' : transfer.walletType === 1 ? 'funding' : null
    if (wallet == null || !selection[wallet] || !settlementAssets.has(transfer.coin) || Number.isNaN(transfer.date.getTime())) return []
    const counterparty = transfer.counterparty == null ? '' : `; ${transfer.counterparty}`
    return [{
      hold: false,
      date: transfer.date,
      movements: [{ id: `binance_pay_${transfer.id}`, account: { id: accountIds[wallet] }, invoice: null, sum: transfer.amount, fee: 0 }],
      merchant: null,
      comment: `Binance Pay ${transfer.orderType}: ${transfer.coin}${counterparty}`
    }]
  })
}

export function convertC2CTransfers (
  label: string,
  transfers: C2CTransfer[],
  selection: AccountSelection,
  detailedWallets: boolean,
  settlementAssets = STABLECOINS
): Transaction[] {
  const accountId = ids(label, detailedWallets).funding
  if (!selection.funding) return []
  return transfers.filter(row => settlementAssets.has(row.coin) && !Number.isNaN(row.date.getTime())).map(row => {
    const fiat = row.fiat === '' || row.fiatAmount === 0 ? '' : `; ${row.fiatAmount} ${row.fiat}`
    const counterparty = row.counterparty == null ? '' : `; ${row.counterparty}`
    return {
      hold: false,
      date: row.date,
      movements: [{
        id: `binance_c2c_${row.id}`,
        account: { id: accountId },
        invoice: null,
        sum: row.direction === 'buy' ? row.amount : -row.amount,
        fee: row.fee === 0 ? 0 : -Math.abs(row.fee)
      }],
      merchant: null,
      comment: `Binance P2P ${row.direction}: ${row.coin}${fiat}${counterparty}`
    }
  })
}

export function convertInternalTransfers (
  label: string,
  transfers: InternalTransfer[],
  selection: AccountSelection,
  detailedWallets: boolean,
  settlementAssets = STABLECOINS
): Transaction[] {
  if (!detailedWallets || !selection.spot || !selection.funding) return []
  const accountIds = ids(label, true)
  return transfers.filter(row => settlementAssets.has(row.coin) && !Number.isNaN(row.date.getTime())).map(row => ({
    hold: false,
    date: row.date,
    movements: [
      { id: `binance_internal_${row.from}_${row.to}_${row.id}_out`, account: { id: accountIds[row.from] }, invoice: null, sum: -row.amount, fee: 0 },
      { id: `binance_internal_${row.from}_${row.to}_${row.id}_in`, account: { id: accountIds[row.to] }, invoice: null, sum: row.amount, fee: 0 }
    ],
    merchant: null,
    comment: `Binance internal transfer: ${row.from} → ${row.to}; ${row.coin}`
  }))
}

export function convertEarnTransfers (
  label: string,
  transfers: EarnTransfer[],
  selection: AccountSelection,
  detailedWallets: boolean,
  settlementAssets = STABLECOINS
): Transaction[] {
  if (!detailedWallets || !selection.spot || !selection.earn) return []
  const accountIds = ids(label, true)
  return transfers.filter(row => settlementAssets.has(row.coin) && !Number.isNaN(row.date.getTime())).map(row => {
    const from = row.direction === 'subscription' ? accountIds.spot : accountIds.earn
    const to = row.direction === 'subscription' ? accountIds.earn : accountIds.spot
    return {
      hold: false,
      date: row.date,
      movements: [
        { id: `binance_earn_${row.direction}_${row.id}_out`, account: { id: from }, invoice: null, sum: -row.amount, fee: 0 },
        { id: `binance_earn_${row.direction}_${row.id}_in`, account: { id: to }, invoice: null, sum: row.amount, fee: 0 }
      ],
      merchant: null,
      comment: `Binance Earn ${row.direction}: ${row.coin}`
    }
  })
}
