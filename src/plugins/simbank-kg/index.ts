import { ScrapeFunc } from '../../types/zenmoney'

import { Preferences } from './models'
import { mergeStatements } from './converters'
import { parseSimbankStatementFromFiles, pickStatementDocuments } from './api'

export const scrape: ScrapeFunc<Preferences> = async () => {
  const blobs = await pickStatementDocuments()
  const statements = await parseSimbankStatementFromFiles(blobs)

  // Manual file import: emit the whole picked statement(s) — no fromDate window,
  // no first-run gate. The user picks the file once and gets exactly what is in it.
  return mergeStatements(statements)
}
