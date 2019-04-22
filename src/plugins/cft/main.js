/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import * as api from './api'
import { converter as cardDataToZenmoneyAccount } from './converters/card'
import { mapContractToAccount } from './converters/helpers'
import { converter as transactionsDataToZenmoneyTransaction } from './converters/transaction'
import { converter as walletDataToZenmoneyAccount } from './converters/wallet'

/**
 * @param fromDate
 * @param toDate
 * @param apiUri
 * @returns {Promise.<*>}
 */
async function scrape ({ fromDate, toDate, apiUri }) {
  const { password, card_number: cardNumber } = ZenMoney.getPreferences()

  console.assert(cardNumber, 'Введите штрих-код карты!')
  console.assert(password, 'Введите пароль в интернет-банк!')

  api.setApiUri(apiUri)

  await api.auth(cardNumber, password)

  const [cardsData, creditData, walletsData, transactionsData] = await Promise.all([
    api.fetchCards(),
    api.fetchCredits(),
    api.fetchWallets(),
    api.fetchTransactions(fromDate)
  ])

  const cards = cardsData.map((data) => cardDataToZenmoneyAccount(data, creditData))
  const wallets = walletsData.map(walletDataToZenmoneyAccount)

  const map = mapContractToAccount(cardsData)
  const transactions = transactionsData.map((data) => transactionsDataToZenmoneyTransaction(data, map))
  const accounts = [].concat(cards, wallets)

  return {
    accounts,
    transactions
  }
}

export {
  scrape
}
