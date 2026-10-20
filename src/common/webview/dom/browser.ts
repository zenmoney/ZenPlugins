/** Serializable transport only; callbacks and DOM objects stay in the page. */
export interface DomPageConfig {
  readonly key: string
  readonly bridgeName: string
  readonly origins: readonly string[]
  readonly includeShadowDom: boolean
  readonly arg: unknown
}

export interface DomPageFailure {
  readonly origin: string
  readonly stage: string
  readonly rule?: number
}

export interface DomPageLifecycle {
  readonly documentId: string
  readonly dispose: () => DomPageFailure | undefined
}
