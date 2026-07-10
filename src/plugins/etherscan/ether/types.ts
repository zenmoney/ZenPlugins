import { Response } from '../common/types'

export interface AccountResponse extends Response {
  result: EthereumAccount[]
}

export interface BlockNoResponse extends Response {
  result: string
}

export interface TransactionResponse extends Response {
  result: EthereumTransaction[]
}

export interface EthereumAccount {
  account: string
  balance: string
}

export interface EthereumTransaction {
  blockNumber: string
  gasUsed: string
  hash: string
  from: string
  to: string
  value: string
  gasPrice: string
  isError: string
  timeStamp: string

  // Exists in API, but not used now. Keep for possible future updates
  // nonce: string
  // blockHash: string
  // transactionIndex: string
  // gas: string
  // txreceipt_status: string
  // input: string
  // contractAddress: string
  // cumulativeGasUsed: string
  // confirmations: string
  // methodId: string
  // functionName: string
}
