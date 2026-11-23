// Turkey has used a fixed UTC+03:00 offset without daylight saving time since 2016-09-07.
const TURKEY_OFFSET_MS = 3 * 60 * 60 * 1000

/**
 * Ledger `createdAt` values have no zone, e.g. `2026-11-21T16:33:30.017`.
 * They are Turkey time: the Papara app shows that Spotify record (observed 2026-11-24) at 16:33,
 * while a UTC value would be displayed as 19:33 on a +03:00 phone.
 */
export function parseLedgerDate (value: unknown): Date {
  const match = typeof value === 'string'
    ? value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,7}))?$/)
    : null
  console.assert(match !== null, 'Unexpected ledger createdAt format', { value: typeof value === 'string' ? value : typeof value })
  const [, year, month, day, hours, minutes, seconds, fraction] = match as RegExpMatchArray
  const milliseconds = fraction !== undefined ? Number(fraction.padEnd(3, '0').slice(0, 3)) : 0
  const utc = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), Number(seconds), milliseconds)
  const date = new Date(utc - TURKEY_OFFSET_MS)
  console.assert(Number.isFinite(date.valueOf()) && new Date(utc).getUTCDate() === Number(day), 'Invalid ledger createdAt value', { value })
  return date
}

/** Login token `.issued`/`.expires` are UTC without a zone: `.issued` equals the HTTP `Date` header in observed responses. */
export function parseTokenUtcDate (value: unknown): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(value)) return null
  const date = new Date(`${value}Z`)
  return Number.isFinite(date.valueOf()) ? date : null
}
