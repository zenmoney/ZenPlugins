import { Account, ExtendedTransaction, ScrapeFunc } from '../../types/zenmoney'
import { fetchAccountsV2, fetchCardsV2, fetchDepositStatementsV2, fetchDepositsV2, fetchLoansV2, fetchTransactionsV2, loginV2 } from './api'
import { convertLoansV2, convertAccountsV2, convertCardsV2, convertDepositV2, convertStatementV2, convertTransactionsV2 } from './converters'
import { AuthV2, FetchHistoryV2Data, Preferences } from './models'
import { adjustTransactions } from '../../common/transactionGroupHandler'
import { validateAuth } from './utils'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate, isInBackground }) => {
  ZenMoney.locale = 'en'
  let auth = ZenMoney.getData('auth') as AuthV2 | undefined
  if (auth && !validateAuth(auth)) {
    auth = undefined
  }
  const session = await loginV2(preferences, auth)
  ZenMoney.setData('auth', session.auth)
  ZenMoney.saveData()

  const accounts: Account[] = []
  await Promise.all(convertLoansV2(await fetchLoansV2(session)).map(async preparedLoan => {
    const account = preparedLoan.account

    if (ZenMoney.isAccountSkipped(account.id)) {
      console.log(`Account ${account.id} is skipped`)
      return
    }
    accounts.push(account)
  }))

  const transactionsById = new Map<string, ExtendedTransaction>()
  const fetchHistoryV2Data: FetchHistoryV2Data[] = []
  const accountToSyncIds = new Map<string, string[]>()
  await Promise.all(convertCardsV2(await fetchCardsV2(session)).map(async preparedCard => {
    const account = preparedCard.account

    if (ZenMoney.isAccountSkipped(account.id)) {
      console.log(`Account ${account.id} is skipped`)
      return
    }
    accounts.push(account)
    fetchHistoryV2Data.push({
      account,
      currency: account.instrument,
      iban: preparedCard.iban,
      id: preparedCard.id.toString()
    })
  }))

  await Promise.all(convertAccountsV2(await fetchAccountsV2(session)).map(async preparedAccount => {
    const account = preparedAccount.account
    if (ZenMoney.isAccountSkipped(account.id)) {
      console.log(`Account ${account.id} is skipped`)
      return
    }
    accounts.push(account)
    fetchHistoryV2Data.push({
      account,
      currency: account.instrument,
      iban: preparedAccount.iban,
      id: preparedAccount.account.id
    })
  }))

  for (const account of accounts) {
    accountToSyncIds.set(account.id, [account.id])
  }

  for (const data of fetchHistoryV2Data) {
    const tr = await fetchTransactionsV2(session, fromDate, data)
    const t = convertTransactionsV2(tr, fromDate, data)
    for (const transaction of t) {
      const transactionId = transaction.movements[0].id!
      transactionsById.set(transactionId, transaction)
    }
  }
  const transactions = Array.from(transactionsById.values())
  const deposits = await fetchDepositsV2(session)
  for (const deposit of deposits) {
    const depostitAccount = convertDepositV2(deposit)
    if (ZenMoney.isAccountSkipped(depostitAccount.id)) {
      console.log(`Account ${depostitAccount.id} is skipped`)
      continue
    }
    accounts.push(depostitAccount)
    const statements = await fetchDepositStatementsV2(deposit.deposit.id, session)
    for (const statement of statements) {
      const transaction = convertStatementV2(statement, depostitAccount)
      transactions.push(transaction)
    }
  }
  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}
