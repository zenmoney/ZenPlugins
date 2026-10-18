import { OtpAccount, OtpCard, OtpTransaction } from './models'
import { decode } from 'html-entities'
import { getArray, getString } from '../../types/get'
import moment from 'moment'

// OTP web client 4.0.2395.0: RetailParameters.DepositAccountProductCodes.
const depositProductCodes = new Set(['3', '6', '18', '19', '24', '25', '26', '27'])

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
  const productCodeCore = getString(apiAccount, '13')
  const isDeposit = depositProductCodes.has(productCodeCore)
  const account: OtpAccount = {
    accountNumber: apiAccount[1],
    productCodeCore,
    isDeposit,
    description: apiAccount[2],
    currencyCode: apiAccount[3],
    balance: parseFloat(apiAccount[5]),
    currencyCodeNumeric: apiAccount[14]
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

export function parseDepositTurnover (body: unknown): OtpTransaction[] {
  // RetailAccountTurnoverTimeDepositDomesticPreviewMasterDetail-L has its own columns.
  return getArray({ body }, 'body').flatMap(group => getArray(group, '1').map(row => {
    const debit = getString(row, '7')
    const credit = getString(row, '8')
    const amount = debit !== '' ? -Number(debit) : Number(credit)
    console.assert((debit !== '' || credit !== '') && Number.isFinite(amount), 'Invalid OTP deposit transaction amount')
    const dateString = getString(row, '3')
    const date = moment(dateString, 'DD.MM.YYYY HH:mm:ss', true)
    console.assert(date.isValid(), 'Invalid OTP deposit transaction date')
    const id = getString(row, '6')
    console.assert(id !== '', 'Missing OTP deposit transaction reference')
    return {
      source: 'depositTurnover' as const,
      id,
      date: date.toDate(),
      amount,
      currencyCode: getString(row, '2'),
      currencyCodeNumeric: getString(row, '1'),
      title: decode(getString(row, '5')).trim(),
      bookingDate: getString(row, '4'),
      status: getString(row, '19'),
      merchant: ''
    }
  }))
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

// Skips GetCardTurnover rows that are not posted yet (placeholder booking and/or hold flag).
function isPendingCardTurnoverRow (row: string[]): boolean {
  const bookingDate = row[4] ?? ''
  if (bookingDate.startsWith('01.01.1900')) {
    return true
  }
  return (row[29] ?? '') === '1'
}

function parseCardTransaction (row: string[], currencyCodeNumeric: string): OtpTransaction | null {
  const parseDate = (dateString: string): Date => {
    const [datePart] = dateString.split(' ')
    const [day, month, year] = datePart.split('.').map(Number)
    return new Date(year, month - 1, day)
  }

  if (isPendingCardTurnoverRow(row)) {
    return null
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
