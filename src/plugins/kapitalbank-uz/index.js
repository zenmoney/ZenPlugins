import { adjustTransactions } from '../../common/transactionGroupHandler'
import { coldAuth, createAuth, fetchAccounts, fetchTransactions, hotAuth } from './api'
import { convertAccounts, convertTransaction } from './converters'
import { AuthenticationError } from './fetchApi'

const legacyAuthFields = ['deviceId', 'sessionId', 'requestId', 'guid', 'accessToken', 'refreshToken']

function persistAuth (auth) {
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()
}

function hasLegacyData () {
  return legacyAuthFields.some(key => ZenMoney.getData(key) !== undefined) ||
    ZenMoney.getData('isFirstRun') !== undefined
}

function getStoredAuth () {
  const storedAuth = ZenMoney.getData('auth')
  if (hasLegacyData()) {
    ZenMoney.clearData()
    ZenMoney.saveData()
    return undefined
  }
  return storedAuth && typeof storedAuth === 'object' ? storedAuth : undefined
}

async function fetchData (auth, fromDate, toDate) {
  const accounts = []
  const transactions = []
  const apiAccounts = await fetchAccounts(auth)

  await Promise.all(convertAccounts(apiAccounts).map(async ({ account, products }) => {
    accounts.push(account)
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }

    await Promise.all(products.map(async product => {
      const apiTransactions = await fetchTransactions(auth, product, fromDate, toDate)
      for (const apiTransaction of apiTransactions) {
        const transaction = convertTransaction(apiTransaction, account)
        if (transaction !== null) {
          transactions.push(transaction)
        }
      }
    }))
  }))

  return {
    accounts,
    transactions: adjustTransactions({ transactions, mergeComments: () => null })
  }
}

export async function scrape ({ preferences, fromDate, toDate }) {
  toDate = toDate || new Date()
  let auth = createAuth(getStoredAuth())

  if (!auth.accessToken) {
    auth = await coldAuth(preferences, auth)
    persistAuth(auth)
  }

  try {
    return await fetchData(auth, fromDate, toDate)
  } catch (e) {
    if (!(e instanceof AuthenticationError)) {
      throw e
    }
  }

  auth = await hotAuth(preferences, auth)
  persistAuth(auth)
  return fetchData(auth, fromDate, toDate)
}
