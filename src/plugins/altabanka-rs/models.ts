// Input preferences from schema in preferences.xml
export interface Preferences {
  login: string
}

// Consists of everything that is needed in authorized requests.
// Not stored: the session lives for a few minutes and login requires a fresh OTP.
export interface Session {
  requestToken: string
}

export interface AccountInfo {
  id: string
  cardNumber: string
  accountNumber: string
  productCoreID?: string
  name: string
  currency: string
  balance: number
}

export interface Card {
  primaryCardID: string
  accountNumber: string
  // Settlement currency (operations are charged to this account currency).
  currency: string
  // Currencies to query card turnover for (domestic + linked foreign), since each
  // `AccountType` returns only operations of that currency.
  turnoverCurrencies: string[]
}

export interface AccountTransaction {
  id: string
  date: Date
  address: string
  amount: number
  currency: string | undefined
  description: string
  // Original-currency invoice for card transactions (domestic `amount` is kept on the movement).
  invoice?: { sum: number, instrument: string }
}

export interface Environment {
  requestToken: string
  isAuthenticated: boolean
  authenticationType: string
  principalId: number
}
