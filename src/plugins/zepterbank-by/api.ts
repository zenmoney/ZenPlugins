import { fetchAccounts, fetchLogin, fetchCardTransactions, fetchProductStatement } from './fetchApi'
import type { Account, Transaction } from '../../types/zenmoney'
import { convertCardAccount, convertCurrentAccount, convertCardTransaction, convertStatementTransaction } from './converters'
import { BankMessageError, InvalidLoginOrPasswordError } from '../../errors'
import { convertDateToYyyyMmDd, convertIsoDateStringToDate, getBusinessDateIdentityKey } from './helpers'
import { mergeTransactions } from './mergeTransactions'
import type { FetchAccountMeta, FetchCardTransaction, FetchProductStatementOutput, FetchStatementOperation } from './types/fetch.types'

const getStatementOperations = (statement: FetchProductStatementOutput): FetchStatementOperation[] => {
  if (Array.isArray(statement)) {
    return []
  }

  return statement.operations ?? []
}

const normalizeCardTransactionText = (value: string | undefined): string =>
  (value ?? '').replace(/\s+/g, ' ').trim().toUpperCase()

const getCardTransactionMcc = (transaction: FetchCardTransaction): string =>
  transaction.transMcc?.replace(/\D/g, '') ?? ''

const getCardTransactionMatchKey = (transaction: FetchCardTransaction): string => [
  getBusinessDateIdentityKey(convertIsoDateStringToDate(transaction.effectiveDate)),
  transaction.amount,
  transaction.currencyIso,
  normalizeCardTransactionText(transaction.cardAcceptor),
  getCardTransactionMcc(transaction)
].join('|')

const isPendingPurchase = (transaction: FetchCardTransaction): boolean =>
  /\bPRE-PURCHASE\b/i.test(transaction.transacName)

const isPurchaseCompletion = (transaction: FetchCardTransaction): boolean =>
  /\bPURCH COMPL\b/i.test(transaction.transacName)

const dropCompletedPendingPurchases = (transactions: FetchCardTransaction[]): FetchCardTransaction[] => {
  const completionsByKey = new Map<string, number>()

  for (const transaction of transactions) {
    if (isPurchaseCompletion(transaction)) {
      const key = getCardTransactionMatchKey(transaction)
      completionsByKey.set(key, (completionsByKey.get(key) ?? 0) + 1)
    }
  }

  return transactions.filter((transaction) => {
    if (!isPendingPurchase(transaction)) {
      return true
    }

    const key = getCardTransactionMatchKey(transaction)
    const matchingCompletionsCount = completionsByKey.get(key) ?? 0
    if (matchingCompletionsCount <= 0) {
      return true
    }

    completionsByKey.set(key, matchingCompletionsCount - 1)
    return false
  })
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

  const historyTransactions = dropCompletedPendingPurchases(cardTransactionsResponse?.data ?? [])
    .filter((op) => op.amount !== '0.00')
    .map((op) => convertCardTransaction(op, account))

  const statementTransactions = getStatementOperations(productStatementResponse.data)
    .filter((op) => op.operationSum !== '0.00')
    .map((op) => convertStatementTransaction(op, account))

  return mergeTransactions(historyTransactions, statementTransactions)
}
