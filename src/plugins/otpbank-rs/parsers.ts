import { OtpAccount, OtpCard, OtpTransaction } from './models'
import { decode } from 'html-entities'

export function parseAccounts (apiAccounts: string[][]): OtpAccount[] {
  const accounts: OtpAccount[] = []
  for (const apiAccount of apiAccounts) {
    const res = parseAccount(apiAccount)
    if (res != null) {
      accounts.push(res)
    }
  }
  return accounts
}

function parseAccount (apiAccount: string[]): OtpAccount {
  const moneyAmountValue = parseFloat(apiAccount[6] ?? '')
  const account: OtpAccount = {
    accountNumber: apiAccount[1],
    description: apiAccount[2],
    currencyCode: apiAccount[3],
    balance: parseFloat(apiAccount[5]),
    currencyCodeNumeric: apiAccount[14],
    pan: apiAccount[4] ?? '',
    moneyAmount: Number.isFinite(moneyAmountValue) ? { value: moneyAmountValue } : undefined
  }
  return account
}

export function parseCards (apiCards: string[][]): OtpCard[] {
  const cards: OtpCard[] = []
  for (const apiCard of apiCards) {
    const card = parseCard(apiCard)
    if (card?.isVirtual === true) {
      cards.push(card)
    }
  }
  return cards
}

function parseCard (apiCard: string[]): OtpCard | null {
  const primaryCardId = apiCard[6] ?? ''
  const productCodeCore = apiCard[8] ?? ''
  const cardTitle = apiCard[1] ?? ''
  const maskedPan = apiCard[20] ?? apiCard[32] ?? ''
  const currencyCodeNumeric = apiCard[26] ?? ''
  const currencyCode = apiCard[27] ?? ''
  const accountNumber = apiCard[28] ?? ''
  const balance = parseFloat(apiCard[25] ?? '0')
  const isVirtual = productCodeCore === '9' || cardTitle.toLowerCase().includes('virtual')

  if (primaryCardId === '' || currencyCode === '') {
    return null
  }

  return {
    primaryCardId,
    productCodeCore,
    cardTitle,
    maskedPan,
    currencyCode,
    currencyCodeNumeric,
    balance,
    accountNumber,
    isVirtual
  }
}

export function parseTransactions (apiTransactions: string[][]): OtpTransaction[] {
  const transactions: OtpTransaction[] = []
  for (const apiTransaction of apiTransactions) {
    const res = parseTransaction(apiTransaction)
    if (res != null) {
      transactions.push(res)
    }
  }
  return transactions
}

export function parseTransaction (apiTransaction: string[]): OtpTransaction {
  const parseDate = (dateString: string): Date => {
    const [datePart] = dateString.split(' ')
    const [day, month, year] = datePart.split('.').map(Number)
    return new Date(year, month - 1, day)
  }
  let transactionAmount = 0

  if (apiTransaction[9] !== '') {
    transactionAmount = -parseFloat(apiTransaction[9])
  } else if (apiTransaction[10] !== '') {
    transactionAmount = parseFloat(apiTransaction[10])
  }

  const otpTransaction: OtpTransaction = {
    id: apiTransaction[8],
    date: parseDate(apiTransaction[3]),
    status: apiTransaction[18],
    bookingDate: apiTransaction[7] ?? '',
    finalFlag: apiTransaction[45] ?? '',
    title: decode(apiTransaction[4]),
    amount: transactionAmount,
    currencyCode: (apiTransaction[2] ?? '') !== '' ? apiTransaction[2] : ((apiTransaction[10] ?? '') !== '' ? apiTransaction[10] : ''),
    currencyCodeNumeric: (apiTransaction[1] ?? '') !== '' ? apiTransaction[1] : '',
    merchant: apiTransaction[30]
  }
  return otpTransaction
}

export function parseCardTurnover (responseBody: string[][][][]): OtpTransaction[] {
  if (responseBody.length === 0 || responseBody[0].length < 2) {
    return []
  }

  const currencyCodeNumeric = responseBody[0][0]?.[0]?.[3] ?? ''
  const rows = responseBody[0][1] ?? []
  const transactions: OtpTransaction[] = []

  for (const row of rows) {
    const transaction = parseCardTransaction(row, currencyCodeNumeric)
    if (transaction != null) {
      transactions.push(transaction)
    }
  }

  return transactions
}

function parseCardTransaction (row: string[], currencyCodeNumeric: string): OtpTransaction | null {
  const parseDate = (dateString: string): Date => {
    const [datePart] = dateString.split(' ')
    const [day, month, year] = datePart.split('.').map(Number)
    return new Date(year, month - 1, day)
  }

  const id = row[6] ?? ''
  const title = decode(row[3] ?? '')
  const dateRaw = row[2] ?? ''
  if (id === '' || dateRaw === '') {
    return null
  }

  let amount = 0
  if ((row[7] ?? '') !== '') {
    amount = -parseFloat(row[7])
  } else if ((row[8] ?? '') !== '') {
    amount = parseFloat(row[8])
  }

  return {
    id,
    date: parseDate(dateRaw),
    amount,
    currencyCode: row[10] ?? '',
    currencyCodeNumeric,
    title,
    bookingDate: row[4] ?? '',
    finalFlag: row[29] ?? '',
    merchant: ''
  }
}
