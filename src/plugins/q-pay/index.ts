import { ScrapeFunc } from '../../types/zenmoney'
import { createClient, fetchAccountGraph, fetchHistory } from './api'
import { convertAccounts, convertTransactions, QPayHistory } from './converters'
import { Preferences } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate, isInBackground }) => {
  ZenMoney.locale = 'ru'
  const client = await createClient(preferences, ZenMoney.getData('session'), ZenMoney.getData('device'), {
    isInBackground,
    saveSession: session => {
      ZenMoney.setData('session', session)
      ZenMoney.saveData()
    },
    saveDevice: device => {
      ZenMoney.setData('device', device)
      ZenMoney.saveData()
    }
  })
  const graph = await fetchAccountGraph(client)
  const plans = convertAccounts(graph)
  const accounts = plans.flatMap(plan => 'accounts' in plan ? plan.accounts : [plan.account])
  assert(accounts.length > 0, 'Q-Pay returned no supported accounts')
  assert(new Set(accounts.map(account => account.id)).size === accounts.length, 'Q-Pay returned duplicate account identifiers')
  const history: QPayHistory = { cards: [] }
  for (const plan of plans) {
    const selected = 'accounts' in plan ? plan.accounts : [plan.account]
    if (plan.fetchParams == null || selected.every(account => ZenMoney.isAccountSkipped(account.id))) continue
    const result = await fetchHistory(client, plan.fetchParams, fromDate, toDate)
    history.cards.push(...result.cards)
  }
  const transactions = convertTransactions(graph, history).filter(transaction => transaction.movements.some(movement =>
    'id' in movement.account && !ZenMoney.isAccountSkipped(movement.account.id)
  ))
  return { accounts, transactions }
}
