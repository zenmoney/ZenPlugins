import { adjustTransactions } from '../../common/transactionGroupHandler'
import { fetchAccounts, fetchTransactions, generateDevice, getIdGenerator, login, logout } from './api'
import { convertAccounts, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  toDate = toDate || null

  let device = ZenMoney.getData('device')
  if (!device || !device.uuid || device.uuid.length !== 32 ||
    /[^0-9a-f]/.test(device.uuid) ||
    /[^0-9a-f]/.test(device.legacyId)) {
    device = generateDevice()
    ZenMoney.setData('device', device)
    ZenMoney.saveData()
  }

  const idGenerator = getIdGenerator(device)
  try {
    await login(preferences, device, idGenerator)

    const accountsData = convertAccounts(await fetchAccounts(device, idGenerator))
    const accounts = []
    const transactions = []

    await Promise.all(accountsData.map(async ({ product, account }) => {
      accounts.push(account)
      if (ZenMoney.isAccountSkipped(account.id)) {
        return
      }
      for (const apiTransaction of (await fetchTransactions(product, fromDate, toDate, device, idGenerator))) {
        const transaction = convertTransaction(apiTransaction, account)
        if (transaction) {
          transactions.push(transaction)
        }
      }
    }))

    return {
      accounts,
      transactions: adjustTransactions({ transactions })
    }
  } finally {
    await logout(device, idGenerator)
  }
}
