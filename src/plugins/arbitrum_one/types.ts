export interface ArbiscanResponse<T> {
  status: string
  message: string
  result: T
}

export interface BalanceResponse {
  balance: string
}

export interface TokenBalance {
  contract: string
  balance: string
  symbol: string
}

export interface Transaction {
  hash: string
  timeStamp: string
  from: string
  to: string
  value: string
  gasUsed: string
  gasPrice: string
  contractAddress?: string
  contract?: string
}

export interface TokenTransfer {
  hash: string
  timeStamp: string
  from: string
  to: string
  value: string
  contractAddress: string
  contract: string
}

export interface Preferences {
  apiKey: string
  account: string | string[]
}
