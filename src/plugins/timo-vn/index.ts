import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { fetchAccounts, fetchTransactions, login} from './api'
import { convertAccounts, convertTransaction } from './converters'
import { Auth, Preferences, AccountType } from './models'
import { generateRandomString } from '../../common/utils'


export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate, isFirstRun }) => {
  toDate = toDate ?? new Date()
  
  if(isFirstRun){
    let auth: Auth = {
      deviceReg:  ''
    }
    auth.deviceReg = generateRandomString(32, 'abcdef0123456789') + ':WEB:WEB:246:WEB:desktop:zenmoney'
    ZenMoney.setData('auth', auth)
    ZenMoney.saveData()
  }
  const session = await login(preferences, ZenMoney.getData('auth') as Auth)

  const accounts: Account[] = []
  const transactions: Transaction[] = []
  await Promise.all(convertAccounts(await fetchAccounts(session)).map(async ({ account, products }) => {
    
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    
    await Promise.all(products.map(async product => {
      //Skip deposits transactions
      if(product.accountType === AccountType.TermDeposit){
        return
      }
      accounts.push(account)
      const apiTransactions = await fetchTransactions(session, product, fromDate, toDate!)
      for (const apiTransaction of apiTransactions) {
        transactions.push(convertTransaction(apiTransaction, account))
      }
    }
  
  ))
  }))
  return {
    accounts,
    transactions
  }
}
