import { fetchAccounts, fetchLogin, fetchTransactions } from './fetchApi'
import type { Account, Transaction } from '../../types/zenmoney'
import { convertCardAccount, convertCurrentAccount, convertTransaction } from './converters'
import type * as TFetch from './types/fetch'

export const authenticate = async (login: string, password: string, deviceId: string): Promise<{ sessionToken: string }> => {
  // device id retrieve logic
  const response = await fetchLogin({ login, password, deviceId })

  return response
}

export const getAccounts = async ({ sessionToken }: { sessionToken: string }): Promise<{ accounts: Account[], json: TFetch.FetchAccountsOutput }> => {
  const json = await fetchAccounts({ sessionToken })

  return {
    accounts: [
      ...json.cardAccount.map((acc) => convertCardAccount(acc)),
      ...json.currentAccount.map((acc) => convertCurrentAccount(acc))
    ],
    json
  }
}

export const getTransactions = async ({ sessionToken, fromDate, toDate }: { sessionToken: string, fromDate: Date, toDate: Date | undefined }, account: Account): Promise<Transaction[]> => {
  const { operationHistory } = await fetchTransactions({
    sessionToken,
    from: fromDate.getTime(),
    to: (toDate ?? new Date()).getTime(),
    account: account.id
  })

  return operationHistory
    .filter((op) => op.amount)
    .map((op) => convertTransaction(op, account))
    .filter(Boolean)
}
