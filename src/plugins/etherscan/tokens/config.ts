import { ETHER_MAINNET, BNB_MAINNET } from '../common/config'

export type TokenConfig = Record<number, TokenConfigItem[]>

export interface TokenConfigItem {
  title: string
  contractAddress: string
  instrument: string
  convertBalance: (value: number) => number
}

export const generateTokenAddress = (
  address: string,
  token: TokenConfigItem
): string => {
  return `${address}-${token.contractAddress}`
}

export const SUPPORTED_TOKENS: TokenConfig = {
  [ETHER_MAINNET]: [
    {
      title: 'USDT',
      contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      instrument: 'USDT',
      convertBalance: (value: number) => value / 1000000
    },
    {
      title: 'USDC',
      contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      instrument: 'USDT',
      convertBalance: (value: number) => value / 1000000
    },
    {
      title: 'BUSD',
      contractAddress: '0x4fabb145d64652a948d72533023f6e7a623c7c53',
      instrument: 'USDT',
      convertBalance: (value: number) => value / 1000000
    }
  ],
  [BNB_MAINNET]: [
    {
      title: 'USDT',
      contractAddress: '0x55d398326f99059fF775485246999027B3197955',
      instrument: 'USDT',
      convertBalance: (value: number) => value / 1000000000 / 1000000000
    },
    {
      title: 'USDC',
      contractAddress: '0x8965349fb649a33a30cbfda057d8ec2c48abe2a2',
      instrument: 'USDT',
      convertBalance: (value: number) => value / 1000000000 / 1000000000
    }
  ]
}
