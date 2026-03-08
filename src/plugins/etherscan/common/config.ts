export const ETHER_MAINNET = 1
export const BNB_MAINNET = 56
export const ARBITRUM_ONE = 42161

export const Instruments: Record<number, string> = {
  [ETHER_MAINNET]: 'μETH',
  [BNB_MAINNET]: 'bnb',
  [ARBITRUM_ONE]: 'μETH'
}

export const ChainNames: Record<number, string> = {
  [ETHER_MAINNET]: 'Ethereum',
  [BNB_MAINNET]: 'BSC',
  [ARBITRUM_ONE]: 'Arbitrum One'
}

export function chainAccountId (chain: number, address: string): string {
  return `${chain}-${address}`
}

// Minimum timestamps (seconds) — network launch dates
// Requests before these dates return "No closest block found"
export const ChainMinTimestamp: Record<number, number> = {
  [ETHER_MAINNET]: 1438269973, // 2015-07-30
  [BNB_MAINNET]: 1598671449, // 2020-08-29
  [ARBITRUM_ONE]: 1630425600 // 2021-08-31
}
