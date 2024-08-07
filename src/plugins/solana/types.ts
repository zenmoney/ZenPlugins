export interface GetBalanceResponse {
  value: number
}

export interface Transaction {
  blockTime: number
  meta: {
    postBalances: number[]
    preBalances: number[]
    fee: number
  }
  transaction: {
    message: {
      accountKeys: string[]
    }
    signatures: string[]
  }
}

export interface Signature {
  signature: string
  blockTime: number
}
