import type { MobileSession } from './models'
import { requestMobile } from './request'

export async function fetchAccountPage (session: MobileSession): Promise<unknown> {
  return await requestMobile(session.deviceId, 'v2/accounts?hidden=true&checkCache=false', undefined,
    { 'Access-Token': session.accessToken }, 'GET')
}

export async function fetchHistoryPage (session: MobileSession, lastHistoryEntryId?: string): Promise<unknown> {
  const cursor = lastHistoryEntryId === undefined ? '' : `?lastHistoryEntryId=${encodeURIComponent(lastHistoryEntryId)}`
  return await requestMobile(session.deviceId, `history-entries${cursor}`, undefined,
    { 'Access-Token': session.accessToken }, 'GET')
}
