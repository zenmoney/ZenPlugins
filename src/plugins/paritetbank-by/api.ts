import { fetchAccounts, fetchLogin, fetchTransactions } from './fetchApi'
import type { Account, Transaction } from '../../types/zenmoney'
import { convertCardAccount, convertCurrentAccount, convertTransaction } from './converters'

export const authenticate = async (login: string, password: string): Promise<{ sessionToken: string }> => {
  // device id retrieve logic
  return await fetchLogin({ login, password })
}

export const getAccounts = async ({ sessionToken }: { sessionToken: string }): Promise<Account[]> => {
  const { cardAccount, currentAccount } = await fetchAccounts({ sessionToken })

  return [
    ...cardAccount.map((acc) => convertCardAccount(acc)),
    ...currentAccount.map((acc) => convertCurrentAccount(acc))
  ]
}

export const getTransactions = async ({ sessionToken, fromDate, toDate }: { sessionToken: string, fromDate: Date, toDate: Date | undefined }): Promise<Transaction[]> => {
  const { operationHistory } = await fetchTransactions({
    sessionToken,
    from: fromDate.getTime(),
    to: (toDate ?? new Date()).getTime()
  })

  return operationHistory
    .filter((op) => op.amount)
    .map((op) => convertTransaction(op))
}
