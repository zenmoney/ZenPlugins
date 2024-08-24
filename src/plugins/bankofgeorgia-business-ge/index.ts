import { ScrapeFunc, Account as ZenMoneyAccount, Transaction as ZenMoneyTransaction } from '../../types/zenmoney'
import { parseAccounts, fetchTransactions, fetchBalance } from './api'
import { convertToZenMoneyAccount, convertToZenMoneyTransaction, injectAccountInfo } from './converters'
import { AccountRecord, Preferences } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  toDate = toDate ?? new Date()

  const accounts = parseAccounts(preferences)
  const zenAccounts: ZenMoneyAccount[] = []

  let records: AccountRecord[] = []

  for (const account of accounts) {
    if (ZenMoney.isAccountSkipped(account.id)) {
      continue
    }

    const balanceResponse = await fetchBalance(preferences, account)
    account.balance = balanceResponse.CurrentBalance
    zenAccounts.push(convertToZenMoneyAccount(account))

    const statement = await fetchTransactions(preferences, account, fromDate, toDate)
    const accountRecords = injectAccountInfo(statement.Records, account)
    records = records.concat(accountRecords)
  }

  const zenTransactions: ZenMoneyTransaction[] = []
  for (const record of records) {
    zenTransactions.push(convertToZenMoneyTransaction(record, records))
  }

  return {
    accounts: zenAccounts,
    transactions: zenTransactions
  }
}
