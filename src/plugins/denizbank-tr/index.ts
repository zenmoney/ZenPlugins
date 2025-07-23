import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { Session, Preferences, denizBankApi, CardTransaction } from './api'
import { convertAccounts, convertTransaction } from './converters'

function parseSessionData (data: unknown): Session | undefined {
  if (typeof data !== 'object') {
    return undefined
  }

  const {
    clientId,
    encryptionKey,
    token,
    createdDate,
    timeoutSeconds
  } = data as {
    clientId: string
    encryptionKey: string
    token: string
    createdDate: string
    timeoutSeconds: number
  }

  return {
    clientId,
    encryptionKey,
    token,
    createdDate: new Date(createdDate),
    timeoutSeconds
  }
}

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate, isInBackground }) => {
  let session = parseSessionData(ZenMoney.getData('session'))
  session = await denizBankApi.login(preferences, isInBackground, session)

  ZenMoney.setData('session', session)
  ZenMoney.saveData()

  const cards = await denizBankApi.fetchCards(session)
  const cardTransactions: Array<CardTransaction & { cardLastFourDigits: string }> = []

  for (const card of cards) {
    const transactions = await denizBankApi.fetchCardTransactions(session, card.guid, fromDate, toDate)

    if (transactions != null) {
      cardTransactions.push(...transactions.map(t => ({ ...t, cardLastFourDigits: card.maskedCardNumber.slice(-4) })))
    }
  }

  const accounts: Account[] = convertAccounts(await denizBankApi.fetchAccounts(session))
  const transactions: Transaction[] = []

  await Promise.all(accounts.map(async (account) => {
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }

    const apiTransactions = await denizBankApi.fetchTransactions(session as Session, account.id, fromDate, toDate)
    for (const apiTransaction of apiTransactions) {
      const cardLastFourDigits = apiTransaction.description?.match(/\*\*\*\*(\d{4})/)?.[1]
      const cardTransaction = cardLastFourDigits != null
        ? cardTransactions.find(
          t => t.cardLastFourDigits === cardLastFourDigits &&
            Math.abs(t.date.valueOf() - apiTransaction.date.valueOf()) < 3000
        )
        : undefined

      const transaction = convertTransaction(apiTransaction, account, cardTransaction)
      transactions.push(transaction)
    }
  }))

  return {
    accounts,
    transactions
  }
}
