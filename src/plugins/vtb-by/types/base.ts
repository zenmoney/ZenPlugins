export interface PreferenceInput {
  login: string
  password: string
  latitude?: string
  longitude?: string
}

export interface GeoLocation {
  status: 0 | 1 | 2
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  altitude: number | null
  altitudeAccuracy: number | null
  heading: number | null
  speed: number | null
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
