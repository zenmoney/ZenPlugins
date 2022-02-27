declare namespace ZenMoney {
  function setData (name: string, data: unknown): void
  function getData (name: string, defaultValue?: unknown): unknown
  function saveData (): void
  function clearData (): void
  function isAccountSkipped (id: string): boolean
  function readLine (text: string): Promise<string>

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
}
