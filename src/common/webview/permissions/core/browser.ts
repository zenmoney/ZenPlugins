import type { PermissionFailure } from './internal'

export interface PageConfig {
  key: string
  bridgeName: string
  origins: readonly string[]
  permissions: Readonly<Record<string, PermissionState>>
  mode: 'force' | 'fallback'
}

export interface PageLifecycle {
  documentId: string | null
  stop: () => void
  dispose: () => void
}

export interface PermissionRuntime {
  readonly alive: boolean
  isActive: (permission: string) => boolean
  state: (permission: string) => PermissionState
  fallback: (permission: string, operation: string, reason: PermissionFailure['reason'], error?: unknown) => Promise<boolean>
  invoke: (permission: string, operation: string, data: unknown) => Promise<unknown>
  guard: (permission: string, check: () => boolean) => void
  cleanup: (cleanup: () => void) => void
  replace: (owner: object, name: string, value: unknown) => void
  onActivate: (permission: string, listener: () => void) => () => void
}

export interface BridgePacket {
  kind: 'fallback' | 'adapter'
  permission: string
  operation: string
  origin: string
  documentId: string
  data: unknown
}

export type BridgeReply = { ok: true, value: unknown } | { ok: false, message: string }
