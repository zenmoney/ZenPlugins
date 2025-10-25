import { fetchAccounts, fetchLogin, fetchTransactions } from './fetchApi'
import type { Account, Transaction } from '../../types/zenmoney'
import { convertCardAccount, convertCurrentAccount, convertTransaction } from './converters'
import { BankMessageError, InvalidLoginOrPasswordError, UserInteractionError } from '../../errors'

export const authenticate = async (login: string, password: string, deviceId: string): Promise<{ sessionToken: string }> => {
  const { data, error } = await fetchLogin({ login, password, deviceId })

  if (error) {
    // Invalid login/password to the account
    if (error.code === 'UNSUCCESSFUL_ATTEMPT_LOGIN_WEB') {
      throw new InvalidLoginOrPasswordError()
    }
    // Device was removed from the account => not able to log in with saved deviceId
    // Plugin must be reinstalled
    if (error.code === 'CURRENT_USER_DEVICE_IS_REMOVED') {
      throw new UserInteractionError()
    }

    console.error('authenticate', error)

    throw new BankMessageError(error.message)
  }

  return data
}

export const getAccounts = async ({ sessionToken }: { sessionToken: string }): Promise<Account[]> => {
  const { data, error } = await fetchAccounts({ sessionToken })

  if (error) {
    console.error('getAccounts', error)

    throw new BankMessageError(error.message)
  }

  return [
    ...data.cardAccount.map((acc) => convertCardAccount(acc)),
    ...data.currentAccount.map((acc) => convertCurrentAccount(acc))
  ]
}

export const getTransactions = async ({ sessionToken, fromDate, toDate }: { sessionToken: string, fromDate: Date, toDate: Date | undefined }, account: Account): Promise<Transaction[]> => {
  const { data, error } = await fetchTransactions({
    sessionToken,
    from: fromDate.getTime(),
    to: (toDate ?? new Date()).getTime(),
    account: account.id
  })

  if (error) {
    console.error('getTransactions', error)

    throw new BankMessageError(error.message)
  }

  return data.operationHistory
    .filter((op) => op.amount)
    .map((op) => convertTransaction(op, account))
}
