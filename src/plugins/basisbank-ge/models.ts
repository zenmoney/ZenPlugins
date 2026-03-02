export interface Preferences {
  login: string
  password: string
  requestSmsCode?: boolean
  trustDevice?: boolean
  startDate: string
}

export interface Auth {
  login?: string
  lastSuccessfulLoginAt?: number
  deviceId?: string
  sessionExpiresAt?: number
  trustedDeviceExpiresAt?: number
}

export interface Session {
  auth: Auth
  deviceId: string
  login: string
  password: string
  requestSmsCode: boolean
  trustDevice: boolean
}

export interface CardAccountRow {
  AccountIbanEncrypted?: string
  AccountIban?: string
  IsOwnAccount?: boolean
  IsTrustedAccount?: boolean
  AccountName?: string
  AccountDescription?: string
  ProductName?: string
  CcyArray?: string[]
  CardImages?: string[]
  Amount?: string | number
  MainCCy?: string
  MainAccountID?: string | number
}

export interface ParsedAccountRow {
  id: string
  title: string
  iban?: string
  instrument: string
  balance: number | null
  available: number | null
  isCard: boolean
  syncIds: string[]
}

export interface CardTransactionRow {
  TransferID?: string | number
  TransactionID?: string | number
  TransactionReference?: string
  HasSimilar?: boolean
  TransferType?: string | number
  AccountIban?: string
  CardPan?: string
  Description?: string
  Amount?: string | number
  Ccy?: string
  DocDate?: string
  Status?: string | number
}
