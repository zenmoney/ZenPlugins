import { AccountOrCard } from '../../types/zenmoney'

// Input preferences from schema in preferences.xml
export interface Preferences {
  login: string
  password: string
}

export enum AccountType {
  Current = 1,
  Savings = 3,
  ForeignCurrency = 5,
  OccasionalPayments = 6
}

export interface AccountDetails {
  id: number
  type: AccountType
}

export interface PSAccount extends AccountOrCard {
  cardNumber: string | null
  rawData: string
}
