import { fetchAccounts, fetchLogin, fetchTransactions } from './fetchApi'
import type { Account, Transaction } from '../../types/zenmoney'
import { convertCardAccount, convertTransaction } from './converters'

export const authenticate = async (login: string, password: string) => {
  // device id retrieve logic
  return await fetchLogin({ login, password })
}

export const getAccounts = async ({ sessionToken }: { sessionToken: string }): Promise<Account[]> => {
  const { cardAccount } = await fetchAccounts({ sessionToken })

  // Map only card accounts
  return [...cardAccount.map((acc) => convertCardAccount(acc))]
}

export const getTransactions = async ({ sessionToken, fromDate, toDate }: { sessionToken: string, fromDate: Date, toDate: Date | undefined }): Promise<Transaction[]> => {
  const { operationHistory } = await fetchTransactions({
    sessionToken,
    from: fromDate.getTime(),
    to: (toDate ?? new Date()).getTime()
  })

  return operationHistory.map((op) => convertTransaction(op))
}
