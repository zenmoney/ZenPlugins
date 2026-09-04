import { InvalidPreferencesError } from '../../errors'
import { Credentials, Preferences } from './models'

export function login (preferences: Preferences): Credentials {
  if (preferences.apiKey?.trim() === '' || preferences.apiSecret?.trim() === '' || preferences.passphrase?.trim() === '') {
    throw new InvalidPreferencesError('OKX: API Key, API Secret and passphrase are required')
  }
  const baseUrls = {
    global: 'https://openapi.okx.com',
    eea: 'https://eea.okx.com',
    us: 'https://us.okx.com',
    tr: 'https://tr.okx.com'
  }
  const region = preferences.region ?? 'global'
  return { apiKey: preferences.apiKey, apiSecret: preferences.apiSecret, passphrase: preferences.passphrase, baseUrl: baseUrls[region] }
}
