import get, { getOptBoolean, getOptNumber } from '../../../../types/get'
import { createAdapter } from '../core/internal'
import type { PermissionAdapter } from '../core/internal'
import geoScript from './geo.webview.ts?format=iife&globalName=WebViewScript&bundle'

export interface Position {
  latitude: number
  longitude: number
  accuracy?: number
}

export interface PositionRequest {
  origin: string
  operation: 'getCurrentPosition' | 'watchPosition'
  options: Readonly<Required<PositionOptions>>
}

export interface GeoPermissionConfig {
  getPosition: (request: PositionRequest) => Position | null | Promise<Position | null>
}

/** Synthetic position source; installing it does not request an OS permission. */
export function geoPermission (config: GeoPermissionConfig): PermissionAdapter {
  if (typeof config.getPosition !== 'function') throw new Error('Missing position provider')
  return createAdapter({
    permission: 'geolocation',
    script: geoScript,
    validate: state => {
      if (state === 'prompt') throw new Error('Geolocation adapter cannot provide a prompt')
    },
    invoke: async request => {
      if (request.operation !== 'getCurrentPosition' && request.operation !== 'watchPosition') throw new Error('Invalid geolocation operation')
      const enableHighAccuracy = getOptBoolean(request.data, 'options.enableHighAccuracy')
      const maximumAge = get(request.data, 'options.maximumAge') === null ? Infinity : getOptNumber(request.data, 'options.maximumAge')
      const timeout = get(request.data, 'options.timeout') === null ? Infinity : getOptNumber(request.data, 'options.timeout')
      if (enableHighAccuracy === undefined || maximumAge === undefined || timeout === undefined || maximumAge < 0 || timeout < 0) throw new Error('Invalid geolocation options')
      return await config.getPosition({ origin: request.origin, operation: request.operation, options: { enableHighAccuracy, maximumAge, timeout } })
    }
  })
}
