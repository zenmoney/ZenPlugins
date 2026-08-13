export interface DebugPluginInfo {
  readonly id: string
  readonly version: string
  readonly build: number
}

export interface DebugServerInfo {
  readonly url: string
}

export interface DebugProxy {
  readonly isActive: boolean
  readonly version: '2' | undefined
  readonly sessionId: string | undefined
  readonly plugin: Readonly<DebugPluginInfo> | undefined
  readonly server: Readonly<DebugServerInfo> | undefined
  readonly config: Readonly<Record<string, unknown>> | undefined
  checkpoint: (name: string, value: unknown) => Promise<void>
}

export const Debug: DebugProxy
