import { Account } from '../../types/zenmoney'

/** Login credentials used only when saved authorization cannot be refreshed. */
export interface Preferences {
  readonly login: string
  readonly password: string
}

/** Refresh artifacts retained from a successful browser-compatible authorization. */
export interface RefreshCredentials {
  readonly refreshToken: string
  readonly clientAuth: string
  readonly clientId: string
}

/** Confirmed tokens persisted before client discovery or account loading. */
export interface Auth extends RefreshCredentials {
  readonly accessToken: string
  readonly expiresAt: number
}

/** Bank login action and an optional investigated credential rejection code. */
export interface LoginPage {
  readonly action: string
  readonly error: string
}

/** OneSpan application confirmation form and external request identity. */
export interface PushPage {
  readonly action: string
  readonly evaluatedRequestId: string
  readonly sessionId: string
}

/** A token response or a confirmed rejection of the refresh grant. */
export type RefreshResult = { readonly kind: 'token', readonly token: unknown } | { readonly kind: 'rejected' }

/** Deposit identity linking the account to its history endpoint. */
export interface DepositSource {
  readonly accountId: string
  readonly productId: string
}

/** Shared history and deposit sources required by the account graph. */
export interface HistoryPlan {
  readonly source: 'history'
  readonly deposits: readonly DepositSource[]
}

/** Converted accounts and their complete history loading plan. */
export interface AccountPlan {
  readonly accounts: Account[]
  readonly fetchParams: HistoryPlan
}

/** Persist newly rotated credentials before any further bank request. */
export type PersistAuth = (auth: Auth) => Promise<void>

/** Validated direction of a settled bank operation. */
export type FlowDirection = 'EXPENSE' | 'INCOME'

/** Exchange documents indexed by bank transaction ID; documents remain untrusted. */
export type ExchangeDetails = Readonly<Record<string, unknown>>

/** Encodable query or form fields passed to the transport layer. */
export type RequestParameters = Readonly<Record<string, string>>

/** Account graph assembled from validated arrays of untrusted bank records. */
export interface AccountGraph {
  readonly accountsAndCards: readonly unknown[]
  readonly savings: readonly unknown[]
}
