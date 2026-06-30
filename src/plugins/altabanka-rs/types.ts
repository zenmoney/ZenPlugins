export interface Preferences {
  login: string
  otp: string
}

export interface AccountInfo {
  productCoreID: string
  accountNumber: string
  name: string
  currency: string
  balance: number
  iban: string
}

export interface AccountTransaction {
  id: string
  date: Date
  direction: string
  amount: number
  currency: string | undefined
  description: string
}
