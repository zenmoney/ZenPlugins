import { AccountType, AccountOrCard } from '../../../types/zenmoney'
import { ConvertedAccount, StatementAccount } from '../models'

export function convertPdfStatementAccount (rawAccount: StatementAccount, statementDate: string): ConvertedAccount {
  const date = new Date(statementDate)
  const idSuffix = rawAccount.id.slice(-7)
  const syncIds: string[] = [rawAccount.id]
  if (rawAccount.cardNumber != null) {
    syncIds.push(rawAccount.cardNumber)
  }

  const account: AccountOrCard = {
    id: `${idSuffix}-${rawAccount.instrument}`,
    balance: rawAccount.balance,
    instrument: rawAccount.instrument,
    syncIds,
    title: rawAccount.cardNumber != null
      ? `*${rawAccount.cardNumber.slice(-4)} ${rawAccount.instrument}`
      : `*${rawAccount.id.slice(-4)} ${rawAccount.instrument}`,
    type: AccountType.ccard
  }

  return { account, date }
}
