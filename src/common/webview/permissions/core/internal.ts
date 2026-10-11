export interface PermissionFailure {
  origin: string
  permission: string
  operation: string
  reason: 'unavailable' | 'denied' | 'error'
  error?: { name: string, message: string, code?: number }
}

const adapterBrand: unique symbol = Symbol('PermissionAdapter')

export interface PermissionAdapter {
  readonly permission: string
  readonly [adapterBrand]: true
}

export type PermissionConfig = {
  origins: readonly string[]
  permissions: Readonly<Record<string, PermissionState>>
  adapters?: readonly PermissionAdapter[]
} & (
  | { mode: 'force' }
  | { mode: 'fallback', fallbackWhen: (failure: PermissionFailure) => boolean | Promise<boolean> }
)

export interface AdapterRequest {
  origin: string
  operation: string
  data: unknown
}

export interface AdapterDefinition {
  permission: string
  // Static page source is deliberately outside the production obfuscator's AST.
  script: string
  validate: (state: PermissionState) => void
  invoke: (request: AdapterRequest) => unknown | Promise<unknown>
}

const definitions = new WeakMap<PermissionAdapter, AdapterDefinition>()

export function createAdapter (definition: AdapterDefinition): PermissionAdapter {
  const adapter: PermissionAdapter = Object.freeze({ permission: definition.permission, [adapterBrand]: true as const })
  definitions.set(adapter, definition)
  return adapter
}

export function getAdapterDefinition (adapter: PermissionAdapter): AdapterDefinition {
  const definition = definitions.get(adapter)
  if (definition === undefined) throw new Error('Invalid permission adapter')
  return definition
}
