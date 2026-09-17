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
    contractAddress: '0x55d398326f99059ff775485246999027b3197955',
    instrument: 'USDT',
    // Binance-Peg USDT has 18 on-chain decimals.
    convertBalance: (value) => value / 1000000000000000000
  },
  {
    title: 'anyUSDC (legacy)',
    contractAddress: '0x8965349fb649a33a30cbfda057d8ec2c48abe2a2',
    instrument: 'USDT',
    convertBalance: (value) => value / 1000000000000000000
  },
  {
    title: 'USDC',
    contractAddress: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    instrument: 'USDT',
    // Binance-Peg USDC on BSC also has 18 on-chain decimals.
    convertBalance: (value) => value / 1000000000000000000
  }
]
