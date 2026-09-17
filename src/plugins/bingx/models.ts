export interface Preferences {
  apiKey: string
  apiSecret: string
  accountLabel?: string
  startDate: string
  externalTransferAssets?: string
}

export interface Credentials { apiKey: string, apiSecret: string }

export interface WalletBalance { wallet: string, valueUsdt: number, savings: boolean }

export interface CapitalTransfer {
  id: string
  direction: 'deposit' | 'withdrawal'
  coin: string
  amount: number
  fee: number
  date: Date
  network: string | null
}

export interface InternalTransfer {
  id: string
  coin: string
  amount: number
  date: Date
  fromWallet: string
  toWallet: string
}
