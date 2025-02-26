import { KnownTokens } from './types'

// TODO: allow user to override these for faster sync if they have a private RPC endpoint
export const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com'
export const RPC_MAX_RPS = 2

export const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'

export const KNOWN_TOKENS: KnownTokens = {
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: {
    instrument: 'USDT',
    title: 'Tether USDT'
  },
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
    instrument: 'USDT', // ZenMoney doesn't have USDC
    title: 'USD Coin'
  }
}

export const TOKEN_DECIMALS = 1e6 // 6 decimals == 10**6
export const ZM_SOL_PRESICION = 1e6 // 1 SOL == 1e6 μSOL
