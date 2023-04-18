export interface Session {
  deviceId: string
  userId?: string
  accessToken?: string
}

export interface Preferences {
  login: string
  password: string
}

export interface AccountInfo {
  number: string
  name: string
  balance: number
  currency: string
  // masked card numbers
  // api returns multiple cards, but actually there can only be one
  // card per account
  // format: 000000******0000
  cardNumbers: string[]
}

export interface AccountTransaction {
  date: Date
  description: string
  reference: string
  amount: number
  currency: string
  icon: string
  transactionType: string
}
