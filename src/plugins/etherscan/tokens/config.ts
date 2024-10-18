export interface TokenConfig {
  title: string
  contractAddress: string
  instrument: string
  convertBalance: (value: number) => number
}

export const generateTokenAddress = (address: string, token: TokenConfig): string => {
  return `${address}-${token.contractAddress}`
}

export const SUPPORTED_TOKENS: TokenConfig[] = [
  {
    title: 'USDT',
    contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    instrument: 'USDT',
    convertBalance: (value) => value / 1000000
  },
  {
    title: 'USDC',
    contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    instrument: 'USDT',
    convertBalance: (value) => value / 1000000
  },
  {
    title: 'BUSD',
    contractAddress: '0x4fabb145d64652a948d72533023f6e7a623c7c53',
    instrument: 'USDT',
    convertBalance: (value) => value / 1000000
  }
]
