import { isEqual } from 'lodash'
import { fetchAccountPage, fetchHistoryPage } from './fetchApi'
import type { FetchParams, MobileSession } from './models'
import { arrayAt, booleanAt, dateAt, stringAt } from './validation'

export async function fetchAccounts (session: MobileSession): Promise<unknown[]> {
  const response = await fetchAccountPage(session)
  const accounts = arrayAt(response, 'accounts')
  assert(accounts.length > 0, 'ZEN.COM returned no accounts')
  return accounts
}

export async function fetchTransactions (session: MobileSession, fetchParams: FetchParams, fromDate: Date, toDate?: Date): Promise<unknown[]> {
  assert(fetchParams.accountIds.length > 0, 'Empty ZEN.COM history plan')
  assert(Number.isFinite(fromDate.getTime()) && (toDate == null || Number.isFinite(toDate.getTime())), 'Invalid ZEN.COM history interval')
  const result: unknown[] = []
  const cursors = new Set<string>()
  const seen = new Map<string, unknown>()
  let cursor: string | undefined
  while (true) {
    const response = await fetchHistoryPage(session, cursor)
    const entries = arrayAt(response, 'historyEntries')
    const lastPage = booleanAt(response, 'isLastPage')
    for (const entry of entries) {
      const id = stringAt(entry, 'id')
      assert(!seen.has(id) || isEqual(seen.get(id), entry), 'Conflicting ZEN.COM history pages', { id })
      if (seen.has(id)) continue
      seen.set(id, entry)
      const date = dateAt(entry, 'transaction.createdAt')
      if (date >= fromDate && (toDate == null || date <= toDate)) result.push(entry)
    }
    if (lastPage) break
    assert(entries.length > 0, 'Empty nonterminal ZEN.COM history page')
    cursor = stringAt(entries[entries.length - 1], 'id')
    assert(!cursors.has(cursor), 'ZEN.COM history cursor did not advance', { cursor })
    cursors.add(cursor)
  }
  return result
}
