export interface Preferences {
  login: string
  password: string
}

export interface AccountInfo {
  id: string
  cardNumber: string
  accountNumber: string
  name: string
  currency: string
  balance: number
}

export interface AccountTransaction {
  id: string
  date: Date
  address: string
  amount: number
  currency: string | undefined
  description: string
  // The row's details page, which holds the day the payment was made
  // ("Datum autorizacije"); `date` is the day the bank booked it.
  detailsUrl?: string
  isCard?: boolean
}
