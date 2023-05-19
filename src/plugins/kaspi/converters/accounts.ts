import { AccountType } from '../../../types/zenmoney'
import { StatementAccount, ConvertedAccount } from '../models'

export function convertPdfStatementAccount (rawAccount: StatementAccount): ConvertedAccount {
  return {
    account: {
      id: rawAccount.id,
      balance: rawAccount.balance,
      instrument: rawAccount.instrument,
      syncIds: [rawAccount.id],
      title: rawAccount.title,
      type: AccountType.ccard
    },
    date: new Date(rawAccount.date)
  }
}
