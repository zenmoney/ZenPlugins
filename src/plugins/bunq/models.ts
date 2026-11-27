
// UTC date and time standard in format YYYY-MM-DD hh:mm:ss.ssssss
// ISO 8601 format https://en.wikipedia.org/wiki/ISO_8601
export type DateTimeString = string

export interface ApiResponse<T> {
  Response: T
}

export interface ApiListResponse<T> extends ApiResponse<T> {
  Pagination: {
    futureUrl: string
    newer_url: string
    older_url: string
  }
}

export interface ApiError {
  Error: [{
    error_description: string
    error_description_translated: string
  }
  ]
}

export type BunqInstallationResponse = [
  {Id: {id: number}},
  {Token: {
    id: number
    created: DateTimeString
    updated: DateTimeString
    token: string
  }},
  {ServerPublicKey: {
    server_public_key: string
  }}
]

export type BunqSessionResponse = [
  {Id: {id: number}},
  {Token: {
    id: number
    token: string
  }},
  {UserPerson: {id: number}}
]

export interface BunqMonetaryAccount {
  id: number
  balance: {
    value: string
  }
  alias: BunqAccountAlias[]
  currency: string
  description: string
  status: string
}

export enum BunqAccountType {
  Bank,
  Investment
}
export interface AccountData extends BunqMonetaryAccount {
  type: BunqAccountType
}

export interface BunqMonetaryAccountBank {
  MonetaryAccountBank: BunqMonetaryAccount
}

export interface BunqMonetaryAccountSavings {
  MonetaryAccountSavings: BunqMonetaryAccount
}

export interface BunqMonetaryAccountJoint {
  MonetaryAccountJoint: BunqMonetaryAccount
}

export interface BunqMonetaryAccountInvestment {
  MonetaryAccountInvestment: BunqMonetaryAccount
}

export type BunqAccountResponse = Array<BunqMonetaryAccountBank | BunqMonetaryAccountSavings | BunqMonetaryAccountJoint | BunqMonetaryAccountInvestment>

export interface BunqAccountAlias {
  type: 'IBAN' | string
  name: string
  value: string
}

export interface BunqPayment {
  amount: {
    value: string
    currency: string
  }
  description: string
  merchant_reference: string | null
  id: number
  created: DateTimeString
  monetary_account_id: number
  type: string
  sub_type: string
  counterparty_alias: {
    display_name: string
    iban: string | null
    merchant_category_code?: string
  }
}

export type BunqPaymentListResponse = Array<{
  Payment: BunqPayment
}>

export interface InstallationContext {
  clientPrivateKey: string
  installationToken: string
}

export interface SessionContext {
  userId: number
  sessionToken: string
}

// Input preferences from schema in preferences.xml
export interface Preferences {
  apiKey: string
}
