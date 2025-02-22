export interface GetBalanceResponse {
  value: number
}

export interface GetTokenAccountsByOwnerResponse {
  value: Array<{
    pubkey: string
    account: {
      data: {
        parsed: {
          info: {
            mint: string
            owner: string
            tokenAmount: TokenAmount
          }
        }
      }
    }
  }>
}

export interface TokenAmount {
  amount: string
  decimals: number
  uiAmount: number
  uiAmountString: string
}

export interface TokenAccount {
  pubkey: string
  owner: string
  mint: string
  amount: number
}

export interface TokenBalance {
  accountIndex: number
  mint: string
  owner: string
  programId: string
  uiTokenAmount: TokenAmount
}

export interface KnownTokens {
  [mint: string]: {
    instrument: string
    title: string
  }
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
    postTokenBalances: TokenBalance[]
    preTokenBalances: TokenBalance[]
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
