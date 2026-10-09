import { fetch } from './index'
import type { FetchOptions, FetchResponse } from './index'

declare function expectType<T> (value: T): void

// Compile-only checks for the shared HTTP response and TLS contracts.
export async function checkFetchTypes (url: string, response: FetchResponse): Promise<void> {
  expectType<boolean>(response.ok)
  expectType<number>(response.status)
  expectType<string>(response.statusText)
  expectType<string>(response.url)
  expectType<unknown>(response.body)
  const options: FetchOptions = { tls: { pfx: new Uint8Array([1]) } }
  await fetch(url, options)
  // @ts-expect-error Client certificates are configured inside tls.
  await fetch(url, { pfx: new Uint8Array([1]) })
}
