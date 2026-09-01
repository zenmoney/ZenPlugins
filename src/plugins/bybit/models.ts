export interface Preferences {
  apiKey: string
  apiSecret: string
  region?: string
  // Kept for migration from local builds that stored the official host.
  baseUrl?: string
  startDate: string
  syncCard?: boolean
  syncTransfers?: boolean
  transferAssets?: string
  externalTransferAccount?: 'funding' | 'unified'
  earnTransferAccount?: 'funding' | 'unified'
  // `auto` is retained solely to produce a migration error for old local
  // preferences created before the plugin required an explicit choice.
  cardPaymentSource?: 'auto' | 'earn' | 'funding'
}

export interface Auth {
  credentials: Credentials
}

export interface Credentials {
  apiKey: string
  apiSecret: string
  baseUrl: string
  siteId?: string
}

// Kazakhstan's live Card API accepts the aggregate query used by the existing
// integration, while the separately documented FINANCIAL/REFUND values return
// retCode=120110001 (param_illegal). Keep the proven aggregate mode so cleared
// purchases and refunds are both available across the tested regional account.
export type CardTransactionQueryType = 'SIDE_QUERY_AUTH' | 'SIDE_QUERY_FINANCIAL_ALL'

export interface CoinBalance {
  coin: string
  walletBalance: number
  transferBalance: number
}

export interface FlexibleEarnPosition {
  coin: string
  amount: number
  availableAmount: number
}

export interface UnifiedWallet {
  totalEquity: number
}

export interface ExternalTransfer {
  id: string
  direction: 'deposit' | 'withdrawal'
  coin: string
  amount: number
  fee: number
  date: Date
  network: string | null
}

export interface InternalTransfer {
  id: string
  coin: string
  amount: number
  fromAccountType: string
  toAccountType: string
  date: Date
}

export interface EarnTransfer {
  id: string
  coin: string
  amount: number
  type: 'Stake' | 'Redeem'
  date: Date
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
  totalFees: number
}
