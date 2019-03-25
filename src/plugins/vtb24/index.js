import * as _ from 'lodash'
import { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId } from '../../common/accounts'
import { convertAccounts, convertTransaction, getDistinctTransactions } from './converters'
import { fetchAccounts, fetchTransactions, login } from './api'

export async function scrape ({ preferences, fromDate, toDate }) {
  toDate = toDate || new Date()
  const auth = await login(preferences.login, preferences.password)
  const apiPortfolios = await fetchAccounts(auth)
  const apiAccounts = convertAccounts(apiPortfolios)
  const zenAccounts = []
  const transactions = []

  // [
  // TODO: remove after test distinct transactions for multiple cards in same credit card account
  const isCreditCard = productType => productType === 'ru.vtb24.mobilebanking.protocol.product.CreditCardMto'
  const creditCardsByCardAccount = apiPortfolios.reduce(
    (cards, apiPortfolio) => apiPortfolio.id === 'CARDS'
      ? cards.concat(
        apiPortfolio.productGroups.map(
          productGroup =>
            isCreditCard(productGroup.mainProduct.__type)
              ? [productGroup.mainProduct.cardAccount.id, productGroup.mainProduct.cardAccount.cards, productGroup.mainProduct.cardAccount.mainCard]
              : []
        )
      )
      : cards,
    []
  )

  const readableTransactionsByAccountId = {}
  // ]

  await Promise.all(apiAccounts.map(async apiAccount => {
    if (zenAccounts.indexOf(apiAccount.zenAccount) < 0) {
      zenAccounts.push(apiAccount.zenAccount)
    }
    if (ZenMoney.isAccountSkipped(apiAccount.zenAccount.id)) {
      return
    }
    try {
      const apiTransactions = (await fetchTransactions(auth, apiAccount, fromDate, toDate))
      const readableTransactions = apiTransactions.map(apiTransaction => convertTransaction(apiTransaction, apiAccount))
        .filter(x => x)

      // TODO: remove after test distinct transactions for multiple cards in same credit card account
      readableTransactionsByAccountId[apiAccount.id] = readableTransactions

      if (isCreditCard(apiAccount.type)) {
        if (creditCardsByCardAccount.some(([,, mainCard]) => apiAccount.id === mainCard.id)) {
          transactions.push(...readableTransactions)
        }
      } else {
        transactions.push(...readableTransactions)
      }
    } catch (e) {
      if (e && e.message && e.message.indexOf('временно') >= 0) {
        if (apiAccount.cards && apiAccount.cards.length) {
          await Promise.all(apiAccount.cards.map(async apiCard => {
            try {
              (await fetchTransactions(auth, apiCard, fromDate, toDate)).forEach(apiTransaction => {
                const transaction = convertTransaction(apiTransaction, apiAccount)
                if (transaction) {
                  transactions.push(transaction)
                }
              })
            } catch (e) {
              if (e && e.message && e.message.indexOf('временно') >= 0) {
                console.log(`skipping transactions for account ${apiAccount.id} card ${apiCard.id}`)
              } else {
                throw e
              }
            }
          }))
        } else {
          console.log(`skipping transactions for account ${apiAccount.id}`)
        }
      } else {
        throw e
      }
    }
  }))

  // [
  // TODO: remove after test distinct transactions for multiple cards in same credit card account
  const getTransactionFieldsToCompare = readableTransaction => ({
    ...readableTransaction,
    movements: readableTransaction.movements.map(movement => ({ ...movement, id: undefined }))
  })

  creditCardsByCardAccount.forEach(
    ([cardAccountId, cards, mainCard]) => {
      if (cards.length >= 2) {
        const transactionsLength = readableTransactionsByAccountId[mainCard.id].length
        console.assert(
          cards.every(card => readableTransactionsByAccountId[card.id].length === transactionsLength),
          `CreditCard transactions lengths are not equal!`, readableTransactionsByAccountId
        )

        const cardTransactions = cards.map(card => readableTransactionsByAccountId[card.id].map(getTransactionFieldsToCompare).sort((a, b) => a.date > b.date))

        console.assert(
          cardTransactions.every((x, ix) => !ix || _.isEqual(x, cardTransactions[ix - 1])),
          `CreditCard transactions are not equal!`, cardTransactions
        )
      }
    }
  )
  // ]

  return {
    accounts: ensureSyncIDsAreUniqueButSanitized({ accounts: zenAccounts, sanitizeSyncId }),
    transactions: getDistinctTransactions(transactions)
  }
}
