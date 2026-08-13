import { ScrapeFunc } from '../../types/zenmoney'
import { generateRandomString } from '../../common/utils'

import { Auth, Preferences } from './models'
import { mergeStatements } from './converters'
import { parseMBankStatementFromFiles, pickStatementDocuments } from './api'

export const scrape: ScrapeFunc<Preferences> = async () => {
  let auth = ZenMoney.getData('auth') as Auth | undefined
  if (auth == null || auth.deviceId === '') {
    auth = {
      deviceId: generateRandomString(16, '0123456789abcdef')
    }
  }
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()

  const blobs = await pickStatementDocuments()
  const statements = await parseMBankStatementFromFiles(blobs)

  // Manual file import: emit the whole picked statement(s) — no fromDate window,
  // no first-run gate. The user picks the file once and gets exactly what is in it.
  return mergeStatements(statements)
}
