import { InvalidPreferencesError } from '../../errors'
import { Preferences, Wallet, WALLET_SLOT_COUNT } from './models'

// Легаси-адреса (P2PKH/P2SH) в base58 и bech32/bech32m (P2WPKH, P2WSH, P2TR).
// Проверка структурная: она отсеивает опечатки и посторонний текст, а окончательный
// вердикт по адресу всё равно выносит API.
const ADDRESS_REGEXP = /^(bc1[023456789acdefghjklmnpqrstuvwxyz]{8,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/

// BIP173 разрешает bech32 целиком в верхнем регистре, и некоторые кошельки так отдают
// адрес в QR, а API понимает только нижний. Приводим к нижнему только bech32: в base58
// регистр значащий, и `toLowerCase()` там дал бы другой адрес, а не тот же самый.
function normalizeAddress (address: string): string {
  return /^BC1[0-9A-Z]*$/.test(address) ? address.toLowerCase() : address
}

function slotAddresses (preferences: Preferences, slot: number): string {
  switch (slot) {
    case 1: return preferences.wallet1Addresses ?? ''
    case 2: return preferences.wallet2Addresses ?? ''
    default: return preferences.wallet3Addresses ?? ''
  }
}

function slotTitle (preferences: Preferences, slot: number): string {
  switch (slot) {
    case 1: return preferences.wallet1Title ?? ''
    case 2: return preferences.wallet2Title ?? ''
    default: return preferences.wallet3Title ?? ''
  }
}

function defaultTitle (slot: number): string {
  return slot === 1 ? 'Bitcoin' : `Bitcoin ${slot}`
}

export function parseWallets (preferences: Preferences): Wallet[] {
  const wallets: Wallet[] = []
  const slotByAddress = new Map<string, number>()

  for (let slot = 1; slot <= WALLET_SLOT_COUNT; slot++) {
    const addresses: string[] = []

    for (const raw of slotAddresses(preferences, slot).split(',')) {
      const address = normalizeAddress(raw.trim())
      if (address === '') {
        continue
      }
      if (!ADDRESS_REGEXP.test(address)) {
        throw new InvalidPreferencesError(`«${address}» не похож на биткойн-адрес. Проверьте поле «Адреса ${slot}».`)
      }
      const seenIn = slotByAddress.get(address)
      if (seenIn === slot) {
        continue
      }
      if (seenIn !== undefined) {
        throw new InvalidPreferencesError(`Адрес ${address} указан и в кошельке ${seenIn}, и в кошельке ${slot}. Оставьте его в одном.`)
      }
      slotByAddress.set(address, slot)
      addresses.push(address)
    }

    if (addresses.length === 0) {
      continue
    }

    const title = slotTitle(preferences, slot).trim()
    wallets.push({ id: addresses[0], title: title === '' ? defaultTitle(slot) : title, addresses })
  }

  if (wallets.length === 0) {
    throw new InvalidPreferencesError('Укажите хотя бы один адрес кошелька.')
  }

  return wallets
}
