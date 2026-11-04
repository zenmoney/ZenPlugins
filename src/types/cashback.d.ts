/* Generated from src/common/cashback/payload.schema.json. Run yarn generate:cashback-types to update. */

/**
 * Polymorphic reward value. Use PercentReward for parsed percent rewards; use RawReward with only type and text when the bank exposes raw reward text such as "7% in bonus points".
 */
export type Reward = PercentReward | RawReward
/**
 * Cashback validity period. DatedPeriod defines a parsed month, quarter, year, or custom interval with from/to dates; PermanentPeriod is used for cashback without known dates. The raw variant is not supported.
 */
export type Period = DatedPeriod | PermanentPeriod
/**
 * Cashback state: active applies automatically; selected was chosen by the user; available can be selected; future starts later. Use null when the bank did not provide the state or the plugin could not parse it. The expired status is not supported.
 */
export type CashbackStatus = 'active' | 'selected' | 'available' | 'future' | null
/**
 * Required non-empty array of Binding elements. Null and raw bindings are not allowed. { "type": "all" } means all plugin accounts and is normally the only element. An account binding externalId identifies an account from the same plugin scrape, not a ZenMoney account. Card-specific cashback is bound to the corresponding account.
 *
 * @minItems 1
 */
export type Bindings = [Binding, ...Binding[]]
/**
 * Binding discriminated by type: all for every plugin account or account for one account identified by externalId. Card-specific cashback uses an account binding for the corresponding account. The raw variant is not supported.
 */
export type Binding = AllBinding | AccountBinding
/**
 * Required non-null purchase scope for matching transactions. Use parsed scopes when available: all purchases, MCC list, merchant, or bank category. Use RawScope with only type and text when the bank exposes raw scope text for later client-side parsing.
 */
export type Scope = AllPurchasesScope | MccScope | MerchantScope | CategoryScope | RawScope
/**
 * Non-empty list of 1-9999 Merchant Category Codes. Consumer constraint: client requires integer lexical encoding such as 5411; mathematically integral JSON numbers encoded as 5411.0 or 5411e0 cause invalid_request for the entire snapshot.
 *
 * @minItems 1
 */
export type MccList = [number, ...number[]]
/**
 * List of exclusions from a scope. Empty list means the bank explicitly returned no exclusions; omitted means the plugin did not receive or parse exclusions.
 */
export type ScopeExclusions = Array<MccExclusion | MerchantExclusion | TextExclusion>

/**
 * Bank plugin response with cashback rules. Contains no ZenMoney connectionId/accountId. Bindings use account externalIds from the same plugin scrape, not ZenMoney account ids. Card-specific cashback is bound to the corresponding account. Raw bank text is allowed only in reward and scope for later client-side parsing.
 */
export interface PluginCashbacksPayload {
  /**
   * Schema version. Current version is 1.
   */
  schemaVersion?: 1
  /**
   * ISO-8601 timestamp when the plugin scraped this data.
   */
  scrapedAt?: string
  /**
   * Flat list of cashback rules, categories, and offers from the bank. content contains a structured title and an optional description; period and bindings must also be structured. The raw variant is allowed only for reward and scope.
   */
  cashbacks: Cashback[]
}
/**
 * One cashback rule from a bank: a category, merchant offer, all-purchases cashback, or another earning condition. content contains a parsed non-empty title and an optional description. bindings is a required non-empty array of bindings. scope is required and must not be null. Only reward and scope may contain raw text.
 */
export interface Cashback {
  /**
   * Stable cashback/category/offer id from the bank, if available.
   */
  externalId?: string | null
  content: CashbackContent
  /**
   * Bank-provided icon or image URL for this cashback.
   */
  imageUrl?: string | null
  reward: Reward
  period: Period
  status: CashbackStatus
  bindings: Bindings
  scope: Scope
}
/**
 * Structured cashback content with a required non-empty title and an optional description. The raw variant is not supported.
 */
export interface CashbackContent {
  /**
   * Parsed content discriminator.
   */
  type: 'structured'
  /**
   * Parsed user-visible cashback title from the bank.
   */
  title: string
  /**
   * Parsed bank-provided explanation, restrictions, or conditions. Omit it when unavailable, or use null when explicitly known to be absent.
   */
  description?: string | null
}
/**
 * Parsed percent reward.
 */
