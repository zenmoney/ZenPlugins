import { Account, AccountType, ExtendedTransaction, Merchant, NonParsedMerchant } from '../../types/zenmoney'
import { getOptNumber, getOptString } from '../../types/get'
import { ConvertResult, OtpAccount, OtpCard, OtpTransaction } from './models'

export function convertAccounts (apiAccounts: OtpAccount[]): ConvertResult[] {
  const accountsByCba: Record<string, ConvertResult | undefined> = {}
  const accounts: ConvertResult[] = []

  for (const apiAccount of apiAccounts) {
    const res = convertAccount(apiAccount, accountsByCba)
    if (res != null) {
      accounts.push(res)
    }
  }
  return accounts
}

function convertAccount (apiAccount: OtpAccount, accountsByCba: Record<string, ConvertResult | undefined>): ConvertResult | null {
  const cba = apiAccount.accountNumber
  const balance = apiAccount.balance
  let newAccount = false
  let account = accountsByCba[cba]
  if (account == null) {
    account = {
      products: [],
      account: {
        id: cba,
        type: AccountType.ccard,
        title: apiAccount.description ?? cba,
        instrument: apiAccount.currencyCode,
        balance,
        creditLimit: 0,
        syncIds: [cba]
      }
    }
    accountsByCba[cba] = account
    newAccount = true
  }
  account.products.push({
    id: apiAccount.accountNumber,
    source: 'accountTurnover',
    accountNumber: apiAccount.accountNumber,
    currencyCodeNumeric: apiAccount.currencyCodeNumeric
  })

  const pan = getOptString(apiAccount, 'pan')
  if (pan != null) {
    account.account.syncIds.push(pan)
  }

  const moneyAmount = getOptNumber(apiAccount, 'moneyAmount.value')
  if (moneyAmount != null && Number.isFinite(moneyAmount)) {
    account.account.creditLimit = moneyAmount - balance
  }
  return newAccount ? account : null
}

export function convertCards (apiCards: OtpCard[]): ConvertResult[] {
  return apiCards.map(card => {
    const accountId = `virtual_${card.primaryCardId}_${card.currencyCode}`
    return {
      products: [{
        id: accountId,
        source: 'cardTurnover',
        primaryCardId: card.primaryCardId,
        productCodeCore: card.productCodeCore,
        currencyCodeNumeric: card.currencyCodeNumeric,
        accountType: card.currencyCodeNumeric === '941' ? 'DIN' : 'DEV'
      }],
      account: {
        id: accountId,
        type: AccountType.ccard,
        title: `${card.cardTitle} ${card.currencyCode}`,
        instrument: card.currencyCode,
        balance: card.balance,
        creditLimit: 0,
        syncIds: [accountId, card.primaryCardId, card.maskedPan]
      }
    }
  })
}

function parseMerchant (title: string, merchantTitle: unknown = null): Merchant | NonParsedMerchant | null {
  if (merchantTitle !== '') {
    return {
      fullTitle: String(merchantTitle).trim(),
      mcc: null,
      location: null
    }
  }

  if (title.includes(':')) {
    const [, rest] = title.split(':')
    if (rest?.includes('>')) {
      const [merchantName, location] = rest.split('>')
      if (location === '') {
        return {
          title: merchantName.trim(),
          country: null,
          city: null,
          mcc: null,
          location: null
        }
      }

      const locationParts = location.trim().split(/\s+/)
      const country = locationParts.length >= 2 && locationParts[locationParts.length - 1].length === 2
        ? locationParts[locationParts.length - 1]
        : null
      const city = (country != null)
        ? locationParts.slice(0, -1).join(' ').trim()
        : location.trim()

      return {
        title: merchantName.trim(),
        city: city !== '' ? city : null,
        country,
        mcc: null,
        location: null
      }
    }
  }

  if (title.includes(' - ')) {
    const [, merchantName] = title.split(' - ')
    return {
      title: merchantName.trim(),
      country: null,
      city: null,
      mcc: null,
      location: null
    }
  }

  const [merchantName, location] = title.split('/')
  if (location != null && location !== '') {
    return {
      title: merchantName.trim(),
      city: location.trim(),
      country: null,
      mcc: null,
      location: null
    }
  }

  return {
    title: title.trim(),
    country: null,
    city: null,
    mcc: null,
    location: null
  }
}

// Stable movement id so pending and completed with same bank tx id merge in ZenMoney
function movementId (accountId: string, bankTransactionId: string, date: Date): string {
  if (bankTransactionId !== '') {
    return `${accountId}_${bankTransactionId}`
  }
  return `${accountId}_${date.getTime()}`
}

export function convertTransaction (apiTransaction: OtpTransaction, account: Account): ExtendedTransaction {
  const merchant = parseMerchant(apiTransaction.title, apiTransaction.merchant)
  const completed = Boolean(
    (apiTransaction.bookingDate != null && apiTransaction.bookingDate !== '') ||
    (apiTransaction.status != null && apiTransaction.status !== '') ||
    apiTransaction.finalFlag === '0'
  )

  const transaction: ExtendedTransaction = {
    date: apiTransaction.date,
    hold: !completed,
    movements: [
      {
        id: movementId(account.id, apiTransaction.id, apiTransaction.date),
        account: { id: account.id },
        sum: apiTransaction.amount,
        fee: 0,
        invoice: null
      }
    ],
    merchant,
    comment: merchant === null ? apiTransaction.title : null
  }

  return transaction
}

/**
 * Merges transactions by movement.id: when both pending and completed exist for the same id,
 * keeps only the completed one (hold: false) with final sum so ZenMoney sees one updated record.
 */
export function mergeTransactionsByMovementId (transactions: ExtendedTransaction[]): ExtendedTransaction[] {
  const byId = new Map<string, ExtendedTransaction>()
  for (const tx of transactions) {
    const id = tx.movements[0]?.id
    if (id == null) continue
    const existing = byId.get(id)
    if (existing == null) {
      byId.set(id, tx)
      continue
    }
    const preferCompleted = tx.hold === false
    const existingCompleted = existing.hold === false
    if (preferCompleted && !existingCompleted) {
      byId.set(id, tx)
    }
    // else keep existing (either both completed or existing is completed)
  }
  return Array.from(byId.values())
}
