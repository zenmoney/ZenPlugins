import { login, fetchCards, fetchAccounts, fetchTransactions, fetchLoans, fetchLoan } from './api'
import { convertAccount, convertTransaction, convertLoan } from './converters'
import { flattenDeep, omit, concat } from 'lodash'

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  let auth = ZenMoney.getData('auth', {})
  auth = await login(preferences, auth)

  let accounts = []

  const fetchedCards = await fetchCards(auth)
  accounts = concat(accounts, fetchedCards.cardAccounts.map(account => convertAccount(account)))

  const fetchedAccounts = await fetchAccounts(auth)
  accounts = concat(accounts, fetchedAccounts.map(account => convertAccount(account)))

  const fetchedLoans = await fetchLoans(auth)
  for (const l of fetchedLoans) {
    let loan = await fetchLoan(auth, l.contractId.toString())
    accounts = concat(accounts, convertLoan(loan))
  }

  const transactions = []
  transactions.push(
    await Promise.all(
      accounts.map(
        async account => {
          const fetchedTransactions = await fetchTransactions(auth, account.id, account._type, fromDate, toDate || new Date())
          return fetchedTransactions.map(transaction => convertTransaction(transaction, account)).filter(item => item)
        }
      )
    )
  )

  // хранить accessToken не нужно
  delete auth.accessToken

  if (!accounts || accounts.length === 0) {
    throw new Error('Пустой список счетов')
  }

  return {
    accounts: accounts.map(account => omit(account, ['_type', '_repaymentAccount'])),
    transactions: flattenDeep(transactions)
  }
}
