import { fetchProfile, fetchTransactions } from './api'
import { convertAccount, convertAccountTransaction } from './converters'
import _ from 'lodash'

export async function scrape ({ preferences, fromDate, toDate }) {
  let auth = ZenMoney.getData('auth', {})
  const result = await fetchProfile(auth, preferences)
  auth = result.auth

  const transactions = {}

  const cards = result.profile.user.accounts.map(apiAccount => convertAccount(apiAccount))
  const accounts = result.profile.user.safe_accounts.map(apiAccount => convertAccount(apiAccount))
  const deposits = []

  let resultAccounts = {};
  [cards, accounts, deposits].forEach(acc => {
    Object.keys(acc).forEach(index => {
      const account = acc[index]
      const accountId = account.id
      if (resultAccounts.hasOwnProperty(accountId)) {
        console.log(`Обнаружено несколько счетов с одинаковым ID ${accountId} объединяем их: `, resultAccounts, account)
        resultAccounts[accountId].syncID = _.union(resultAccounts[accountId].syncID, account.syncID)
      }
      resultAccounts[accountId] = account
    })
  })

  // ВАЖНО: для определения переводов названия счетов должны различаться
  const titleAccounts = {}
  Object.keys(resultAccounts).forEach(key => {
    const account = resultAccounts[key]
    titleAccounts[account.title] = account
  })

  transactions['accounts'] = await Promise.all(accounts.map(async account => {
    const fetchedTransactions = await fetchTransactions(auth, account.id, fromDate)
    return fetchedTransactions.map(apiTransaction => convertAccountTransaction(apiTransaction, account, titleAccounts))
  }))
  transactions['cards'] = await Promise.all(cards.map(async card => {
    const fetchedTransactions = await fetchTransactions(auth, card.id, fromDate)
    return fetchedTransactions.map(apiTransaction => convertAccountTransaction(apiTransaction, card, titleAccounts))
  }))
  /* console.log('>>> Загружаем вклады: ' + result.profile.user.deposits.length)
  const deposits = result.profile.user.deposits.map(apiDeposit => Converters.convertDeposit(apiDeposit))
  transactions['deposits'] = await Promise.all(Object.keys(deposits).map(async index => {
    const accountId = accounts[index].id
    return (await Api.fetchTransactions(auth, accountId, fromDate)).map(apiTransaction => Converters.convertDepositTransaction(apiTransaction[1], accountId))
  })) */

  const resultTransactions = _.flattenDeep(_.values(transactions))

  ZenMoney.setData('auth', auth)

  return {
    accounts: _.values(resultAccounts),
    transactions: resultTransactions
  }
}
