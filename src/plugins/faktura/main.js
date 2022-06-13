/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import * as api from './api'
import { contractIdsFetcher as cardContractIdsFetcher, converter as cardDataToZenmoneyAccount } from './converters/card'
import { mapContractToAccount } from './converters/helpers'
import { converter as transactionsDataToZenmoneyTransaction, filterDuplicates } from './converters/transaction'
import { contractIdsFetcher as walletContractIdsFetcher, converter as walletDataToZenmoneyAccount } from './converters/wallet'

async function scrape ({ preferences, fromDate, toDate, isInBackground, apiUri }) {
  api.setApiUri(apiUri)

  const auth = await api.auth(preferences.card_number, preferences.password, ZenMoney.getData('auth', {}), isInBackground)
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()

  const [cardsData, creditData, walletsData] = await Promise.all([
    api.fetchCards(auth),
    api.fetchCredits(auth),
    api.fetchWallets(auth)
  ])

  const contractIds = [
    ...cardContractIdsFetcher(cardsData),
    ...walletContractIdsFetcher(walletsData)
  ]

  const [transactionsData] = await Promise.all([
    api.fetchTransactions(fromDate, contractIds, auth)
  ])

  const cards = cardsData.map((data) => cardDataToZenmoneyAccount(data, creditData))
  const wallets = walletsData.map(walletDataToZenmoneyAccount)

  const accountsById = {}
  for (const account of cards) {
    accountsById[account.id] = account
  }
  for (const account of wallets) {
    accountsById[account.id] = account
  }
  const map = mapContractToAccount(cardsData)
  let transactions = []
  for (const transactionData of transactionsData) {
    const transaction = transactionsDataToZenmoneyTransaction(transactionData, map, accountsById)
    if (transaction) {
      transactions.push(transaction)
    }
  }
  transactions = filterDuplicates(transactions)
  const accounts = [].concat(cards, wallets)

  return {
    accounts,
    transactions
  }
}

export {
  scrape
}
