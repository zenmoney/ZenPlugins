export interface Preferences {
  apiKey: string
  apiSecret: string
  startDate: string
  cardBalanceCoins: string
}

export interface Auth {
  credentials: Credentials
  cardBalanceCoins: Set<string>
}

export interface Credentials {
  apiKey: string
  apiSecret: string
}

export type CardTransactionQueryType = 'SIDE_QUERY_AUTH' | 'SIDE_QUERY_FINANCIAL_ALL'

export interface CoinBalance {
  coin: string
  walletBalance: number
  transferBalance: number
}

// Subset of /v5/card/transaction/query-asset-records `data[]` items
// that we actually use. All amount fields come as strings in the API
// response and are converted to numbers at parse time.
export interface CardTransaction {
  txnId: string
  orderNo: string | null
  side: string
  tradeStatus: string
  txnCreate: string
  basicAmount: number
  basicCurrency: string
  baseAmount: number
  paidAmount: number
  paidCurrency: string
  transactionAmount: number
  transactionCurrency: string
  transactionCurrencyAmount: number
  merchName: string | null
  merchCity: string | null
  merchCountry: string | null
  mccCode: number | null
  merchCategoryDesc: string | null
  pan4: string | null
  declinedReason: string | null
}
