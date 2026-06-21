import { fetchAccounts, fetchLogin, fetchCardTransactions, fetchProductStatement } from './fetchApi'
import type { Account, Transaction } from '../../types/zenmoney'
import { convertCardAccount, convertCurrentAccount, convertCardTransaction, convertStatementTransaction } from './converters'
import { BankMessageError, InvalidLoginOrPasswordError } from '../../errors'
import { convertDateToYyyyMmDd } from './helpers'
import { mergeTransactions } from './mergeTransactions'
import type { FetchAccountMeta, FetchProductStatementOutput, FetchStatementOperation } from './types/fetch.types'

const getStatementOperations = (statement: FetchProductStatementOutput): FetchStatementOperation[] => {
  if (Array.isArray(statement)) {
    return []
  }

  return statement.operations ?? []
}

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

export const getAccounts = async ({ sessionToken }: { sessionToken: string }): Promise<Array<Account & FetchAccountMeta>> => {
  const { data, error } = await fetchAccounts({ sessionToken })

  if (error != null) {
    console.error('[GET_ACCOUNTS] Error', error)

    throw new BankMessageError(error.errorInfo.errorText)
  }

  const { cards = [], accounts = [] } = data.products

  return [
    ...cards.map((acc) => convertCardAccount(acc)),
    ...accounts.map((acc) => convertCurrentAccount(acc))
  ]
}

export const getTransactions = async ({ sessionToken, fromDate, toDate }: { sessionToken: string, fromDate: Date, toDate: Date | undefined }, account: Account & FetchAccountMeta): Promise<Transaction[]> => {
  const [cardTransactionsResponse, productStatementResponse] = await Promise.all([
    (account._meta.cardTransactionsFetchId != null
      ? fetchCardTransactions({
        sessionToken,
        from: convertDateToYyyyMmDd(fromDate),
        to: convertDateToYyyyMmDd(toDate ?? new Date()),
        cardId: account._meta.cardTransactionsFetchId
      })
      : Promise.resolve(null)),
    fetchProductStatement({
      sessionToken,
      from: convertDateToYyyyMmDd(fromDate),
      to: convertDateToYyyyMmDd(toDate ?? new Date()),
      productId: account._meta.productStatementFetchId
    })
  ])

  if (cardTransactionsResponse?.error != null) {
    console.error('[GET_TRANSACTIONS] Card transactions error', cardTransactionsResponse.error)

    throw new BankMessageError(cardTransactionsResponse.error.errorInfo.errorText)
  }

  if (productStatementResponse.error != null) {
    console.error('[GET_TRANSACTIONS] Product statement error', productStatementResponse.error)

    throw new BankMessageError(productStatementResponse.error.errorInfo.errorText)
  }

  const historyTransactions = (cardTransactionsResponse?.data ?? [])
    .filter((op) => op.amount !== '0.00')
    .map((op) => convertCardTransaction(op, account))

  const statementTransactions = getStatementOperations(productStatementResponse.data)
    .filter((op) => op.operationSum !== '0.00')
    .map((op) => convertStatementTransaction(op, account))

  return mergeTransactions(historyTransactions, statementTransactions)
}
