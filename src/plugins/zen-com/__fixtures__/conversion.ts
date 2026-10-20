import type { AccountOrCard, AccountReferenceByData } from '../../../types/zenmoney'
import { convertAccounts } from '../converters'
import { arrayAt } from '../validation'
import { accountsResponse } from './accounts'
import { historyPages } from './history'

export const entries = historyPages.flatMap(page => arrayAt(page, 'historyEntries'))
export const accounts = (): AccountOrCard[] => convertAccounts(arrayAt(accountsResponse, 'accounts'))[0].accounts
export const accountId = '00000000-0000-4000-8000-000000000001'
export const usdId = '00000000-0000-4000-8000-000000000002'
export const external = (instrument: string, syncIds: string[] | null = null): AccountReferenceByData => ({ type: null, instrument, company: null, syncIds })
