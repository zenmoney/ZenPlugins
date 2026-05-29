import { BankMessageError, InvalidLoginOrPasswordError } from '../../errors'
import type { Account, Transaction } from '../../types/zenmoney'
import { convertCardAccount, convertCurrentAccount, convertDepositAccount, convertFullStatementOperation, convertMiniCardStatementOperation, shouldSyncCardAccount } from './converters'
import { fetchAccountsOverview, fetchDepositAccountStatement, fetchLogin, fetchMiniCardStatement } from './fetchApi'
import { getMiniStatementIntervals, isDateInRange } from './helpers'
import type { FetchAccountMeta, ResponseWithErrorInfo } from './types/base'
import type { FetchMiniCardStatementOperation } from './types/fetch'

const INVALID_LOGIN_ERROR_CODES = new Set(['10008', '10812'])

const deduplicateTransactions = (transactions: Transaction[]): Transaction[] => {
  const transactionIndexesById = new Map<string, number>()
  const uniqueTransactions: Transaction[] = []

  for (const transaction of transactions) {
    const movementId = transaction.movements[0]?.id
    if (movementId == null) continue

    const existingIndex = transactionIndexesById.get(movementId)
    if (existingIndex == null) {
      transactionIndexesById.set(movementId, uniqueTransactions.length)
      uniqueTransactions.push(transaction)
      continue
    }

    if (uniqueTransactions[existingIndex].hold && !transaction.hold) {
      uniqueTransactions[existingIndex] = transaction
    }
  }

  return uniqueTransactions
}

const assertSuccessfulResponse = (response: ResponseWithErrorInfo, context: string): void => {
  if (response.errorInfo.error === '0') return

  console.error(`[${context}] Error`, response.errorInfo)

  throw new BankMessageError(response.errorInfo.errorDescription ?? response.errorInfo.errorText)
}

export const authenticate = async (login: string, password: string): Promise<{ sessionToken: string }> => {
  const response = await fetchLogin({ login, password })

  if (response.errorInfo.error !== '0') {
    if (INVALID_LOGIN_ERROR_CODES.has(response.errorInfo.error)) {
      throw new InvalidLoginOrPasswordError()
    }

    throw new BankMessageError(response.errorInfo.errorDescription ?? response.errorInfo.errorText)
  }

  return {
    sessionToken: response.sessionToken
  }
}

export const getAccounts = async ({ sessionToken }: { sessionToken: string }): Promise<Array<Account & FetchAccountMeta>> => {
  const response = await fetchAccountsOverview({ sessionToken })

  assertSuccessfulResponse(response, 'GET_ACCOUNTS')

  return [
    ...(response.overviewResponse.cardAccount ?? [])
      .filter((account) => shouldSyncCardAccount(account))
      .map((account) => convertCardAccount(account)),
    ...(response.overviewResponse.currentAccount ?? []).map((account) => convertCurrentAccount(account)),
    ...(response.overviewResponse.depositAccount ?? []).map((account) => convertDepositAccount(account))
  ]
}

export const getTransactions = async (
  { sessionToken, fromDate, toDate }: { sessionToken: string, fromDate: Date, toDate: Date | undefined },
  account: Account & FetchAccountMeta
): Promise<Transaction[]> => {
  if (account._meta.productKind === 'card' && account._meta.statementCardHash != null) {
    const operations: FetchMiniCardStatementOperation[] = []

    for (const interval of getMiniStatementIntervals(fromDate, toDate)) {
      const response = await fetchMiniCardStatement({
        sessionToken,
        cardHash: account._meta.statementCardHash,
        from: interval.from,
        till: interval.till
      })

      assertSuccessfulResponse(response, 'GET_TRANSACTIONS')
      operations.push(...(response.statement ?? []))
    }

    return deduplicateTransactions(operations
      .filter((operation) => operation.operationAmount !== 0 || operation.transactionAmount !== 0)
      .filter((operation) => isDateInRange(
        new Date(operation.operationDate),
        fromDate,
        toDate
      ))
      .map((operation) => convertMiniCardStatementOperation(operation, account))
    )
  }

  if (account._meta.productKind === 'deposit' && account._meta.statementInternalAccountId != null) {
    const response = await fetchDepositAccountStatement({
      sessionToken,
      internalAccountId: account._meta.statementInternalAccountId,
      from: fromDate.getTime(),
      till: (toDate ?? new Date()).getTime()
    })

    assertSuccessfulResponse(response, 'GET_TRANSACTIONS')

    return deduplicateTransactions((response.operations ?? [])
      .filter((operation) => operation.operationAmount !== 0 || operation.transactionAmount !== 0)
      .filter((operation) => isDateInRange(
        new Date(operation.transactionDate > 0 ? operation.transactionDate : operation.operationDate),
        fromDate,
        toDate
      ))
      .map((operation) => convertFullStatementOperation(operation, account))
    )
  }

  return []
}
