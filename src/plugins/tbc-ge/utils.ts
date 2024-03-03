import { FetchResponse } from '../../common/network'
import { AuthV2 } from './models'

export function getCookies (response: FetchResponse): string[] {
  const headers = response.headers as Record<string, unknown>
  const cookies = headers['set-cookie'] as string
  if (cookies == null) {
    return []
  }
  return cookies.split(';,')
}

export function validateAuth (auth: AuthV2 | undefined): boolean {
  if (auth === undefined) {
    return true
  }
  if (typeof auth !== 'object') {
    console.error('Invalid auth object: not an object')
    return false
  }
  if (auth.username == null || typeof auth.username !== 'string') {
    console.error(`Invalid auth object: username is not a string, ${auth.username}`)
    return false
  }
  if (auth.passcode == null || typeof auth.passcode !== 'string') {
    console.error(`Invalid auth object: passcode is not a string, ${auth.passcode}`)
    return false
  }
  if (auth.registrationId == null || typeof auth.registrationId !== 'string') {
    console.error(`Invalid auth object: registrationId is not a string, ${auth.registrationId}`)
    return false
  }
  if (auth.trustedDeviceId != null && typeof auth.trustedDeviceId !== 'string') {
    console.error(`Invalid auth object: trustedDeviceId is not a string, ${auth.trustedDeviceId}`)
    return false
  }

  if (auth.deviceId != null && typeof auth.deviceId !== 'string') {
    console.error(`Invalid auth object: deviceId is not a string, ${auth.deviceId}`)
    return false
  }
  return true
}
