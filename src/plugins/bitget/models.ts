export interface Preferences {
  apiKey: string
  apiSecret: string
  passphrase: string
  accountLabel?: string
  startDate: string
  externalTransferAssets?: string
}

export interface Credentials {
  apiKey: string
  apiSecret: string
  passphrase: string
}

export interface WalletBalance {
  accountType: string
  valueUsdt: number
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
