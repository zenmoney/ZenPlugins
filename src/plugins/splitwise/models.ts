export interface Preferences {
  token: string
  startDate: string
}

export interface Auth {
  token: string
  startDate: string
}

export interface SplitwiseExpense {
  id: number
  description: string
  details: string
  payment: boolean
  cost: string
  date: string
  created_at: string
  updated_at: string
  deleted_at?: string
  currency_code: string
  users: Array<{
    user_id: number
    paid_share: string
    owed_share: string
  }>
}

export interface SplitwiseUser {
  id: number
  first_name: string
  last_name: string
  email: string
  registration_status: string
  picture: {
    small: string
    medium: string
    large: string
  }
  default_currency: string
  locale: string
  balance?: Record<string, string>
}

export interface SplitwiseGroup {
  id: number
  name: string
  group_type: string
  members: SplitwiseUser[]
  currency_code: string
}
