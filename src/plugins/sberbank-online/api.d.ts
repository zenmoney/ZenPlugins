export interface SberDevice {
  id: string
  idOld: string
  model: string
}

export function loginPrimary (
  login: string,
  pin: string,
  auth: { guid?: string } | undefined,
  device: SberDevice,
  appVersion?: string,
  isInBackground?: boolean
): Promise<unknown>
