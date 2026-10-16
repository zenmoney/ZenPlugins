import { dateInTimezone, toISODateString } from '../../common/dateUtils'
import { beforeDeadline } from './deadline'

const ORIGIN = 'https://iphone.bankhapoalim.co.il'
const PATH = '/ServerServices/current-account/transactions'
const PAGE_SIZE = 50
const MAX_PAGES = 1000
const MAX_ROWS = 100000
const MAX_DURATION_MS = 120000

type Failure = 'invalid-history-request' | 'unexpected-history-response' | 'missing-integrity' | 'repeated-page' | 'overlapping-pages' | 'history-page-limit' | 'history-row-limit' | 'history-deadline' | 'history-inactive' | 'concurrent-history'
export class MobileHistoryError extends Error {
  constructor (readonly kind: Failure) {
    super(`Bank Hapoalim mobile history stopped: ${kind}`)
  }
}

export interface MobileHistoryRequest {
  method: 'POST'
  headers: Record<string, string>
  timeout: number
}
export interface MobileHistoryResponse {
  status: number
  headers: { get: (name: string) => string | null }
  body: unknown
}
export interface MobileHistoryPage {
  pageOrdinal: number
  rowCount: number
  totalRows: number
  hasMore: boolean
}
interface Options {
  request: (url: string, options: MobileHistoryRequest) => Promise<MobileHistoryResponse>
  isActive: () => boolean
  onPage?: (page: MobileHistoryPage) => Promise<void>
}

function record (value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function invalidHeader (value: string): boolean {
  return value.length > 8192 || [...value].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
}

function continuationSegment (value: string): string {
  if (invalidHeader(value) || value === '.' || value === '..') throw new MobileHistoryError('unexpected-history-response')
  try { return encodeURIComponent(value) } catch { throw new MobileHistoryError('unexpected-history-response') }
}

function fingerprint (value: Record<string, unknown>): string {
  try {
    return JSON.stringify(value, (_key, item: unknown) => record(item)
      ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]]))
      : item)
  } catch { throw new MobileHistoryError('unexpected-history-response') }
}

// Public bank APK44.2.0/763: Lmm/a.g/i are query-only POST50. Lqr/a
// appends data-header and sends integrity-header on continuation. Lqr/f/g set
// hasMore from each response's data-header, not page length or UI stop events.
export function createMobileHistoryLoader ({ request, isActive, onPage = async () => {} }: Options): (accountId: string, from: Date, to: Date) => Promise<Array<Record<string, unknown>>> {
  let busy = false
  const checkActive = (): void => { if (!isActive()) throw new MobileHistoryError('history-inactive') }
  return async (accountId, from, to) => {
    checkActive()
    if (busy) throw new MobileHistoryError('concurrent-history')
    if (!/^\d+-\d+-\d+$/.test(accountId) || !(from instanceof Date) || !(to instanceof Date) || !Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from > to) throw new MobileHistoryError('invalid-history-request')
    busy = true
    let active = true
    const startedAt = Date.now()
    const check = (): void => {
      if (!active) throw new MobileHistoryError('history-inactive')
      checkActive()
      if (Date.now() - startedAt >= MAX_DURATION_MS) throw new MobileHistoryError('history-deadline')
    }
    const step = async <T>(operation: () => Promise<T>): Promise<T> => await beforeDeadline(async () => {
      check()
      return await operation()
    }, startedAt + MAX_DURATION_MS, () => new MobileHistoryError('history-deadline'), () => { active = false })
    let cursor: string | null = null
    let integrity: string | null = null
    try {
      // Preserve the existing plugin's bank-wall-date frame; do not silently
      // change legacy date semantics while replacing the paging transport.
      const query = new URLSearchParams({
        numItemsPerPage: String(PAGE_SIZE),
        sortCode: '1',
        retrievalStartDate: toISODateString(dateInTimezone(from, 120)).replace(/-/g, ''),
        retrievalEndDate: toISODateString(dateInTimezone(to, 120)).replace(/-/g, ''),
        dataGroupCatenatedKey: '',
        accountId,
        appId: 'bankApp3Generation',
        _lang: 'he-IL'
      })
      const rows: Array<Record<string, unknown>> = []
      const seenPages = new Set<string>()
      const seenRows = new Set<string>()
      const emptyCursors = new Set<string>()
      for (let pageOrdinal = 1; pageOrdinal <= MAX_PAGES; pageOrdinal++) {
        check()
        const path: string = PATH + (cursor === null ? '' : '/' + continuationSegment(cursor))
        const url: URL = new URL(ORIGIN + path + '?' + query.toString())
        if (url.origin !== ORIGIN || url.pathname !== path) throw new MobileHistoryError('unexpected-history-response')
        const response: MobileHistoryResponse = await step(async () => await request(url.href, {
          method: 'POST',
          timeout: Math.min(15000, Math.max(1, startedAt + MAX_DURATION_MS - Date.now())),
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json;charset=UTF-8',
            'Accept-Encoding': 'identity',
            ...cursor !== null && integrity !== null ? { 'integrity-header': integrity } : {}
          }
        }))
        check()
        if (response.status !== 200 || !/\bjson\b/i.test(response.headers.get('content-type') ?? '') || !record(response.body) || !Array.isArray(response.body.transactions)) throw new MobileHistoryError('unexpected-history-response')
        const batch: unknown[] = response.body.transactions
        // The bank returned60 with numItemsPerPage50 on both parents. Keep all
        // rows; the total-row budget is a resource guard, not a protocol size.
        if (batch.length > MAX_ROWS - rows.length) throw new MobileHistoryError('history-row-limit')
        if (!batch.every(record)) throw new MobileHistoryError('unexpected-history-response')
        const next: string = response.headers.get('data-header') ?? ''
        if (next !== '') continuationSegment(next)
        if (cursor === null) integrity = response.headers.get('integrity-header')
        if (next !== '' && (integrity === null || integrity === '' || invalidHeader(integrity))) throw new MobileHistoryError('missing-integrity')
        // Equal-looking individual operations are not proof of a duplicate.
        // An ambiguous replay of a whole page fails instead of dropping rows.
        const keys = batch.map(fingerprint)
        const pageKey = JSON.stringify(keys)
        if (batch.length > 0 && seenPages.has(pageKey)) throw new MobileHistoryError('repeated-page')
        if (keys.some(key => seenRows.has(key))) throw new MobileHistoryError('overlapping-pages')
        if (batch.length === 0 && next !== '') {
          if (emptyCursors.has(next)) throw new MobileHistoryError('repeated-page')
          emptyCursors.add(next)
        }
        if (batch.length > 0) seenPages.add(pageKey)
        for (const key of keys) seenRows.add(key)
        for (const row of batch) rows.push(row)
        await step(async () => await onPage({ pageOrdinal, rowCount: batch.length, totalRows: rows.length, hasMore: next !== '' }))
        check()
        if (next === '') return rows
        cursor = next
      }
      throw new MobileHistoryError('history-page-limit')
    } finally {
      active = false
      cursor = null
      integrity = null
      busy = false
    }
  }
}
