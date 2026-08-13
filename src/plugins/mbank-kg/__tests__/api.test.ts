import * as XLSX from 'xlsx'
import { parseMBankStatementFromFiles } from '../api'
import { TemporaryError } from '../../../errors'

function xlsxBlob (rows: string[][]): Blob {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Sheet1')
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array
  return new Blob([buf], { type: 'application/vnd.ms-excel' })
}

describe('parseMBankStatementFromFiles', () => {
  it('surfaces a non-MBank spreadsheet as a TemporaryError', async () => {
    let error: unknown
    try {
      await parseMBankStatementFromFiles([xlsxBlob([['hello', 'world']])])
    } catch (e) {
      error = e
    }
    expect(error).toBeInstanceOf(TemporaryError)
    expect((error as Error).message).toContain('выписка MBank')
  })
})
