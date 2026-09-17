import { InvalidPreferencesError } from '../../errors'
import { Credentials, Preferences } from './models'

export function login (preferences: Preferences): Credentials {
  if (preferences.apiKey?.trim() === '' || preferences.apiSecret?.trim() === '') {
    throw new InvalidPreferencesError('MEXC: API Key and API Secret are required')
  }
  return { apiKey: preferences.apiKey, apiSecret: preferences.apiSecret }
}
