import { AccountOrCard } from '../../types/zenmoney'

export interface Preferences {
  phone: string
  password: string
  countryCode: string
}

export interface AuthState {
  version: 1
  deviceId: string
  token: string | null
  otpVerified: boolean
  appApprovalPending?: boolean
}

export interface CardFetchParams {
  accountId: number
  // The statement endpoint's card_id comes from product_id, not card_id.
  cardId: number
}

export type FetchParams = CardFetchParams | { accountId: number, source: 'account' }

export interface AccountPlan {
  account: AccountOrCard
  fetchParams: FetchParams
}