export interface PercentReward {
  /**
   * Percent reward discriminator.
   */
  type: 'percent'
  /**
   * Decimal value encoded as string to avoid floating-point precision issues.
   */
  value: string
  /**
   * Reward unit. For percent rewards this must be PERCENT.
   */
  unit: 'PERCENT'
}
/**
 * Raw bank-provided reward text when the reward cannot be safely parsed or represented as a structured percent reward, for example "7% in bonus points". Uses text as the only payload field besides the type discriminator.
 */
export interface RawReward {
  /**
   * Raw reward discriminator.
   */
  type: 'raw'
  /**
   * Raw bank-provided reward text, for example "7% in bonus points".
   */
  text: string
}
/**
 * Dated cashback period such as month, quarter, year, or custom promo interval.
 */
export interface DatedPeriod {
  /**
   * Period granularity.
   */
  type: 'month' | 'quarter' | 'year' | 'custom'
  /**
   * Inclusive period start date.
   */
  from: string
  /**
   * Inclusive period end date.
   */
  to: string
}
/**
 * Cashback without known dates, such as a permanent base rate. from/to may be omitted or set to null.
 */
export interface PermanentPeriod {
  /**
   * Permanent period marker.
   */
  type: 'permanent'
  /**
   * Permanent periods have no known start date. Use null when keeping a stable period object shape.
   */
  from?: null
  /**
   * Permanent periods have no known end date. Use null when keeping a stable period object shape.
   */
  to?: null
}
/**
 * All accounts returned by the plugin are eligible for this cashback. Normally use { "type": "all" } as the only element in a non-null bindings array.
 */
export interface AllBinding {
  /**
   * All plugin accounts binding discriminator.
   */
  type: 'all'
}
/**
 * Exactly one plugin account is eligible for this cashback, identified by its externalId returned by the same plugin scrape. Use this binding for card-specific cashback by referencing the corresponding plugin account.
 */
export interface AccountBinding {
  /**
   * Single plugin account binding discriminator.
   */
  type: 'account'
  /**
   * Plugin account externalId returned by the same plugin scrape. This is not a ZenMoney account id.
   */
  externalId: string
}
/**
 * Cashback applies to all purchases unless excluded.
 */
export interface AllPurchasesScope {
  /**
   * All-purchases scope discriminator.
   */
  type: 'all_purchases'
  exclude?: ScopeExclusions
}
/**
 * Exclude listed MCC codes.
 */
export interface MccExclusion {
  /**
   * MCC exclusion discriminator.
   */
  type: 'mcc'
  mcc: MccList
}
/**
 * Exclude one merchant/brand.
 */
export interface MerchantExclusion {
  /**
   * Merchant exclusion discriminator.
   */
  type: 'merchant'
  merchant: Merchant
}
/**
 * Bank-provided merchant/brand reference.
 */
export interface Merchant {
  /**
   * Merchant id from the bank, if available.
   */
  externalId?: string
  /**
   * User-visible merchant title.
   */
  title: string
}
/**
 * Free-text exclusion that cannot be safely structured.
 */
export interface TextExclusion {
  /**
   * Text exclusion discriminator.
   */
  type: 'text'
  /**
   * Bank-provided exclusion text.
   */
  text: string
}
/**
 * Cashback applies to transactions with listed MCC codes.
 */
export interface MccScope {
  /**
   * MCC scope discriminator.
   */
  type: 'mcc'
  mcc: MccList
  /**
   * Optional non-MCC exclusions from this scope. MCC exclusions are invalid because mcc already defines the final eligible MCC list.
   */
  exclude?: ScopeExclusions & unknown[]
}
/**
 * Cashback applies to one bank-provided merchant/brand.
 */
export interface MerchantScope {
  /**
   * Merchant scope discriminator.
   */
  type: 'merchant'
  merchant: Merchant
  exclude?: ScopeExclusions
}
/**
 * Cashback applies to a bank category when MCCs/merchants are not exposed or are intentionally abstracted.
 */
export interface CategoryScope {
  /**
   * Bank-category scope discriminator.
   */
  type: 'category'
  category: Category
  exclude?: ScopeExclusions
}
/**
 * Bank-provided category reference.
 */
export interface Category {
  /**
   * Category id from the bank, if available.
   */
  externalId?: string
  /**
   * User-visible category title.
   */
  title: string
}
/**
 * Raw bank-provided purchase scope text when the plugin could scrape a scope but could not parse MCCs, merchants, or categories. This raw fallback uses text as the only payload field besides the type discriminator.
 */
export interface RawScope {
  /**
   * Raw purchase scope discriminator.
   */
  type: 'raw'
  /**
   * Raw bank-provided purchase scope text for later client-side parsing.
   */
  text: string
}
