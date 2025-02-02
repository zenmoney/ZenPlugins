export const TOKENS_CONFIG: Record<string, { currency: string, title?: string, balanceProperty: keyof TokenInfo }> = {
  trx: {
    currency: 'TRX',
    title: 'TRON',
    balanceProperty: 'amount'
  },
  USDT: {
    currency: 'USDT',
    balanceProperty: 'quantity'
  },
  TUSD: {
    currency: 'USDT',
    balanceProperty: 'quantity'
  },
  USDD: {
    currency: 'USDT',
    balanceProperty: 'quantity'
  },
  USDC: {
    currency: 'USDT',
    balanceProperty: 'quantity'
  }
}

export const SUPPORTED_TOKENS = Object.keys(TOKENS_CONFIG)
export type SupportedToken = (typeof SUPPORTED_TOKENS)[number]
export interface TokenInfo {
  tokenId: string
  tokenName: string
  tokenAbbr: string
  tokenDecimal: number
  amount?: number | string
  quantity?: number | string
}

export interface SupportedTokenInfo extends TokenInfo {
  tokenAbbr: SupportedToken
}

export function isSupportedToken (tokenInfo: TokenInfo): tokenInfo is SupportedTokenInfo {
  return (SUPPORTED_TOKENS).includes(tokenInfo.tokenAbbr)
}
