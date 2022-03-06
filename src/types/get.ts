import { get as _get, isArray, isBoolean, isNumber, isString } from 'lodash'

export default function get (obj: unknown, path: string, defaultValue?: unknown): unknown {
  return _get(obj, path, defaultValue)
}

export function getNumber (obj: unknown, path: string, defaultValue?: number): number {
  const result = get(obj, path)
  console.assert(isNumber(result) || defaultValue !== undefined, `cant getNumber(${path}) from ${obj}`)
  return (result ?? defaultValue) as number
}

export function getString (obj: unknown, path: string, defaultValue?: string): string {
  const result = get(obj, path)
  console.assert(isString(result) || defaultValue !== undefined, `cant getString(${path}) from ${obj}`)
  return (result ?? defaultValue) as string
}

export function getBoolean (obj: unknown, path: string, defaultValue?: boolean): boolean {
  const result = get(obj, path)
  console.assert(isBoolean(result) || defaultValue !== undefined, `cant getBoolean(${path}) from ${obj}`)
  return (result ?? defaultValue) as boolean
}

export function getArray (obj: unknown, path: string, defaultValue?: unknown[]): unknown[] {
  const result = get(obj, path)
  console.assert(isArray(result) || defaultValue !== undefined, `cant getArray(${path}) from ${obj}`)
  return (result ?? defaultValue) as unknown[]
}
