export interface Preferences {
  apiKey: string
  apiSecret: string
  accountLabel?: string
  startDate: string
  externalTransferAssets?: string
}

export interface Credentials {
  apiKey: string
  apiSecret: string
}

export interface SpotAsset {
  asset: string
  free: number
  locked: number
}

export interface CapitalTransfer {
  id: string
  direction: 'deposit' | 'withdrawal'
  coin: string
  amount: number
  fee: number
  date: Date
  network: string | null
}
