export interface GetBalanceResponse {
  value: number
}

export interface AccountKeys {
  pubkey: string
  signer: boolean
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
      accountKeys: AccountKeys[]
    }
    signatures: string[]
  }
}

export interface Signature {
  signature: string
  blockTime: number
}
