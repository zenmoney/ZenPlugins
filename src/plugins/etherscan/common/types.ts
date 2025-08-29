import { ETHER_MAINNET, BNB_MAINNET } from './config'

export interface Response {
  status: string
  message: string
}

export interface BlockNoResponse extends Response {
  result: string
}

export type Chain = typeof ETHER_MAINNET | typeof BNB_MAINNET
