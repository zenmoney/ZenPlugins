export interface PreferenceInput {
  login: string
  password: string
}

export interface FetchErrorInfo {
  error: string
  errorText: string
  errorDescription?: string
}

export interface ResponseWithErrorInfo {
  errorInfo: FetchErrorInfo
}

export interface FetchAccountMeta {
  _meta: {
    productKind: 'card' | 'current' | 'deposit'
    statementInternalAccountId: string | null
    statementCardHash: string | null
  }
}
