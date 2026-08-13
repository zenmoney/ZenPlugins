import type { GeoLocation } from './types/base'

export const BASE_API_URL = 'https://online.vtb.by'

export const CLIENT_KIND = '5'

export const APPLICATION_ID = '3.7.0'

export const GEO_LOCATION_DATA_KEY = 'geoLocation'

export const GEOLOCATION_PERMISSION_GRANTED = 1

export const DEFAULT_GEO_LOCATION: GeoLocation = {
  status: 0,
  latitude: 53.908522,
  longitude: 27.574821,
  accuracy: null,
  altitude: null,
  altitudeAccuracy: null,
  heading: null,
  speed: null
}

export const LOGIN_DEVICE_INFO = {
  applicID: APPLICATION_ID,
  clientKind: CLIENT_KIND,
  deviceUDID: 'ib',
  browser: 'Chrome',
  browserVersion: '0',
  platform: 'Windows',
  platformVersion: '10',
  pushId: 'unknown'
} as const
