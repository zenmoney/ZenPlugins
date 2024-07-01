import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { Preferences, TonscanApi } from './api'
import { MAX_RPS } from './config'
import { convertWalletToAccount, convertJettonToAccount, convertTonTransaction, convertJettonTransfer } from './converters'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  const accounts: Account[] = []
  const transactions: Transaction[] = []
  const tonscanApi = new TonscanApi({
    baseUrl: 'https://toncenter.com/api/',
    maxRps: MAX_RPS
  })

  await Promise.all(
    preferences.wallets
      .split(',')
      .map(walletAddress => walletAddress.trim())
      .map(async (ownerWalletAddress) => {
        const [wallet, jettons] = await Promise.all([
          tonscanApi.fetchWallet(ownerWalletAddress),
          tonscanApi.fetchJettons(ownerWalletAddress)
        ])

        const [tonTransactions, jettonsTransfers] = await Promise.all([
          tonscanApi.fetchTonTransactions(ownerWalletAddress, fromDate, toDate),
          tonscanApi.fetchJettonsTransfers(jettons, fromDate, toDate)
        ])

        const walletAccounts: Account[] = [
          convertWalletToAccount(wallet),
          ...jettons.map((jetton) => convertJettonToAccount(jetton))
        ]

        const walletTransactions = tonTransactions
          .map((transaction) => convertTonTransaction(transaction, wallet))
          .filter((transaction): transaction is Transaction => transaction !== null)

        const jettonsTransactions = jettonsTransfers
          .map((transaction) => convertJettonTransfer(transaction, jettons))
          .filter((transaction): transaction is Transaction => transaction !== null)

        accounts.push(...walletAccounts)
        transactions.push(...walletTransactions)
        transactions.push(...jettonsTransactions)
      }))

  return {
    accounts,
    transactions
  }
}
