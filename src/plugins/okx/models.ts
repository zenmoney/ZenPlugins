export interface Preferences {
  apiKey: string
  apiSecret: string
  passphrase: string
  accountLabel?: string
  startDate: string
  externalTransferAssets?: string
  region?: 'global' | 'eea' | 'us' | 'tr'
}

export interface Credentials {
  apiKey: string
  apiSecret: string
  passphrase: string
  baseUrl: string
}

export interface WalletBalance {
  wallet: 'Trading' | 'Funding' | 'Savings'
  valueUsdt: number
  savings: boolean
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
