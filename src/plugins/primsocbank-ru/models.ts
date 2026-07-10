import { Account } from '../../types/zenmoney'

export interface Auth {
  cookieHeader: string
  updatedAt: string
}

export interface Session {
  auth: Auth
}

export interface Preferences {
  login: string
  password: string
  startDate?: string
}

export enum ProductKind {
  account = 'account',
  card = 'card',
  loan = 'loan',
  unsupported = 'unsupported'
}

export interface Product {
  id: string
  accountId: string
  kind: ProductKind
}

export interface ConvertedAccount {
  account: Account
  product: Product
}
