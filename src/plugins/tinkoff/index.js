import { AuthService } from './api/authService'
import { BankInfoService } from './api/bankInfoService'
import { InvestingInfoService } from './api/investingInfoService'
import { TransactionsPostProcessor } from './converters/transactionsPostProcessor'
import { AccountsPostProcessor } from './converters/accountsPostProcessor'

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  const authService = new AuthService()
  const session = await authService.getSession(preferences, isInBackground)

  const bankInfoService = new BankInfoService(session)
  const bankAccounts = await bankInfoService.getAccounts(fromDate)
  const bankTransactions = bankAccounts.flatMap(x => x.transactions)

  const investingInfoService = new InvestingInfoService(session)
  const investingAccounts = await investingInfoService.getAccounts(fromDate)
  const investingTransactions = investingAccounts.flatMap(x => x.transactions)

  let accounts = bankAccounts.concat(investingAccounts)
  let transactions = bankTransactions.concat(investingTransactions)

  const accountsPostProcessor = new AccountsPostProcessor()
  accounts = accountsPostProcessor.process(accounts)

  const transactionsPostProcessor = new TransactionsPostProcessor()
  transactions = transactionsPostProcessor.process(transactions)

  return {
    accounts: accounts,
    transactions: transactions
  }
}
