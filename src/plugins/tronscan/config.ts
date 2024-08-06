export const TOKENS_CONFIG: Record<string, { currency: string, title?: string }> = {
  trx: {
    currency: 'TRX',
    title: 'TRON'
  },
  USDT: {
    currency: 'USDT'
  },
  TUSD: {
    currency: 'USDT'
  },
  USDD: {
    currency: 'USDT'
  },
  USDC: {
    currency: 'USDT'
  }
}

export const SUPPORTED_TOKENS = Object.keys(TOKENS_CONFIG)
export type SupportedToken = (typeof SUPPORTED_TOKENS)[number]
export interface TokenInfo {
  tokenId: string
  tokenName: string
  tokenAbbr: string
  tokenDecimal: number
  quantity?: number | string
}

export interface SupportedTokenInfo extends TokenInfo {
  tokenAbbr: SupportedToken
}

export function isSupportedToken (tokenInfo: TokenInfo): tokenInfo is SupportedTokenInfo {
  return (SUPPORTED_TOKENS).includes(tokenInfo.tokenAbbr)
}
