export declare class RetryError {
  message: string
  failedResults: unknown[]
  stack?: string

  constructor (message: string, failedResults: unknown[])
}

export declare function toNodeCallbackArguments (getter: () => Promise<unknown>): () => Promise<[null, unknown] | [unknown, null]>

export declare function retry (args: {
  getter: () => Promise<unknown>
  predicate: (x: unknown) => boolean
  maxAttempts?: number
  log?: boolean
  delayMs?: number
}): Promise<unknown>
