import type { PluginUi, ReadLineOptions } from '../common/ui'
import type { restoreCookies, saveCookies } from '../common/network/cookies'
import type { addTrustedCertificates } from '../common/network/tls'

export interface ZenMoneyApi {
  setData: (name: string, data: unknown) => void

  getData: (name: string, defaultValue?: unknown) => unknown

  saveData: () => void

  clearData: () => void

  isAccountSkipped: (id: string) => boolean

  /** @deprecated Use ui.readLine from common/ui. */
  readLine: (
    text: string,
    options?: ReadLineOptions & { time?: number }
  ) => ReturnType<PluginUi['readLine']>

  /** @deprecated Use ui.alert from common/ui. */
  alert: PluginUi['alert']

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

  /** @deprecated Use ui.pickDocuments from common/ui. */
  pickDocuments: (mimeTypes: string[], allowMultipleSelection: boolean) => ReturnType<PluginUi['pickDocuments']>

  /** @deprecated Use ui.takePicture from common/ui. */
  takePicture: (format: string) => ReturnType<PluginUi['takePicture']>

  logEvent: (type: string, data?: Record<string, unknown>) => void
}

declare global {
  // A global var also declares globalThis.ZenMoney, which host mocks replace.
  var ZenMoney: ZenMoneyApi

  function assert (condition: boolean, ...args: unknown[]): asserts condition
}
