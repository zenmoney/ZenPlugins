import type { restoreCookies, saveCookies } from '../common/network/cookies'
import type { addTrustedCertificates } from '../common/network/tls'

export interface ZenMoneyApi {
  setData: (name: string, data: unknown) => void

  getData: (name: string, defaultValue?: unknown) => unknown

  saveData: () => void

  clearData: () => void

  isAccountSkipped: (id: string) => boolean

  readLine: (
    text: string,
    options?: {
      image?: Uint8Array
      inputType?: 'number' | 'text'
      time?: number
    }
  ) => Promise<string | null>

  alert: (text: string) => Promise<void>

  /** @deprecated Use cookieJar from common/network. */
  setCookie: (
    domain: string,
    name: string,
    value: string | null,
    params?: { path?: string, secure?: string, expires?: string }
  ) => Promise<void>

  /** @deprecated Use cookieJar from common/network. */
  getCookies: () => Promise<Array<{
    name: string
    value: string
    domain: string
    path: string
    persistent: boolean
    secure: string | null
    expires: string | null
  }>>

  /** @deprecated Import restoreCookies from common/network. */
  restoreCookies: typeof restoreCookies

  /** @deprecated Import saveCookies from common/network. */
  saveCookies: typeof saveCookies

  /** @deprecated Use cookieJar.removeAllCookies() from common/network. */
  clearCookies: () => Promise<void>

  /** @deprecated Import addTrustedCertificates from common/network/tls. */
  trustCertificates: (...args: Parameters<typeof addTrustedCertificates>) => void

  readonly device: {
    id: string
    manufacturer: string
    model: string
    brand: string
    os: {
      name: string
      version: string
    }
  }
  readonly application: {
    platform: string
    version: string
    build: string
  }
  locale: string

  pickDocuments: (mimeTypes: string[], allowMultipleSelection: boolean) => Promise<Blob[]>

  takePicture: (format: string) => Promise<Blob | null>

  logEvent: (type: string, data?: Record<string, unknown>) => void
}

declare global {
  // A global var also declares globalThis.ZenMoney, which host mocks replace.
  var ZenMoney: ZenMoneyApi

  function assert (condition: boolean, ...args: unknown[]): asserts condition
}
