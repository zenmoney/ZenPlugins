import { AccountType, DepositOrLoan, AccountOrCard } from '../../../types/zenmoney'
import { ConvertedAccount, StatementAccount } from '../models'

export function convertPdfStatementAccount (rawAccount: StatementAccount): ConvertedAccount {
  const date = new Date(rawAccount.date)
  if (rawAccount.type === 'deposit') {
    const percentMatch = rawAccount.capitalization?.match(/(\d+)%/)
    const account: DepositOrLoan = {
      id: rawAccount.id,
      balance: rawAccount.balance,
      instrument: rawAccount.instrument,
      syncIds: [rawAccount.id],
      title: rawAccount.title,
      type: AccountType.deposit,
      endDateOffsetInterval: 'year',
      startDate: typeof rawAccount.startDate === 'string' ? new Date(rawAccount.startDate) : new Date(),
      startBalance: 0,
      endDateOffset: 1,
      capitalization: typeof rawAccount.capitalization === 'string' && rawAccount.capitalization.length > 0,
      percent: ((percentMatch?.length) != null) && (percentMatch[1] !== '') ? parseFloat(percentMatch[1]) : 0,
      payoffInterval: null,
      payoffStep: 0
    }
    return {
      account,
      date
    }
  } else {
    const account: AccountOrCard = {
      id: rawAccount.id,
      balance: rawAccount.balance,
      instrument: rawAccount.instrument,
      syncIds: [rawAccount.id],
      title: rawAccount.title,
      type: AccountType.ccard
    }
    return {
      account,
      date
    }
  }
}
