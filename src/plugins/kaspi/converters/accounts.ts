import { AccountType, DepositOrLoan, AccountOrCard } from '../../../types/zenmoney'
import { ConvertedAccount, StatementAccount } from '../models'

export function convertPdfStatementAccount (rawAccount: StatementAccount): ConvertedAccount {
  const date = new Date(rawAccount.date)
  if (rawAccount.type === 'deposit') {
    let endDateOffset = 0
    let endDateOffsetInterval: 'month' | 'year' | 'day' = 'year'
    const startDate: Date = typeof rawAccount.startDate === 'string' ? new Date(rawAccount.startDate) : new Date()
    if (typeof rawAccount.startDate === 'string' && typeof rawAccount.endDate === 'string') {
      const endDate = new Date(rawAccount.endDate)
      endDateOffset = Math.round((endDate.getTime() - startDate.getTime()) / 1000 / 60 / 60 / 24 / 30)
      if (endDateOffset >= 12) {
        endDateOffset = Math.round(endDateOffset / 12)
      } else {
        endDateOffsetInterval = 'month'
      }
    }
    const percentMatch = rawAccount.capitalization?.match(/(\d+)%/)
    const account: DepositOrLoan = {
      id: rawAccount.id,
      balance: rawAccount.balance,
      instrument: rawAccount.instrument,
      syncIds: [rawAccount.id],
      title: rawAccount.title,
      type: AccountType.deposit,
      endDateOffsetInterval,
      startDate,
      startBalance: 0,
      endDateOffset,
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
