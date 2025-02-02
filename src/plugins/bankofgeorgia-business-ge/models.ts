export interface Preferences {
  clientId: string
  clientSecret: string
  accounts: string
  startDate: string
}

export interface Account {
  id: string
  number: string
  currency: string
  balance?: number
}

export interface AuthResponse {
  access_token: string
  expires_in: number
  refresh_expires_in: number
  token_type: string
  not_before_policy?: number
  scope: string
}

export interface SenderDetails {
  Name: string
  Inn?: string
  AccountNumber: string
  BankCode?: string
  BankName?: string
}

export interface BeneficiaryDetails {
  Name: string
  Inn?: string
  AccountNumber: string
  BankCode?: string
  BankName?: string
}

export interface Record {
  EntryDate: string
  EntryDocumentNumber: string
  EntryAccountNumber: string
  EntryAmountDebit: number
  EntryAmountDebitBase?: number
  EntryAmountCredit: number
  EntryAmountCreditBase?: number
  EntryAmountBase: number
  EntryAmount: number
  EntryComment: string
  EntryDepartment: string
  EntryAccountPoint: string
  DocumentProductGroup: string
  DocumentValueDate?: string
  SenderDetails: SenderDetails
  BeneficiaryDetails: BeneficiaryDetails
  DocumentTreasuryCode?: string
  DocumentNomination: string
  DocumentInformation: string
  DocumentSourceAmount: number
  DocumentSourceCurrency: string
  DocumentDestinationAmount: number
  DocumentDestinationCurrency: string
  DocumentReceiveDate: string
  DocumentBranch: string
  DocumentDepartment: string
  DocumentActualDate?: string
  DocumentExpiryDate?: string
  DocumentRateLimit?: number
  DocumentRate?: number
  DocumentRegistrationRate?: number
  DocumentSenderInstitution?: string
  DocumentIntermediaryInstitution?: string
  DocumentBeneficiaryInstitution?: string
  DocumentPayee?: string
  DocumentCorrespondentAccountNumber: string
  DocumentCorrespondentBankCode?: string
  DocumentCorrespondentBankName?: string
  DocumentKey: string
  EntryId: string
  DocumentPayerName?: string
  DocumentPayerInn?: string
  DocComment?: string
}
export interface AccountRecord extends Record {
  Currency: string
  AccountID: string
}

export interface StatementResponse {
  Id: number
  Count: number
  Records: Record[]
}

export interface BalanceResponse {
  AvailableBalance: number
  CurrentBalance: number
}
