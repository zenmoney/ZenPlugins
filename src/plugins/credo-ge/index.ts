import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { fetchAccounts, fetchTransactions, login } from './api'
import { fetchCards, fetchDeposits, fetchLoans, fetchBlockedTransactions, getTransactionDetail } from './fetchApi'
import { convertAccounts, convertTransaction, getAccountNumberToAccountMapping } from './converters'
import { Auth, Preferences } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  toDate = toDate ?? new Date()
  const session = await login(preferences, ZenMoney.getData('auth') as Auth | undefined)
  ZenMoney.setData('auth', session.auth)
  ZenMoney.saveData()

  const transactions: Transaction[] = []

  const credoAccounts = await fetchAccounts(session)
  const credoCards = await fetchCards(session)
  const credoDeposits = await fetchDeposits(session)
  const credoLoans = await fetchLoans(session)
  const accounts: Account[] = convertAccounts(credoAccounts, credoCards, credoDeposits, credoLoans)
  const numberToAccount = getAccountNumberToAccountMapping(accounts)
  console.log('>> numberToAccount', numberToAccount)

  const blockedTransactions = await fetchBlockedTransactions(session, fromDate)
  const blockedTransactionsByAccountId = new Map()

  for (const t of blockedTransactions) {
    const transactionDetail = await getTransactionDetail(session, t.stmtEntryId)
    const accountNumber = transactionDetail.accountNumber + transactionDetail.currency
    const account = numberToAccount.get(accountNumber)
    if (account) {
      const transactionsList = blockedTransactionsByAccountId.get(account.id)
      if (transactionsList) {
        blockedTransactionsByAccountId.set(account.id, transactionsList.concat(t))
      } else {
        blockedTransactionsByAccountId.set(account.id, [t])
      }
    }
  }
  console.log('>> blockedTransactionsByAccountId: ', blockedTransactionsByAccountId)

  for (const account of accounts) {
    console.log(account)
    if (ZenMoney.isAccountSkipped(account.id)) {
      continue
    }
    console.log('>>> Getting transactions for account: ' + account.id)
    const apiTransactions = await fetchTransactions(session, account.id, fromDate)
    for (const apiTransaction of apiTransactions) {
      transactions.push(convertTransaction(apiTransaction, account))
    }
    console.log('>>> converting blocked transactions')
    const transactionsBlockedForAccount = blockedTransactionsByAccountId.get(account.id)
    if (transactionsBlockedForAccount) {
      console.log('>> transactionsBlockedForAccount', transactionsBlockedForAccount)
      for (const blockedTransaction of transactionsBlockedForAccount) {
        transactions.push(convertTransaction(blockedTransaction, account))
      }
    }
  }

  return { accounts, transactions }
}
