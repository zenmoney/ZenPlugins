import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { fetchAccounts, fetchTransactions, login, registerDevice } from './api'
import { convertAccounts, convertTransaction } from './converters'
import { Auth, Preferences } from './models'
import forge from 'node-forge'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate, isFirstRun }) => {
  toDate = toDate ?? new Date()
  const passwordSha512 = forge.md.sha512.create().update(preferences.password, 'utf8').digest().toHex()
  ZenMoney.setData('passwordSha512', passwordSha512)
  
  if(isFirstRun){
    const auth = await registerDevice(preferences)
    ZenMoney.setData('auth', auth)
    ZenMoney.saveData()
  }
  const session = await login(preferences, ZenMoney.getData('auth') as Auth)
  ZenMoney.setData('auth', session.auth)
  ZenMoney.saveData()

  const accounts: Account[] = []
  const transactions: Transaction[] = []
  await Promise.all(convertAccounts(await fetchAccounts(session)).map(async ({ account, products }) => {
    accounts.push(account)
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    await Promise.all(products.map(async product => {
      if(product.accountType != '1027'){
        const apiTransactions = await fetchTransactions(session, product, fromDate, toDate!)
        for (const apiTransaction of apiTransactions) {
          transactions.push(convertTransaction(apiTransaction, account))
      }
      }
      
    }))
  }))
  return {
    accounts,
    transactions
  }
}
