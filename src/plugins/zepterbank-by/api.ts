import { fetchAccounts, fetchLogin, fetchCardTransactions, fetchProductStatement } from './fetchApi'
import type { Account, Transaction } from '../../types/zenmoney'
import { convertCardAccount, convertCurrentAccount, convertCardTransaction, convertStatementTransaction } from './converters'
import { BankMessageError, InvalidLoginOrPasswordError } from '../../errors'
import { convertDateToYyyyMmDd } from './helpers'

export const authenticate = async (login: string, password: string): Promise<{ sessionToken: string }> => {
  const { data, error } = await fetchLogin({ login, password })

  if (error != null) {
    // Invalid login/password to the account
    if (error.errorInfo.code === 1011) {
      throw new InvalidLoginOrPasswordError()
    }

    console.error('[AUTHENTICATE] Error', error)

    throw new BankMessageError(error.errorInfo.errorText)
  }

  return data
}

export const getAccounts = async ({ sessionToken }: { sessionToken: string }): Promise<Account[]> => {
  const { data, error } = await fetchAccounts({ sessionToken })

  if (error != null) {
    console.error('[GET_ACCOUNTS] Error', error)

    throw new BankMessageError(error.errorInfo.errorText)
  }

  return [
    ...data.products.cards.map((acc) => convertCardAccount(acc)),
    ...data.products.accounts.map((acc) => convertCurrentAccount(acc))
  ]
}

export const getTransactions = async ({ sessionToken, fromDate, toDate }: { sessionToken: string, fromDate: Date, toDate: Date | undefined }, account: Account): Promise<Transaction[]> => {
  const [cardTransactionsResponse, productStatementResponse] = await Promise.all([
    fetchCardTransactions({
      sessionToken,
      from: convertDateToYyyyMmDd(fromDate),
      to: convertDateToYyyyMmDd(toDate ?? new Date()),
      cardId: account.id
    }),
    fetchProductStatement({
      sessionToken,
      from: convertDateToYyyyMmDd(fromDate),
      to: convertDateToYyyyMmDd(toDate ?? new Date()),
      productId: account.id
    })
  ])

  if (cardTransactionsResponse.error != null) {
    console.error('[GET_TRANSACTIONS] Card transactions error', cardTransactionsResponse.error)

    throw new BankMessageError(cardTransactionsResponse.error.errorInfo.errorText)
  }

  if (productStatementResponse.error != null) {
    console.error('[GET_TRANSACTIONS] Product statement error', productStatementResponse.error)

    throw new BankMessageError(productStatementResponse.error.errorInfo.errorText)
  }

  return [
    ...cardTransactionsResponse.data
      .filter((op) => op.amount !== '0.00')
      .map((op) => convertCardTransaction(op, account)),
    ...productStatementResponse.data.operations
      .filter((op) => op.operationSum !== '0.00')
      .map((op) => convertStatementTransaction(op, account))
  ]
}
