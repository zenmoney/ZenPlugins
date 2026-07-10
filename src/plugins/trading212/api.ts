import * as XLSX from 'xlsx'

import { fetch } from '../../common/network'
import { fetchAccountSummary, requestExport, listExports } from './fetchApi'
import { AccountSummary, Preferences, ExportOperation } from './models'

export async function fetchAccount (preferences: Preferences): Promise<AccountSummary> {
  return await fetchAccountSummary(preferences)
}

export async function fetchTransactions (preferences: Preferences, fromDate?: Date, toDate?: Date): Promise<ExportOperation[]> {
  const { reportId } = await requestExport(preferences, fromDate, toDate)

  await new Promise((resolve) => setTimeout(resolve, 10000))
  const exports = await listExports(preferences)
  const exportData = exports.find(e => e.reportId === reportId && e.status === 'Finished' && e.downloadLink)
  if (exportData == null) {
    throw new Error('Export took too long, try a shorter period')
  }
  const exportResponse = await fetch(exportData.downloadLink)
  const csv = XLSX.read(exportResponse.body, { type: 'string', raw: true }).Sheets.Sheet1

  return XLSX.utils.sheet_to_json<ExportOperation>(csv)
}
