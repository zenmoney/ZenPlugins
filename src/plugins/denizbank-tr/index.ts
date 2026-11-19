import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { Session, Preferences, createDenizBankApi, CardTransaction } from './api'
import { convertAccounts, convertTransaction } from './converters'

function parseSessionData (data: unknown): Session | undefined {
  if (typeof data !== 'object' || data === null) return undefined
  const session = data as Record<string, unknown>
  if (typeof session.clientId !== 'string' || typeof session.token !== 'string' ||
    typeof session.encryptionKey !== 'string' || (typeof session.createdDate !== 'string' && !(session.createdDate instanceof Date)) ||
    typeof session.timeoutSeconds !== 'number' || !Number.isFinite(session.timeoutSeconds) || session.timeoutSeconds <= 0) return undefined
  const createdDate = new Date(session.createdDate instanceof Date ? session.createdDate.valueOf() : session.createdDate)
  if (!Number.isFinite(createdDate.valueOf())) return undefined
  return { clientId: session.clientId, token: session.token, encryptionKey: session.encryptionKey, createdDate, timeoutSeconds: session.timeoutSeconds }
}

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate, isInBackground }) => {
  ZenMoney.locale = 'tr'
  const saveSession = (session: Session): void => {
    ZenMoney.setData('session', session)
    ZenMoney.saveData()
  }
  const denizBankApi = createDenizBankApi(saveSession)
  let session = parseSessionData(ZenMoney.getData('session'))
  session = await denizBankApi.login(preferences, isInBackground, session)

  saveSession(session)

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
