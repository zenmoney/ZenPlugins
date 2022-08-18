import { Response } from '../common'

export interface AccountResponse extends Response {
  result: string
}

export interface TokenTransaction {
  blockNumber: string
  timeStamp: string
  hash: string
  nonce: string
  blockHash: string
  from: string
  contractAddress: string
  to: string
  value: string
  tokenName: string
  tokenSymbol: string
  tokenDecimal: string
  transactionIndex: string
  gas: string
  gasPrice: string
  gasUsed: string
  cumulativeGasUsed: string
  input: string
  confirmations: string
}

export interface TokenTransactionResponse extends Response {
  result: TokenTransaction[]
}

export interface TokenAccount {
  id: string
  balance: number
  contractAddress: string
}
