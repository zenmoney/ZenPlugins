import { InvalidPreferencesError } from '../../errors'
import { Credentials, Preferences } from './models'

const DEFAULT_BASE_URL = 'https://api.binance.com'
const ALLOWED_HOSTS = new Set(['api.binance.com', 'api-gcp.binance.com'])

export function login (preferences: Preferences): Credentials {
  if (preferences.apiKey?.trim() === '' || preferences.apiSecret?.trim() === '') {
    throw new InvalidPreferencesError('Binance: API Key and API Secret are required')
  }
  let url: URL
  const configuredBaseUrl = preferences.baseUrl?.trim()
  try { url = new URL(configuredBaseUrl === undefined || configuredBaseUrl === '' ? DEFAULT_BASE_URL : configuredBaseUrl) } catch (_) {
    throw new InvalidPreferencesError('Binance: invalid API URL')
  }
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.port !== '' || !ALLOWED_HOSTS.has(url.hostname)) {
    throw new InvalidPreferencesError('Binance: use an official Binance API host')
  }
  return { apiKey: preferences.apiKey, apiSecret: preferences.apiSecret, baseUrl: `https://${url.hostname}` }
}
