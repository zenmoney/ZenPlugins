import { Movement, ScrapeFunc } from '../../types/zenmoney'
import { authenticate, fetchAccountGraph, fetchTransactions, fetchProducts, fetchExchangeDetails, fetchDepositTransactions } from './api'
import { convertAccounts, convertTransactions, verifyDepositHistory } from './converters'
import { Preferences } from './models'

/** Import verified MyAmeria accounts and operations, persisting rotated authorization first. */
export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate, isInBackground }) => {
  ZenMoney.locale = 'ru'
  const auth = await authenticate(preferences, ZenMoney.getData('auth'), async auth => {
    ZenMoney.setData('auth', auth)
    ZenMoney.saveData()
  }, isInBackground)
  const graph = await fetchAccountGraph(auth)
  const products = await fetchProducts(auth, graph)
  const { accounts, fetchParams } = convertAccounts(graph, products)
  if (accounts.every(account => ZenMoney.isAccountSkipped(account.id))) return { accounts, transactions: [] }
  const deposits = fetchParams.deposits.filter(source => !ZenMoney.isAccountSkipped(source.accountId))
  const requestStart = deposits.length > 0 ? armenianMidnight(fromDate) : fromDate
  const requestEnd = toDate == null ? nextArmenianMidnight() : deposits.length > 0 ? new Date(armenianMidnight(toDate).getTime() + 86400000) : toDate
  const history = await fetchTransactions(auth, fetchParams, requestStart, requestEnd)
  const depositMovements: Record<string, string> = {}
  for (const source of deposits) {
    const account = accounts.find(account => account.id === source.accountId)
    if (account === undefined) throw new Error('MyAmeria deposit history account is missing')
    const movements = verifyDepositHistory(await fetchDepositTransactions(auth, source.productId), history, account, fromDate, toDate)
    for (const [id, accountId] of Object.entries(movements)) {
      console.assert(depositMovements[id] === undefined || depositMovements[id] === accountId, 'Conflicting MyAmeria deposit transfer identity')
      depositMovements[id] = accountId
    }
  }
  const details = await fetchExchangeDetails(auth, history)
  const transactions = convertTransactions(history, accounts, details, fromDate, toDate, depositMovements)
    .filter(transaction => transaction.movements.some(isSelectedMovement))
  return { accounts, transactions }
}

/** Fetch complete Armenian days so date-only deposit events can resolve their actual bank timestamps. */
function armenianMidnight (date: Date): Date {
  const offset = 4 * 3600000
  return new Date(Math.floor((date.getTime() + offset) / 86400000) * 86400000 - offset)
}

/** Supply the finite history endpoint boundary at the next Armenian midnight. */
function nextArmenianMidnight (): Date {
  const offset = 4 * 3600000
  const day = 86400000
  const nextDay = Math.floor((Date.now() + offset) / day) + 1
  return new Date(nextDay * day - offset)
}

/** Check whether a movement affects an account included in synchronization. */
function isSelectedMovement (movement: Movement): boolean {
  return 'id' in movement.account && !ZenMoney.isAccountSkipped(movement.account.id)
}
