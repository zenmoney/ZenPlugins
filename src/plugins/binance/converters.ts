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

function idPrefix (label: string): string {
  const prefix = label.trim() === '' ? 'Binance' : label.trim()
  const transliteration: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'yo',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'kh',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ъ: '',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya'
  }
  const latin = Array.from(prefix.toLowerCase()).map(character => transliteration[character] ?? character).join('')
  const candidate = latin.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  return candidate === '' ? 'binance' : candidate
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
  const accountPrefix = idPrefix(prefix)
  const accounts: AccountOrCard[] = []
  if (selection.spot) {
    const rows = spot.map(row => ({ asset: row.asset, amount: row.free + row.locked }))
    accounts.push(account(`${accountPrefix}_spot`, `${prefix} Spot`, total(rows, prices), false))
  }
  if (selection.funding) {
    accounts.push(account(`${accountPrefix}_funding`, `${prefix} Funding`, total(funding, prices), false))
  }
  if (selection.earn) {
    accounts.push(account(`${accountPrefix}_earn`, `${prefix} Earn`, total([...flexible, ...lockedEarn], prices), true))
  }
  const representedWallets = new Set(['spot', 'funding', 'earn', 'simple earn'])
  for (const wallet of discoveredWallets) {
    const normalized = wallet.walletName.trim().toLowerCase()
    if (!wallet.active || representedWallets.has(normalized)) continue
    const walletIdCandidate = normalized.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    const walletId = walletIdCandidate === '' ? 'wallet' : walletIdCandidate
    accounts.push(account(`${accountPrefix}_${walletId}`, `${prefix} ${wallet.walletName}`, Number(wallet.balance.toFixed(8)), true))
  }
  if (detailedWallets) return accounts

  // Household-finance default: one exchange portfolio, not a row per
  // technical wallet.  Users who need wallet-level liquidity controls can
  // explicitly choose the detailed layout in preferences.
  return [account(`${accountPrefix}_portfolio`, prefix, Number(accounts.reduce((sum, item) => sum + (item.balance ?? 0), 0).toFixed(8)), true)]
}

function account (id: string, title: string, balance: number, savings: boolean): AccountOrCard {
  return {
    id,
    type: AccountType.investment,
    title,
    instrument: 'USDT',
    balance,
    savings,
    syncIds: [id]
  }
}

function ids (label: string, detailedWallets: boolean): Record<'spot' | 'funding' | 'earn', string> {
  const prefix = idPrefix(label)
  if (!detailedWallets) return { spot: `${prefix}_portfolio`, funding: `${prefix}_portfolio`, earn: `${prefix}_portfolio` }
  return { spot: `${prefix}_spot`, funding: `${prefix}_funding`, earn: `${prefix}_earn` }
}

export function convertExternalStablecoinTransfers (
  label: string,
  transfers: CapitalTransfer[],
  selection: Pick<AccountSelection, 'spot' | 'funding'> = { spot: true, funding: true },
  detailedWallets = false,
  settlementAssets = STABLECOINS
): Transaction[] {
  const prefix = idPrefix(label)
  return transfers
    .filter(transfer => {
      const accountIsEnabled = transfer.walletType === 1 ? selection.funding : selection.spot
      return accountIsEnabled && settlementAssets.has(transfer.coin) && !Number.isNaN(transfer.date.getTime())
    })
    .map(transfer => {
      const sign = transfer.direction === 'deposit' ? 1 : -1
      const accountId = detailedWallets ? (transfer.walletType === 1 ? `${prefix}_funding` : `${prefix}_spot`) : `${prefix}_portfolio`
      const network = transfer.network == null || transfer.network === '' ? '' : `; network ${transfer.network}`
      return {
        hold: false,
        date: transfer.date,
        movements: [{
          id: `${prefix}_${transfer.direction}_${transfer.id}`,
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
  const prefix = idPrefix(label)
  return transfers.flatMap(transfer => {
    const wallet = transfer.walletType === 2 ? 'spot' : transfer.walletType === 5 ? 'earn' : transfer.walletType === 1 ? 'funding' : null
    if (wallet == null || !selection[wallet] || !settlementAssets.has(transfer.coin) || Number.isNaN(transfer.date.getTime())) return []
    const counterparty = transfer.counterparty == null ? '' : `; ${transfer.counterparty}`
    return [{
      hold: false,
      date: transfer.date,
      movements: [{ id: `${prefix}_pay_${transfer.id}`, account: { id: accountIds[wallet] }, invoice: null, sum: transfer.amount, fee: 0 }],
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
  const prefix = idPrefix(label)
  if (!selection.funding) return []
  return transfers.filter(row => settlementAssets.has(row.coin) && !Number.isNaN(row.date.getTime())).map(row => {
    const fiat = row.fiat === '' || row.fiatAmount === 0 ? '' : `; ${row.fiatAmount} ${row.fiat}`
    const counterparty = row.counterparty == null ? '' : `; ${row.counterparty}`
    return {
      hold: false,
      date: row.date,
      movements: [{
        id: `${prefix}_c2c_${row.id}`,
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
  const prefix = idPrefix(label)
  return transfers.filter(row => settlementAssets.has(row.coin) && !Number.isNaN(row.date.getTime())).map(row => ({
    hold: false,
    date: row.date,
    movements: [
      { id: `${prefix}_internal_${row.from}_${row.to}_${row.id}_out`, account: { id: accountIds[row.from] }, invoice: null, sum: -row.amount, fee: 0 },
      { id: `${prefix}_internal_${row.from}_${row.to}_${row.id}_in`, account: { id: accountIds[row.to] }, invoice: null, sum: row.amount, fee: 0 }
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
  const prefix = idPrefix(label)
  return transfers.filter(row => settlementAssets.has(row.coin) && !Number.isNaN(row.date.getTime())).map(row => {
    const from = row.direction === 'subscription' ? accountIds.spot : accountIds.earn
    const to = row.direction === 'subscription' ? accountIds.earn : accountIds.spot
    return {
      hold: false,
      date: row.date,
      movements: [
        { id: `${prefix}_earn_${row.direction}_${row.id}_out`, account: { id: from }, invoice: null, sum: -row.amount, fee: 0 },
        { id: `${prefix}_earn_${row.direction}_${row.id}_in`, account: { id: to }, invoice: null, sum: row.amount, fee: 0 }
      ],
      merchant: null,
      comment: `Binance Earn ${row.direction}: ${row.coin}`
    }
  })
}
