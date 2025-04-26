declare namespace ZenMoney {
  function setData (name: string, data: unknown): void

  function getData (name: string, defaultValue?: unknown): unknown

  // Persist data after setData
  function saveData (): void

  // Clear persistent storage
  function clearData (): void

  // User can choose to skip loading transactions on specific accounts (in settings)
  // So we can check it before loading transactions and optimize that useless work
  function isAccountSkipped (id: string): boolean

  // Ask user some additional data, with message text
  // inputType defaults to text
  // expiration time in milliseconds, after expiration returns null
  function readLine (
    text: string,
    options?: {
      image?: Uint8Array
      inputType?: 'number' | 'text'
      time?: number
    }
  ): Promise<string | null>

  // Alert with some message
  function alert (text: string): Promise<void>

  function setCookie (
    domain: string,
    name: string,
    value: string | null,
    params?: { path?: string, secure?: string, expires?: string }
  ): Promise<void>

  function getCookies (): Promise<Array<{
    name: string
    value: string
    domain: string
    path: string
    persistent: boolean
    secure: string | null
    expires: string | null
  }>>

  function restoreCookies (): Promise<void>

  function saveCookies (): Promise<void>

  function clearCookies (): Promise<void>

  // mTLS authentication
  function setClientPfx (pfx: Uint8Array | null, domain: string): void

  // enforce trust to TLS certificates
  function trustCertificates (certs: string[]): void

  const device: {
    id: string
    manufacturer: string
    model: string
    brand: string
    os: {
      name: string
      version: string
    }
  }
  const application: {
    platform: string
    version: string
    build: string
  }
  let locale: string

  function pickDocuments (mimeTypes: string[], allowMultipleSelection: boolean): Promise<Blob[]>

  function logEvent (type: string, data?: Record<string, unknown>): void
}

declare function assert (condition: boolean, ...args: unknown[]): asserts condition
