export interface Preferences {
  apiKey: string
  apiSecret: string
  accountLabel?: string
  baseUrl?: string
  syncSpot?: boolean
  syncFunding?: boolean
  syncEarn?: boolean
  detailedWallets?: boolean
  syncTransactions?: boolean
  externalTransferAssets?: string
}

export interface Credentials {
  apiKey: string
  apiSecret: string
  baseUrl: string
}

export interface AssetAmount {
  asset: string
  free: number
  locked: number
}

export interface EarnPosition {
  asset: string
  amount: number
}

export interface FundingAsset {
  asset: string
  amount: number
}

export interface AccountSelection {
  spot: boolean
  funding: boolean
  earn: boolean
}

export interface WalletBalance {
  walletName: string
  balance: number
  active: boolean
}

export interface CapitalTransfer {
  id: string
  direction: 'deposit' | 'withdrawal'
  coin: string
  amount: number
  fee: number
  date: Date
  network: string | null
  walletType: number
}

export interface PayTransfer {
  id: string
  amount: number
  coin: string
  date: Date
  walletType: number
  orderType: string
  counterparty: string | null
}

export interface C2CTransfer {
  id: string
  direction: 'buy' | 'sell'
  coin: string
  amount: number
  fee: number
  date: Date
  fiat: string
  fiatAmount: number
  counterparty: string | null
}

export interface InternalTransfer {
  id: string
  coin: string
  amount: number
  date: Date
  from: 'spot' | 'funding'
  to: 'spot' | 'funding'
}

export interface EarnTransfer {
  id: string
  coin: string
  amount: number
  date: Date
  direction: 'subscription' | 'redemption'
}
