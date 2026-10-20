import type { AccountOrCard } from '../../types/zenmoney'

export interface MobileSession {
  deviceId: string
  accessToken: string
}

export interface FetchParams {
  accountIds: string[]
}

export interface AccountPlan {
  accounts: AccountOrCard[]
  knownAccountNumbers: string[]
  fetchParams: FetchParams
}
