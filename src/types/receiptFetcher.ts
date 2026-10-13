// Receipt plugin authoring and artifact contract, finalized version 1.
// Receipt semantics: ../../docs/plugins/receipt-fetchers/receipt.md
// Operations: ../../docs/plugins/receipt-fetchers/contract.md
// Metadata: ../../docs/plugins/receipt-fetchers/manifest.md

export type Matcher =
  | string
  | RegExp
  | { all: Matcher[] }
  | { any: Matcher[] }
  | { not: Matcher }

export type SerializedMatcher =
  | string
  | { regex: { source: string, flags: string } }
  | { all: SerializedMatcher[] }
  | { any: SerializedMatcher[] }
  | { not: SerializedMatcher }

export interface ReceiptFetcherManifest {
  id: string
  countryCodes: string[]
  capabilities: {
    fetchReceipt?: { matcher?: Matcher | null }
    parseReceiptCode?: { matcher?: Matcher | null }
  }
}

export interface ReceiptCode {
  format: 'qr'
  value: string
}

export type DecimalString = string
export type LocalDate = string
export type LocalTime = string

export interface ReceiptDateTime {
  date: LocalDate
  time?: LocalTime
  utcOffsetMinutes?: number
}

export interface ReceiptMerchantIdentifier {
  value: string
  countryCode?: string
  scheme?: string
}

export interface ReceiptMerchant {
  name?: string
  address?: string
  identifiers?: ReceiptMerchantIdentifier[]
}

export interface LoyaltyRedemption {
  programName?: string
  points?: DecimalString
}

// Known effect already reflected in its containing total; not a calculation step.
// Tax details use the same fields: name, amount, percent, and baseAmount.
export interface ReceiptAdjustment {
  kind: 'discount' | 'surcharge' | 'tax' | 'rounding' | 'other'
  name?: string
  amount: DecimalString
  percent?: DecimalString // "20" means 20%
  baseAmount?: DecimalString // Source-reported calculation base; taxable amount for kind: 'tax'
  reason?: 'promotion' | 'loyalty' | 'coupon' | 'manual' | 'other'
  loyalty?: LoyaltyRedemption
}

export type ReceiptPaymentMethod =
  | 'prepayment' // Applies money collected earlier; no new payment
  | 'cash'
  | 'card'
  | 'cashless' // Other cashless method, or the specific method is unknown
  | 'loyaltyPoints'
  | 'giftCard'
  | 'deferred' // Amount payable later; no money collected for this part yet
  | 'other'

// Receipt-level settlement entry, including applied prepayment and deferred amounts.
export interface ReceiptPayment {
  method: ReceiptPaymentMethod
  name?: string
  amount: DecimalString
  loyalty?: LoyaltyRedemption
}

export type ReceiptSettlementStage =
  | 'prepayment' // Before goods are supplied or services performed
  | 'delivery' // Goods are supplied or services performed
  | 'postpayment' // Payment for previously supplied goods/services

export interface ReceiptItem {
  name: string
  quantity: DecimalString
  unit?: string
  settlementStage?: ReceiptSettlementStage
  unitPrice?: DecimalString // Final unit price at item scope, when known or exactly derivable
  originalUnitPrice?: DecimalString // Source value that may already include some adjustments
  originalTotalAmount?: DecimalString // Source value that may already include some adjustments
  totalAmount: DecimalString // Authoritative final item contribution; breakdown may be incomplete
  adjustments?: ReceiptAdjustment[] // Known effects already included in totalAmount; breakdown may be incomplete
}

export interface Receipt {
  completeness: 'full' // Retrieved receipt, not a guarantee of complete monetary breakdowns
  id?: string
  issuedAt: ReceiptDateTime
  currency: string
  originalTotalAmount?: DecimalString // Source value that may already include some adjustments
  totalAmount: DecimalString // Authoritative document total, independent of detail reconciliation
  merchant?: ReceiptMerchant
  payments?: ReceiptPayment[]
  items: ReceiptItem[]
  adjustments?: ReceiptAdjustment[] // Known effects already included in totalAmount; breakdown may be incomplete
  operation: 'sale' | 'refund' | 'unknown'
}

export interface ReceiptPreview {
  completeness: 'preview'
  totalAmount?: DecimalString
  currency?: string
  issuedAt?: ReceiptDateTime
}

export type FetchReceiptResult =
  | { status: 'found', receipt: Receipt }
  | { status: 'notApplicable' }
  | { status: 'notFound' }
  | { status: 'pending' }

export type FetchReceipt = (args: {
  code: ReceiptCode
  isInBackground: boolean // Background runs cannot prompt the user.
}) => Promise<FetchReceiptResult>

export type ParseReceiptCodeResult =
  | { status: 'parsed', preview: ReceiptPreview }
  | { status: 'notApplicable' }

export type ParseReceiptCode = (args: {
  code: ReceiptCode
}) => Promise<ParseReceiptCodeResult>

// Compiled descriptor. Publication metadata belongs to the distribution service.
export interface ReceiptFetcherDescriptor {
  id: string
  countryCodes: string[]
  capabilities: {
    fetchReceipt?: { matcher?: SerializedMatcher | null }
    parseReceiptCode?: { matcher?: SerializedMatcher | null }
  }
  files: { js: ['index.js'] }
}
