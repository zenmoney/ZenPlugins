import type { ScrapeFunc, Transaction } from '../../types/zenmoney'
import { authenticate, getAccounts, getTransactions } from './api'
import { DEFAULT_GEO_LOCATION, GEO_LOCATION_DATA_KEY } from './models'
import type { GeoLocation, PreferenceInput } from './types/base'

const parseCoordinate = (value: unknown, min: number, max: number): number | null => {
  if (typeof value !== 'string' && typeof value !== 'number') return null

  const normalizedValue = String(value).trim().replace(',', '.')
  if (normalizedValue === '') return null

  const coordinate = Number(normalizedValue)

  if (!Number.isFinite(coordinate) || coordinate < min || coordinate > max) return null

  return coordinate
}

const parseNullableNumber = (value: unknown): number | null => {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

const normalizeGeoLocation = (value: unknown): GeoLocation | null => {
  if (value == null || typeof value !== 'object') return null

  const geoLocation = value as Partial<GeoLocation>
  const latitude = parseCoordinate(geoLocation.latitude, -90, 90)
  const longitude = parseCoordinate(geoLocation.longitude, -180, 180)

  if (latitude == null || longitude == null) return null

  return {
    ...DEFAULT_GEO_LOCATION,
    status: geoLocation.status === 1 || geoLocation.status === 2 ? geoLocation.status : 0,
    latitude,
    longitude,
    accuracy: parseNullableNumber(geoLocation.accuracy),
    altitude: parseNullableNumber(geoLocation.altitude),
    altitudeAccuracy: parseNullableNumber(geoLocation.altitudeAccuracy),
    heading: parseNullableNumber(geoLocation.heading),
    speed: parseNullableNumber(geoLocation.speed)
  }
}

const resolveGeoLocation = (preferences: PreferenceInput): GeoLocation => {
  const latitude = parseCoordinate(preferences.latitude, -90, 90)
  const longitude = parseCoordinate(preferences.longitude, -180, 180)
  const storedGeoLocation = normalizeGeoLocation(ZenMoney.getData(GEO_LOCATION_DATA_KEY, null))
  const geoLocation = latitude != null && longitude != null
    ? {
        ...DEFAULT_GEO_LOCATION,
        latitude,
        longitude
      }
    : storedGeoLocation ?? DEFAULT_GEO_LOCATION

  ZenMoney.setData(GEO_LOCATION_DATA_KEY, geoLocation)
  ZenMoney.saveData()

  return geoLocation
}

export const scrape: ScrapeFunc<PreferenceInput> = async ({ preferences, fromDate, toDate }) => {
  const { login, password } = preferences
  const geoLocation = resolveGeoLocation(preferences)

  const { sessionToken } = await authenticate(login, password, geoLocation)

  console.log('[SCRAPE:AUTHENTICATE] Success')

  const accounts = await getAccounts({ sessionToken })

  console.log('[SCRAPE:ACCOUNTS] Successfully fetched', accounts.length, 'account(s)')

  const transactions: Transaction[] = []

  for (const account of accounts) {
    const accountTransactions = await getTransactions({ sessionToken, fromDate, toDate }, account)
    transactions.push(...accountTransactions)
  }

  return { accounts, transactions }
}
