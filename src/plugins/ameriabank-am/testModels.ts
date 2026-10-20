import { AccountGraph, ExchangeDetails } from './models'

/** Complete anonymized capture container whose individual bank records remain untrusted. */
export interface BankCapture {
  readonly graph: AccountGraph
  readonly products: readonly unknown[]
  readonly history: readonly unknown[]
  readonly recentHistory: readonly unknown[]
  readonly details: ExchangeDetails
  readonly depositHistory: readonly unknown[]
}
