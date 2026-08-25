import { InvalidPreferencesError } from '../errors'

const SUPPORTED_SETTLEMENT_ASSETS = new Set([
  'USDT', 'USDC', 'USD', 'USDE', 'FDUSD', 'TUSD', 'DAI', 'USDP', 'PYUSD', 'BUSD'
])

export const DEFAULT_SETTLEMENT_ASSETS = 'USDT,USDC,USD,USDE,FDUSD,TUSD'

// These plugins maintain balances in USD. Historical movements of volatile
// assets need an asset-level account or a historical price, so they are not
// silently converted using today's price.
export function parseSettlementAssets (value: string | undefined): Set<string> {
  const trimmed = value?.trim()
  const source = trimmed === undefined || trimmed === '' ? DEFAULT_SETTLEMENT_ASSETS : trimmed
  const assets = source.split(',').map(asset => asset.trim().toUpperCase()).filter(asset => asset !== '')
  const unsupported = assets.filter(asset => !SUPPORTED_SETTLEMENT_ASSETS.has(asset))
  if (unsupported.length > 0) {
    throw new InvalidPreferencesError(`Only USD-pegged settlement assets are supported here: ${unsupported.join(', ')}`)
  }
  if (assets.length === 0) throw new InvalidPreferencesError('Choose at least one settlement asset')
  return new Set(assets)
}
