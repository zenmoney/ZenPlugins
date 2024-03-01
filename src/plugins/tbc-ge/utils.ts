import { FetchResponse } from '../../common/network'
import { AuthV2 } from './models'

export function getCookies (response: FetchResponse): string[] {
  const headers = response.headers as Record<string, unknown>
  const cookies = headers['set-cookie'] as string
  return cookies.split(';,')
}

export function validateAuth (auth: AuthV2 | undefined): boolean {
  if (auth === undefined) {
    return true
  }
  if (typeof auth !== 'object') {
    return false
  }
  if (auth.username == null || typeof auth.username !== 'string') {
    return false
  }
  if (auth.passcode == null || typeof auth.passcode !== 'string') {
    return false
  }
  if (auth.registrationId == null || typeof auth.registrationId !== 'string') {
    return false
  }
  if (auth.trustedDeviceId != null && typeof auth.trustedDeviceId !== 'string') {
    return false
  }
  return true
}
