import { ScrapeFunc, Account, Transaction, AccountReferenceByData } from '../../types/zenmoney'
import { parsePdf } from '../../common/pdfUtils'
import { Preferences } from './models'
import { detectLocale, splitSections, parseHeader, parseTransactions } from './parser'
import { isAccountStatement, parseAccountHeader, parseAccountTransactions } from './account-parser'
import { isDepositStatement, parseDepositHeader } from './deposit-parser'
import { convertAccount, convertDeposit, convertTransaction } from './converters'

export async function readPdfTextsSequentially (blobs: Blob[], readPdf: typeof parsePdf = parsePdf): Promise<string[]> {
  const texts: string[] = []

  for (const blob of blobs) {
    const { text } = await readPdf(blob)
    texts.push(text)
  }

  return texts
}

export function relinkInternalTransfers (accounts: Account[], transactions: Transaction[]): Transaction[] {
  const accountBySyncId = new Map<string, Account>()

  for (const account of accounts) {
    for (const syncId of account.syncIds) {
      accountBySyncId.set(syncId, account)
    }
  }

  return transactions.map(transaction => {
    const counterpartMovement = transaction.movements[1]
    if (counterpartMovement == null) {
      return transaction
    }

    const counterpartAccount = counterpartMovement.account as AccountReferenceByData
    const syncIds = counterpartAccount.syncIds ?? []
    const matchedAccount = syncIds
      .map(syncId => accountBySyncId.get(syncId))
      .find((account): account is Account => account != null)

    if (matchedAccount == null) {
      return transaction
    }

    counterpartMovement.account = { id: matchedAccount.id }
    return transaction
  })
}

export const scrape: ScrapeFunc<Preferences> = async () => {
  const blobs = await ZenMoney.pickDocuments(['application/pdf'], true)
  const texts = await readPdfTextsSequentially(blobs)

  const accounts: Account[] = []
  const transactions: Transaction[] = []

  for (const text of texts) {
    try {
      if (isDepositStatement(text)) {
        const parsedHeader = parseDepositHeader(text)
        const parsedTransactions = parseAccountTransactions(text)

        const account = convertDeposit(parsedHeader)

        const existingAccountIndex = accounts.findIndex(a => a.id === account.id)
        if (existingAccountIndex === -1) {
          accounts.push(account)
        }

        const accountTransactions = parsedTransactions.map(pt => convertTransaction(pt, account.id))
        transactions.push(...accountTransactions)
      } else if (isAccountStatement(text)) {
        const parsedHeader = parseAccountHeader(text)
        const parsedTransactions = parseAccountTransactions(text)

        const account = convertAccount(parsedHeader)

        const existingAccountIndex = accounts.findIndex(a => a.id === account.id)
        if (existingAccountIndex === -1) {
          accounts.push(account)
        }

        const accountTransactions = parsedTransactions.map(pt => convertTransaction(pt, account.id))
        transactions.push(...accountTransactions)
      } else {
        const locale = detectLocale(text)
        const sections = splitSections(text, locale)

        const parsedHeader = parseHeader(sections.header, locale)
        const parsedTransactions = parseTransactions(sections.transactions)

        const account = convertAccount(parsedHeader)

        const existingAccountIndex = accounts.findIndex(a => a.id === account.id)
        if (existingAccountIndex === -1) {
          accounts.push(account)
        }

        const accountTransactions = parsedTransactions.map(pt => convertTransaction(pt, account.id))
        transactions.push(...accountTransactions)
      }
    } catch (error) {
      console.error('Failed to parse PDF', error)
      if (error instanceof Error && error.message === 'Unknown locale') {
        throw new Error('The document is not recognized as a Fortebank statement. Please ensure you uploaded the correct PDF file.')
      }
      throw error
    }
  }

  return {
    accounts,
    transactions: relinkInternalTransfers(accounts, transactions)
  }
}
