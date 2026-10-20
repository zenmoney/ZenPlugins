import get from '../../types/get'

export function stringAt (source: unknown, field: string): string {
  const value = get(source, field)
  assert(typeof value === 'string' && value.trim() !== '', 'Invalid ZEN.COM string', { field })
  return value
}

export function arrayAt (source: unknown, field: string): unknown[] {
  const value = get(source, field)
  assert(Array.isArray(value), 'Invalid ZEN.COM array', { field })
  return value as unknown[]
}

export function booleanAt (source: unknown, field: string): boolean {
  const value = get(source, field)
  assert(typeof value === 'boolean', 'Invalid ZEN.COM boolean', { field })
  return value
}

export function amountAt (source: unknown, field: string): number {
  const value = get(source, field)
  assert(typeof value === 'number' || (typeof value === 'string' && /^-?\d+(?:\.\d+)?$/.test(value)), 'Invalid ZEN.COM amount', { field })
  const amount = Number(value)
  assert(Number.isFinite(amount), 'Non-finite ZEN.COM amount', { field })
  return amount
}

export function dateAt (source: unknown, field: string): Date {
  const value = stringAt(source, field)
  assert(/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:?\d{2})$/.test(value), 'Missing ZEN.COM date offset', { field })
  const date = new Date(value)
  assert(Number.isFinite(date.getTime()), 'Invalid ZEN.COM date', { field })
  return date
}

export function textAt (source: unknown, field: string): string | null {
  const value = get(source, field)
  assert(value === null || value === undefined || typeof value === 'string', 'Invalid ZEN.COM text', { field })
  const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
  return text === '' ? null : text
}
