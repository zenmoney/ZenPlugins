import { Account } from '../../types/zenmoney'

export interface Preferences {
  login: string
  password: string
  startDate?: string
}

export interface DeviceIdentity {
  clientUid: string
  model: string
}

export interface AuthSession extends DeviceIdentity {
  version: 1
  deviceClientId: string
  tripleDesKey: string
  tokenSessionId: string
}

export interface DepositFetchParams {
  type: 'deposit'
  accountId: string
}

export interface CreditCardFetchParams {
  type: 'creditCard'
  cardId: string
  isAdditionalCard: boolean
}

export type AccountFetchParams = DepositFetchParams | CreditCardFetchParams

export interface ConvertedAccount {
  account: Account
  fetchParams: AccountFetchParams
}

export interface FirstFactor {
  login: string
  tokenSessionId: string
}
