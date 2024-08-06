import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { Preferences, tronscanApi } from './api'
import { isSupportedToken } from './config'
import { convertAccount, convertTransaction, convertTokenTransaction } from './converters'

export const scrape: ScrapeFunc<Preferences> = async ({
  preferences,
  fromDate,
  toDate
}) => {
  const accounts: Account[] = []
  const transactions: Transaction[] = []

  await Promise.all(
    preferences.wallets
      .split(',')
      .map((wallet) => wallet.trim())
      .map(async (wallet) => {
        const [tokens, walletTransactions, trxTransfers, transfers] = await Promise.all([
          tronscanApi.fetchTokens(wallet),
          tronscanApi.fetchTransactions(wallet, fromDate, toDate),
          tronscanApi.fetchTronTransfers(wallet, fromDate, toDate),
          tronscanApi.fetchTokenTransfers(wallet, fromDate, toDate)
        ])

        const walletAccounts: Account[] = tokens.map((t) =>
          convertAccount(t, wallet)
        )

        const trxTransactions = trxTransfers
          .map((transfer) => {
            const transaction = walletTransactions.get(transfer.transaction_id)
            return convertTransaction(transfer, wallet, transaction)
          })
          .filter(
            (transaction): transaction is Transaction => transaction !== null
          )
        const tokenTransactions = transfers
          .flatMap((transfer) => {
            const transaction = walletTransactions.get(transfer.transaction_id)
            return convertTokenTransaction(transfer, wallet, transaction)
          })
          .filter(
            (transaction): transaction is Transaction => transaction !== null
          )

        accounts.push(...walletAccounts)
        transactions.push(...trxTransactions)
        transactions.push(...tokenTransactions)

        // fetchTokens doesn't return tokens with zero balance
        // so we need to collect them from transactions
        const existedAccounts = new Set(tokens.map((t) => t.tokenId))
        for (const transfer of [...trxTransfers, ...transfers]) {
          const tokenInfo = transfer.tokenInfo

          if (existedAccounts.has(tokenInfo.tokenId) || !isSupportedToken(tokenInfo)) {
            continue
          }

          accounts.push(convertAccount(tokenInfo, wallet))
          existedAccounts.add(tokenInfo.tokenId)
        }
      })
  )

  return {
    accounts,
    transactions
  }
}
