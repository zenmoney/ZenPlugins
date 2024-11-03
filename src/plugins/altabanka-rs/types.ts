export interface Preferences {
  login: string
  password: string
}

export interface AccountInfo {
  id: string
  name: string
  currency: string
  balance: number
}

export interface AccountTransaction {
  id: string
  date: Date
  address: string
  amount: number
  currency: string
}
