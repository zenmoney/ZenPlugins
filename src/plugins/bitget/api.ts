import { InvalidPreferencesError } from '../../errors'
import { Credentials, Preferences } from './models'

export function login (preferences: Preferences): Credentials {
  if (preferences.apiKey?.trim() === '' || preferences.apiSecret?.trim() === '' || preferences.passphrase?.trim() === '') {
    throw new InvalidPreferencesError('Bitget: API Key, API Secret and passphrase are required')
  }
  return { apiKey: preferences.apiKey, apiSecret: preferences.apiSecret, passphrase: preferences.passphrase }
}
