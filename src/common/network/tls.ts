import get from '../../types/get'
import { proxyMethod } from '../proxy'

export interface TlsOptions {
  ca?: string | readonly string[]
  pfx?: Uint8Array | readonly Uint8Array[]
  key?: string | readonly string[]
  cert?: string | readonly string[]
}

const clientPfxs: Record<string, Uint8Array> = {}
const trustedCertificates: string[] = []

export function withDefaultTls (options?: unknown): Record<string, unknown> {
  const normalizedOptions = options !== null && typeof options === 'object'
    ? options as Record<string, unknown>
    : {}

  if (normalizedOptions.tls !== undefined) {
    return normalizedOptions
  }

  const ca = [...trustedCertificates]
  const pfx = Object.values(clientPfxs)
  const tls: TlsOptions = { ca, pfx }

  return ca.length > 0 || pfx.length > 0
    ? { ...normalizedOptions, tls }
    : normalizedOptions
}

export async function setClientPfx (pfx: Uint8Array | null, domain: string): Promise<void> {
  if (pfx == null) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete clientPfxs[domain]
  } else {
    clientPfxs[domain] = pfx
  }
}

export async function addTrustedCertificates (certs: readonly string[]): Promise<void> {
  const host = globalThis.ZenMoney
  if (typeof get(host, 'fetch') === 'function') {
    trustedCertificates.push(...certs)
    return
  }
  await proxyMethod<(certs: string[]) => void | Promise<void>>('trustCertificates', host)([...certs])
}

export function withWebViewTls (options: unknown): unknown {
  if (trustedCertificates.length > 0 && (
    options == null || (typeof options === 'object' && !Array.isArray(options) && get(options, 'tls') === undefined)
  )) {
    const tls: TlsOptions = { ca: [...trustedCertificates] }
    return { ...options, tls }
  }
  return options
}
